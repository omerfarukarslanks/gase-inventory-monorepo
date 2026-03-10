// formatCurrency and formatCount are now canonical in @gase/core.
// Re-exported here so existing imports (`@/src/lib/format`) keep working.
export { formatCurrency, formatCount } from "@gase/core";
export type { Currency } from "@gase/core";

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function toNumber(value: string | number | null | undefined, fallback = 0): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : fallback;
}

export function toNullableNumber(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}
