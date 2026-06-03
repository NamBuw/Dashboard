"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ProductKey = "all" | "ptalk" | "kid" | "elder";

interface ProductCtx {
  active: ProductKey;
  setActive: (p: ProductKey) => void;
}

const Ctx = createContext<ProductCtx>({ active: "all", setActive: () => {} });
const STORAGE_KEY = "cts-product";

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [active, setActiveState] = useState<ProductKey>("all");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY) as ProductKey | null;
      if (stored === "all" || stored === "ptalk" || stored === "kid" || stored === "elder") {
        setActiveState(stored);
      }
    } catch { /* ignore */ }
  }, []);

  const setActive = useCallback((p: ProductKey) => {
    setActiveState(p);
    try { sessionStorage.setItem(STORAGE_KEY, p); } catch { /* ignore */ }
  }, []);

  return <Ctx.Provider value={{ active, setActive }}>{children}</Ctx.Provider>;
}

export function useProduct() {
  return useContext(Ctx);
}

/** Map a product key to the `source` value used by /api/chat. Returns null when no scope. */
export function productToChatSource(p: ProductKey): string | null {
  if (p === "kid") return "kids";
  if (p === "elder") return "eldercare";
  return null;
}
