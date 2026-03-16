// All format utilities are now canonical in @gase/core.
// Re-exported here so existing imports (`@/src/lib/format`) keep working.
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

// toNullableNumber is the mobile alias for toNumberOrNull.
export { toNumberOrNull as toNullableNumber } from "@gase/core";
