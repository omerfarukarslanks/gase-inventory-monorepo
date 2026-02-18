export function formatPrice(val: number | string | null | undefined): string {
  if (val == null) return "-";
  const numeric = Number(val);
  if (Number.isNaN(numeric)) return "-";
  return numeric.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function toNumberOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
