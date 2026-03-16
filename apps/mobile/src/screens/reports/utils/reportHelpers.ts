import { getDateRange, formatPercent, formatReportDateLabel } from "@gase/core";
import type { ReportsRange } from "../types";

export { formatPercent, formatReportDateLabel };

export function getDateScope(range: ReportsRange) {
  const days = range === "30d" ? 30 : 7;
  const { startDate, endDate } = getDateRange(days);
  return {
    startDate,
    endDate,
    compareDate: startDate,
  };
}
