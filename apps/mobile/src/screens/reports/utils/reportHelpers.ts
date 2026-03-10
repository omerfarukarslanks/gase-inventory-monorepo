import { formatDate } from "@/src/lib/format";
import type { ReportsRange } from "../types";

export function getDateScope(range: ReportsRange) {
  const today = new Date();
  const start = new Date(today.getTime() - (range === "30d" ? 29 : 6) * 86400000);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: today.toISOString().slice(0, 10),
    compareDate: start.toISOString().slice(0, 10),
  };
}

export function formatPercent(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "-";
  return `%${amount.toFixed(1)}`;
}

export function formatReportDateLabel(value: string | null | undefined): string {
  if (!value) return "-";
  if (/^\d{4}-\d{2}$/.test(value)) {
    return value;
  }
  return formatDate(value);
}
