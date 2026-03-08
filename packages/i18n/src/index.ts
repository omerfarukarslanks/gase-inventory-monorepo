import ar from "./locales/ar";
import de from "./locales/de";
import en from "./locales/en";
import es from "./locales/es";
import tr from "./locales/tr";

export const locales = {
  tr,
  en,
  es,
  de,
  ar,
} as const;

export type Locale = keyof typeof locales;

export const rtlLocales = new Set<Locale>(["ar"]);

export function translate(locale: Locale, key: string): string {
  const dict = locales[locale] ?? locales.tr;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value = key.split(".").reduce((node: any, part: string) => node?.[part], dict);
  return typeof value === "string" ? value : key;
}
