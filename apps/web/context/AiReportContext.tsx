"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AiReportContext } from "@/lib/analytics";

const STORAGE_KEY = "web:ai-report-context";

type AiReportContextValue = {
  context: AiReportContext | null;
  setContext: (value: AiReportContext | null) => void;
  clearContext: () => void;
};

const Context = createContext<AiReportContextValue | null>(null);

function readStoredContext(): AiReportContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AiReportContext;
  } catch {
    return null;
  }
}

export function AiReportContextProvider({ children }: { children: ReactNode }) {
  const [context, setContextState] = useState<AiReportContext | null>(() => readStoredContext());

  const setContext = useCallback((value: AiReportContext | null) => {
    setContextState(value);
  }, []);

  const clearContext = useCallback(() => {
    setContextState(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (context) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
      return;
    }
    window.sessionStorage.removeItem(STORAGE_KEY);
  }, [context]);

  const value = useMemo<AiReportContextValue>(
    () => ({
      context,
      setContext,
      clearContext,
    }),
    [clearContext, context, setContext],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAiReportContext() {
  const value = useContext(Context);
  if (!value) {
    throw new Error("useAiReportContext must be used within AiReportContextProvider");
  }
  return value;
}
