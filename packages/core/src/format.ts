import type { Currency } from "./products";

/**
 * Format a numeric value as a currency string using Turkish locale.
 * Returns "-" for null, undefined, or non-finite values.
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currency: Currency = "TRY",
): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "-";

  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Format a numeric value as a locale-formatted count string using Turkish locale.
 * Returns "-" for null, undefined, or non-finite values.
 */
export function formatCount(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "-";
  return amount.toLocaleString("tr-TR");
}
