"use client";

import { useCallback, useEffect, useState } from "react";

// A boolean toggle backed by localStorage, so a reader preference (e.g. reading
// mode) persists across pages. Reads the stored value on mount.
export function usePersistentToggle(
  key: string,
  initial = false,
): [boolean, () => void] {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(key);
    if (stored !== null) setValue(stored === "1");
  }, [key]);

  const toggle = useCallback(() => {
    setValue((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, next ? "1" : "0");
      }
      return next;
    });
  }, [key]);

  return [value, toggle];
}
