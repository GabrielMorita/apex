"use client";
import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored) as T);
    } catch { /* ignore */ }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { console.warn("localStorage error:", key); }
  }, [key, value, hydrated]);

  return [value, setValue] as const;
}
