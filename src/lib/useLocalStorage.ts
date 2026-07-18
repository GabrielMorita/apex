"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/components/auth/AuthProvider";

const LOCAL_SYNC_EVENT = "apex:local-storage";
const CLOUD_SYNC_EVENT = "apex:cloud-sync";
type LocalSyncDetail<T> = { key: string; value: T };
type CloudSyncDetail = { key: string; status: "syncing" | "synced" | "error" };

const cloudCache = new Map<string, unknown>();
const cloudLoaders = new Map<string, Promise<unknown>>();
const cloudWriteTimers = new Map<string, ReturnType<typeof setTimeout>>();

function isEqual(a: unknown, b: unknown) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return Object.is(a, b);
  }
}

function emitCloudStatus(key: string, status: CloudSyncDetail["status"]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CloudSyncDetail>(CLOUD_SYNC_EVENT, { detail: { key, status } }));
}

async function loadCloudValue<T>(userId: string, key: string, localValue: T): Promise<T> {
  const cacheKey = `${userId}:${key}`;
  if (cloudCache.has(cacheKey)) return cloudCache.get(cacheKey) as T;
  if (cloudLoaders.has(cacheKey)) return cloudLoaders.get(cacheKey) as Promise<T>;

  const loader = (async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_module_state")
      .select("payload")
      .eq("user_id", userId)
      .eq("storage_key", key)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      const remoteValue = data.payload as T;
      cloudCache.set(cacheKey, remoteValue);
      return remoteValue;
    }

    const { error: insertError } = await supabase.from("user_module_state").upsert(
      { user_id: userId, storage_key: key, payload: localValue as Json },
      { onConflict: "user_id,storage_key" },
    );

    if (insertError) throw insertError;
    cloudCache.set(cacheKey, localValue);
    return localValue;
  })();

  cloudLoaders.set(cacheKey, loader);
  try {
    return await loader;
  } finally {
    cloudLoaders.delete(cacheKey);
  }
}

function scheduleCloudWrite<T>(userId: string, key: string, value: T) {
  const cacheKey = `${userId}:${key}`;
  const previousTimer = cloudWriteTimers.get(cacheKey);
  if (previousTimer) clearTimeout(previousTimer);

  emitCloudStatus(key, "syncing");
  const timer = setTimeout(async () => {
    try {
      const { error } = await createClient().from("user_module_state").upsert(
        { user_id: userId, storage_key: key, payload: value as Json },
        { onConflict: "user_id,storage_key" },
      );
      if (error) throw error;
      cloudCache.set(cacheKey, value);
      emitCloudStatus(key, "synced");
    } catch (error) {
      console.warn("Supabase sync error:", key, error);
      emitCloudStatus(key, "error");
    } finally {
      cloudWriteTimers.delete(cacheKey);
    }
  }, 650);

  cloudWriteTimers.set(cacheKey, timer);
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const { user, loading: authLoading } = useAuth();
  const [value, setValue] = useState<T>(initialValue);
  const initialValueRef = useRef(initialValue);
  const [hydrated, setHydrated] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const valueRef = useRef(value);
  const userId = user?.id ?? null;
  const storageKey = useMemo(() => (userId ? `${key}::${userId}` : key), [key, userId]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (authLoading) return;

    setHydrated(false);
    setCloudReady(false);

    try {
      let stored = localStorage.getItem(storageKey);

      // Migra automaticamente os dados da versão antiga para o primeiro usuário autenticado.
      if (!stored && userId) {
        const legacy = localStorage.getItem(key);
        if (legacy) {
          stored = legacy;
          localStorage.setItem(storageKey, legacy);
          localStorage.removeItem(key);
        }
      }

      setValue(stored ? (JSON.parse(stored) as T) : initialValueRef.current);
    } catch {
      setValue(initialValueRef.current);
    }

    setHydrated(true);
  }, [authLoading, key, storageKey, userId]);

  useEffect(() => {
    if (!hydrated || !userId || !isSupabaseConfigured()) return;
    let active = true;

    emitCloudStatus(key, "syncing");
    void loadCloudValue(userId, key, valueRef.current)
      .then((remoteValue) => {
        if (!active) return;
        if (!isEqual(valueRef.current, remoteValue)) setValue(remoteValue);
        setCloudReady(true);
        emitCloudStatus(key, "synced");
      })
      .catch((error) => {
        console.warn("Supabase hydration error:", key, error);
        if (active) setCloudReady(true);
        emitCloudStatus(key, "error");
      });

    return () => {
      active = false;
    };
  }, [hydrated, key, userId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent<LocalSyncDetail<T>>(LOCAL_SYNC_EVENT, { detail: { key: storageKey, value } }));
    } catch {
      console.warn("localStorage error:", storageKey);
    }

    if (userId && cloudReady && isSupabaseConfigured()) scheduleCloudWrite(userId, key, value);
  }, [cloudReady, hydrated, key, storageKey, userId, value]);

  useEffect(() => {
    function apply(next: T) {
      if (!isEqual(valueRef.current, next)) setValue(next);
    }
    function onCustom(event: Event) {
      const detail = (event as CustomEvent<LocalSyncDetail<T>>).detail;
      if (detail?.key === storageKey) apply(detail.value);
    }
    function onStorage(event: StorageEvent) {
      if (event.key !== storageKey || event.newValue === null) return;
      try {
        apply(JSON.parse(event.newValue) as T);
      } catch {
        // Ignora conteúdo inválido.
      }
    }
    window.addEventListener(LOCAL_SYNC_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(LOCAL_SYNC_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [storageKey]);

  return [value, setValue] as const;
}

export { CLOUD_SYNC_EVENT };
export type { CloudSyncDetail };
