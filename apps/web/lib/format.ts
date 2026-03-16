// All format utilities are now canonical in @gase/core.
// Re-exported here so existing imports (`@/lib/format`) keep working.
export {
  formatCurrency,
  formatCount,
  formatDate,
  formatPrice,
  formatPercent,
  formatReportDateLabel,
  toNumber,
  toNumberOrNull,
  getDateRange,
} from "@gase/core";
export type { Currency } from "@gase/core";
