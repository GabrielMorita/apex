"use client";
import { useEffect, useRef, useState } from "react";

const LOCAL_SYNC_EVENT = "apex:local-storage";
type LocalSyncDetail<T> = { key: string; value: T };

function isEqual(a: unknown, b: unknown) {
  try { return JSON.stringify(a) === JSON.stringify(b); }
  catch { return Object.is(a, b); }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);
  const valueRef = useRef(value);

  useEffect(() => { valueRef.current = value; }, [value]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored) as T);
    } catch { /* mantém o valor inicial */ }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent<LocalSyncDetail<T>>(LOCAL_SYNC_EVENT, { detail: { key, value } }));
    } catch { console.warn("localStorage error:", key); }
  }, [key, value, hydrated]);

  useEffect(() => {
    function apply(next: T) {
      if (!isEqual(valueRef.current, next)) setValue(next);
    }
    function onCustom(event: Event) {
      const detail = (event as CustomEvent<LocalSyncDetail<T>>).detail;
      if (detail?.key === key) apply(detail.value);
    }
    function onStorage(event: StorageEvent) {
      if (event.key !== key || event.newValue === null) return;
      try { apply(JSON.parse(event.newValue) as T); }
      catch { /* ignora conteúdo inválido */ }
    }
    window.addEventListener(LOCAL_SYNC_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(LOCAL_SYNC_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [key]);

  return [value, setValue] as const;
}
