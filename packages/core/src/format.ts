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

/**
 * Format an ISO date string to Turkish locale datetime (dd.MM.yyyy HH:mm).
 * Returns "-" for null, undefined, or invalid date strings.
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Parse a string/number to a finite number with a fallback.
 * Returns the fallback (default 0) for non-finite or unconvertible values.
 */
export function toNumber(value: string | number | null | undefined, fallback = 0): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : fallback;
}

/**
 * Parse a string/number to a finite number or null.
 * Returns null for empty strings, null/undefined, or non-finite values.
 */
export function toNumberOrNull(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

/**
 * Format a numeric value as a decimal string using Turkish locale (2 decimal places).
 * Similar to formatCurrency but without the currency symbol.
 * Returns "-" for null, undefined, or non-finite values.
 */
export function formatPrice(value: number | string | null | undefined): string {
  if (value == null) return "-";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  return numeric.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a numeric value as a percentage string (e.g. "%12.5").
 * Returns "-" for null, undefined, or non-finite values.
 */
export function formatPercent(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "-";
  return `%${amount.toFixed(1)}`;
}

/**
 * Format a report date label.
 * Passes through "yyyy-MM" month labels unchanged.
 * Delegates full date strings to formatDate.
 */
export function formatReportDateLabel(value: string | null | undefined): string {
  if (!value) return "-";
  if (/^\d{4}-\d{2}$/.test(value)) return value;
  return formatDate(value);
}

/**
 * Compute a date range of `days` days ending today (inclusive).
 * Returns ISO date strings (yyyy-MM-dd).
 */
export function getDateRange(days: number): { startDate: string; endDate: string } {
  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  return { startDate, endDate };
}
