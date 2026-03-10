import type {
  getReportCancellations,
  getReportConfirmedOrders,
  getReportReturns,
  getReportSalesSummary,
  getReportStockTotal,
  LowStockItem,
  RevenueTrendItem,
  SalesByProductItem,
  CancellationItem,
} from "@gase/core";

export type BadgeTone = "positive" | "warning" | "danger" | "neutral" | "info";
export type ReportsRange = "7d" | "30d";
export type ReportDetailKey =
  | "sales-summary"
  | "cancellations"
  | "product-performance"
  | "supplier-performance"
  | "stock-summary"
  | "low-stock"
  | "dead-stock"
  | "inventory-movements"
  | "turnover"
  | "revenue-trend"
  | "profit-margin"
  | "discount-summary"
  | "vat-summary"
  | "store-performance"
  | "employee-performance"
  | "customers";

export type ReportsState = {
  loading: boolean;
  error: string;
  salesSummary: Awaited<ReturnType<typeof getReportSalesSummary>> | null;
  stockTotal: Awaited<ReturnType<typeof getReportStockTotal>> | null;
  confirmedOrders: Awaited<ReturnType<typeof getReportConfirmedOrders>> | null;
  returns: Awaited<ReturnType<typeof getReportReturns>> | null;
  revenueTrend: RevenueTrendItem[];
  productSales: SalesByProductItem[];
  lowStock: LowStockItem[];
  cancellations: CancellationItem[];
};

export type ReportMetric = {
  key: string;
  label: string;
  value: string;
  hint?: string;
};

export type ReportStat = {
  label: string;
  value: string;
};

export type ReportListItem = {
  key: string;
  title: string;
  subtitle?: string;
  caption?: string;
  badgeLabel?: string;
  badgeTone?: BadgeTone;
};

export type ReportBarItem = {
  key: string;
  label: string;
  value: number;
};

export type ReportSection =
  | { type: "stats"; title: string; items: ReportStat[] }
  | { type: "bars"; title: string; items: ReportBarItem[]; formatter?: (value: number) => string }
  | { type: "list"; title: string; items: ReportListItem[]; emptyTitle: string; emptySubtitle: string };

export type ReportDetailModel = {
  title: string;
  subtitle: string;
  metrics: ReportMetric[];
  sections: ReportSection[];
  note?: string;
};

export type DetailState = {
  loading: boolean;
  error: string;
  model: ReportDetailModel | null;
};

export type CatalogItem = {
  key: ReportDetailKey;
  title: string;
  description: string;
};

export const rangeOptions = [
  { label: "7 gun", value: "7d" as const },
  { label: "30 gun", value: "30d" as const },
];

export const initialState: ReportsState = {
  loading: true,
  error: "",
  salesSummary: null,
  stockTotal: null,
  confirmedOrders: null,
  returns: null,
  revenueTrend: [],
  productSales: [],
  lowStock: [],
  cancellations: [],
};

export const initialDetailState: DetailState = {
  loading: false,
  error: "",
  model: null,
};
