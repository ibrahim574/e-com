"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  COMPARE_COOKIE,
  COMPARE_EVENT,
  COMPARE_MAX,
  parseCompareCookie,
} from "@/lib/compare";

type CompareContextValue = {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  max: number;
};

const CompareContext = createContext<CompareContextValue | null>(null);

function readCookie(): string[] {
  if (typeof document === "undefined") return [];
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COMPARE_COOKIE}=`));
  return parseCompareCookie(match ? decodeURIComponent(match.split("=")[1]) : "");
}

function writeCookie(ids: string[]) {
  if (typeof document === "undefined") return;
  const value = ids.join(",");
  document.cookie = `${COMPARE_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${
    60 * 60 * 24 * 30
  }; samesite=lax`;
  window.dispatchEvent(new Event(COMPARE_EVENT));
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readCookie());
    const sync = () => setIds(readCookie());
    window.addEventListener(COMPARE_EVENT, sync);
    return () => window.removeEventListener(COMPARE_EVENT, sync);
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= COMPARE_MAX
          ? prev
          : [...prev, id];
      writeCookie(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.filter((x) => x !== id);
      writeCookie(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setIds([]);
    writeCookie([]);
  }, []);

  const value = useMemo<CompareContextValue>(
    () => ({
      ids,
      has: (id: string) => ids.includes(id),
      toggle,
      remove,
      clear,
      max: COMPARE_MAX,
    }),
    [ids, toggle, remove, clear],
  );

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return ctx;
}
