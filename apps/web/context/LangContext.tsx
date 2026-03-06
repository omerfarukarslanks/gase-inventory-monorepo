"use client";

import { createContext, useContext, useEffect, useState } from "react";
import tr from "@/locales/tr";
import en from "@/locales/en";
import es from "@/locales/es";
import de from "@/locales/de";

export type Lang = "tr" | "en" | "es" | "de";

type Dict = typeof tr;

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
};

const LangContext = createContext<LangContextValue>({
  lang: "tr",
  setLang: () => {},
  t: (key) => key,
});

const DICTS: Record<Lang, Dict> = {
  tr,
  en,
  es,
  de,
};

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "tr";
    return (localStorage.getItem("lang") as Lang) ?? "tr";
  });

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Lang) => setLangState(next);
  const dict = DICTS[lang] ?? tr;

  const t = (key: string): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = key.split(".").reduce((obj: any, k) => obj?.[k], dict);
    return typeof value === "string" ? value : key;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
