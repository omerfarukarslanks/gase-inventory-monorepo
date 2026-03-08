import { apiFetch } from "./api";

export type ReportScopeQuery = {
  storeIds?: string[];
  startDate?: string;
  endDate?: string;
  compareDate?: string;
  search?: string;
  page?: number;
  limit?: number;
};

function buildScopeQuery(params: ReportScopeQuery): string {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  if (params.compareDate) query.set("compareDate", params.compareDate);
  if (params.search) query.set("search", params.search);
  (params.storeIds ?? []).forEach((id) => {
    if (id) query.append("storeIds", id);
  });
  return query.toString();
}

export type SalesSummaryResponse = {
  scope?: unknown;
  period?: { startDate?: string; endDate?: string };
  totals?: {
    saleCount?: number;
    confirmedCount?: number;
    cancelledCount?: number;
    totalUnitPrice?: number;
    totalLineTotal?: number;
    averageBasket?: number;
    cancelRate?: number;
  };
};

export async function getReportSalesSummary(params: ReportScopeQuery = {}): Promise<SalesSummaryResponse> {
  const q = buildScopeQuery(params);
  return apiFetch<SalesSummaryResponse>(`/reports/sales/summary${q ? `?${q}` : ""}`);
}

export type StockTotalResponse = {
  totals?: { todayTotalQuantity?: number };
  comparison?: {
    baseDate?: string;
    baseTotalQuantity?: number;
    todayTotalQuantity?: number;
    changePercent?: number;
    trend?: string;
  };
  daily?: Array<{ date?: string; totalQuantity?: number }>;
};

export async function getReportStockTotal(params: ReportScopeQuery = {}): Promise<StockTotalResponse> {
  const q = buildScopeQuery(params);
  return apiFetch<StockTotalResponse>(`/reports/stock/total-quantity${q ? `?${q}` : ""}`);
}

export type ConfirmedOrdersResponse = {
  totals?: {
    orderCount?: number;
    totalUnitPrice?: number;
    totalLineTotal?: number;
  };
  comparison?: {
    baseDate?: string;
    baseOrderCount?: number;
    todayOrderCount?: number;
    changePercent?: number;
    trend?: string;
  };
  daily?: Array<{ date?: string; orderCount?: number; totalLinePrice?: number }>;
};

export async function getReportConfirmedOrders(params: ReportScopeQuery = {}): Promise<ConfirmedOrdersResponse> {
  const q = buildScopeQuery(params);
  return apiFetch<ConfirmedOrdersResponse>(`/reports/orders/confirmed/total${q ? `?${q}` : ""}`);
}

export type ReturnsResponse = {
  totals?: {
    orderCount?: number;
    totalUnitPrice?: number;
    totalLineTotal?: number;
  };
  comparison?: {
    changePercent?: number;
    trend?: string;
  };
};

export async function getReportReturns(params: ReportScopeQuery = {}): Promise<ReturnsResponse> {
  const q = buildScopeQuery(params);
  return apiFetch<ReturnsResponse>(`/reports/orders/returns/total${q ? `?${q}` : ""}`);
}

export type RevenueTrendQuery = ReportScopeQuery & {
  groupBy?: "day" | "week" | "month";
};

export type RevenueTrendItem = {
  period?: string;
  saleCount?: number;
  currency?: string;
  totalRevenue?: number;
  totalUnitPrice?: number;
  averageBasket?: number;
  changePercent?: number;
  trend?: string;
};

export type RevenueTrendResponse = {
  groupBy?: string;
  data?: RevenueTrendItem[];
};

export async function getReportRevenueTrend(params: RevenueTrendQuery = {}): Promise<RevenueTrendResponse> {
  const query = new URLSearchParams();
  if (params.groupBy) query.set("groupBy", params.groupBy);
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  (params.storeIds ?? []).forEach((id) => {
    if (id) query.append("storeIds", id);
  });
  const q = query.toString();
  return apiFetch<RevenueTrendResponse>(`/reports/financial/revenue-trend${q ? `?${q}` : ""}`);
}

export type SalesByProductItem = {
  productId?: string;
  productName?: string;
  productVariantId?: string;
  variantName?: string;
  variantCode?: string;
  quantity?: number;
  totalUnitPrice?: number;
  totalDiscount?: number;
  totalTax?: number;
  lineTotal?: number;
  avgUnitPrice?: number;
};

export type SalesByProductResponse = {
  data?: SalesByProductItem[];
  totals?: {
    totalQuantity?: number;
    totalUnitPrice?: number;
    totalDiscount?: number;
    totalTax?: number;
    totalLineTotal?: number;
  };
};

export async function getReportSalesByProduct(params: ReportScopeQuery = {}): Promise<SalesByProductResponse> {
  const q = buildScopeQuery(params);
  return apiFetch<SalesByProductResponse>(`/reports/sales/by-product${q ? `?${q}` : ""}`);
}

export type LowStockQuery = ReportScopeQuery & {
  threshold?: number;
};

export type LowStockItem = {
  storeId?: string;
  storeName?: string;
  productId?: string;
  productName?: string;
  productVariantId?: string;
  variantName?: string;
  variantCode?: string;
  quantity?: number;
  isActive?: boolean;
};

export type LowStockResponse = {
  threshold?: number;
  data?: LowStockItem[];
  meta?: { total?: number; limit?: number; page?: number; totalPages?: number };
};

export async function getReportLowStock(params: LowStockQuery = {}): Promise<LowStockResponse> {
  const query = new URLSearchParams();
  if (params.threshold != null) query.set("threshold", String(params.threshold));
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  (params.storeIds ?? []).forEach((id) => {
    if (id) query.append("storeIds", id);
  });
  const q = query.toString();
  return apiFetch<LowStockResponse>(`/reports/stock/low${q ? `?${q}` : ""}`);
}

export type CancellationItem = {
  id?: string;
  receiptNo?: string;
  name?: string;
  surname?: string;
  phoneNumber?: string;
  email?: string;
  currency?: string;
  unitPrice?: number;
  lineTotal?: number;
  cancelledAt?: string;
  createdAt?: string;
  meta?: Record<string, unknown>;
  cancelMeta?: Record<string, unknown>;
  store?: { id?: string; name?: string };
};

export type CancellationsResponse = {
  data?: CancellationItem[];
  totals?: {
    cancelledCount?: number;
    totalUnitPrice?: number;
    totalLineTotal?: number;
  };
  meta?: { total?: number; limit?: number; page?: number; totalPages?: number };
};

export async function getReportCancellations(params: ReportScopeQuery = {}): Promise<CancellationsResponse> {
  const q = buildScopeQuery(params);
  return apiFetch<CancellationsResponse>(`/reports/sales/cancellations${q ? `?${q}` : ""}`);
}
