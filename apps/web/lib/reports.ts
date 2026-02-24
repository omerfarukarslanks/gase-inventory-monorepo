import { apiFetch } from "@/lib/api";

/* ── Ortak query parametreleri ── */
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

/* ── Sales Summary ── */
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

/* ── Stock Total Quantity ── */
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

/* ── Confirmed Orders Total ── */
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

/* ── Returns Total ── */
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

/* ── Revenue Trend ── */
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

/* ── Sales By Product ── */
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

/* ── Low Stock ── */
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

/* ── Sales Cancellations ── */
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

/* ── Store Performance ── */
export type StorePerformanceItem = {
  storeId?: string;
  storeName?: string;
  storeCode?: string;
  currency?: string;
  saleCount?: number;
  confirmedCount?: number;
  cancelledCount?: number;
  totalUnitPrice?: number;
  totalLineTotal?: number;
  averageBasket?: number;
  cancelRate?: number;
};

export type StorePerformanceResponse = {
  data?: StorePerformanceItem[];
  totals?: {
    totalSales?: number;
    totalConfirmed?: number;
    totalCancelled?: number;
    totalUnitPrice?: number;
    totalLineTotal?: number;
  };
  meta?: { total?: number; limit?: number; page?: number; totalPages?: number };
};

export async function getReportStorePerformance(params: ReportScopeQuery = {}): Promise<StorePerformanceResponse> {
  const q = buildScopeQuery(params);
  return apiFetch<StorePerformanceResponse>(`/reports/stores/performance${q ? `?${q}` : ""}`);
}

/* ── Supplier Sales Performance ── */
export type SupplierSalesPerformanceItem = {
  supplierId?: string;
  supplierName?: string;
  supplierSurname?: string;
  supplierPhoneNumber?: string;
  supplierEmail?: string;
  saleCount?: number;
  productCount?: number;
  variantCount?: number;
  quantity?: number;
  currency?: string;
  totalUnitPrice?: number;
  totalDiscount?: number;
  totalTax?: number;
  lineTotal?: number;
  avgUnitPrice?: number;
};

export type SupplierSalesPerformanceResponse = {
  scope?: unknown;
  period?: { startDate?: string; endDate?: string };
  filters?: { search?: string | null };
  data?: SupplierSalesPerformanceItem[];
  totals?: {
    totalSuppliers?: number;
    totalSales?: number;
    totalProducts?: number;
    totalVariants?: number;
    totalQuantity?: number;
    totalUnitPrice?: number;
    totalDiscount?: number;
    totalTax?: number;
    totalLineTotal?: number;
  };
  meta?: { total?: number; limit?: number; page?: number; totalPages?: number };
};

export async function getReportSupplierSalesPerformance(
  params: ReportScopeQuery = {},
): Promise<SupplierSalesPerformanceResponse> {
  const q = buildScopeQuery(params);
  return apiFetch<SupplierSalesPerformanceResponse>(`/reports/suppliers/sales-performance${q ? `?${q}` : ""}`);
}

/* ── Product Performance Ranking ── */
export type ProductRankingItem = {
  rank?: number;
  productId?: string;
  productName?: string;
  productVariantId?: string;
  variantName?: string;
  variantCode?: string;
  currency?: string;
  soldQuantity?: number;
  totalRevenue?: number;
  saleCount?: number;
  currentStock?: number;
  stockStatus?: string;
};

export type ProductRankingResponse = {
  data?: ProductRankingItem[];
  meta?: { total?: number; limit?: number; page?: number; totalPages?: number };
};

export async function getReportProductRanking(params: ReportScopeQuery = {}): Promise<ProductRankingResponse> {
  const q = buildScopeQuery(params);
  return apiFetch<ProductRankingResponse>(`/reports/products/performance-ranking${q ? `?${q}` : ""}`);
}

/* ── Stock Summary ── */
export type StockSummaryVariantStore = {
  storeId?: string;
  storeName?: string;
  quantity?: number;
  totalQuantity?: number;
  isActive?: boolean;
};

export type StockSummaryVariant = {
  productVariantId?: string;
  variantName?: string;
  variantCode?: string;
  totalQuantity?: number;
  stores?: StockSummaryVariantStore[];
};

export type StockSummaryProduct = {
  productId?: string;
  productName?: string;
  totalQuantity?: number;
  variants?: StockSummaryVariant[];
};

export type StockSummaryResponse = {
  data?: StockSummaryProduct[];
  totalQuantity?: number;
  meta?: { total?: number; limit?: number; page?: number; totalPages?: number };
};

export async function getReportStockSummary(params: ReportScopeQuery = {}): Promise<StockSummaryResponse> {
  const q = buildScopeQuery(params);
  return apiFetch<StockSummaryResponse>(`/reports/stock/summary${q ? `?${q}` : ""}`);
}

/* ── Inventory Movements Summary ── */
export type MovementItem = {
  id?: string;
  createdAt?: string;
  type?: string;
  quantity?: number;
  currency?: string;
  unitPrice?: number;
  lineTotal?: number;
  campaignCode?: string;
  store?: { id?: string; name?: string };
  product?: { id?: string; name?: string };
  productVariant?: { id?: string; name?: string; code?: string };
};

export type MovementSummaryByType = {
  type?: string;
  movementCount?: number;
  totalQuantity?: number;
};

export type MovementsResponse = {
  summaryByType?: MovementSummaryByType[];
  totals?: { movementCount?: number; netQuantity?: number };
  data?: MovementItem[];
  meta?: { total?: number; limit?: number; page?: number; totalPages?: number };
};

export async function getReportMovements(params: ReportScopeQuery = {}): Promise<MovementsResponse> {
  const q = buildScopeQuery(params);
  return apiFetch<MovementsResponse>(`/reports/inventory/movements/summary${q ? `?${q}` : ""}`);
}

/* ── Profit Margin ── */
export type ProfitMarginItem = {
  productId?: string;
  productName?: string;
  productVariantId?: string;
  variantName?: string;
  variantCode?: string;
  currency?: string;
  soldQuantity?: number;
  totalRevenue?: number;
  totalCost?: number;
  grossProfit?: number;
  profitMargin?: number;
};

export type ProfitMarginResponse = {
  data?: ProfitMarginItem[];
  totals?: { totalRevenue?: number; totalCost?: number; grossProfit?: number; profitMargin?: number };
  meta?: { total?: number; limit?: number; page?: number; totalPages?: number };
};

export async function getReportProfitMargin(params: ReportScopeQuery = {}): Promise<ProfitMarginResponse> {
  const q = buildScopeQuery(params);
  return apiFetch<ProfitMarginResponse>(`/reports/financial/profit-margin${q ? `?${q}` : ""}`);
}

/* ── Employee Sales Performance ── */
export type EmployeePerformanceItem = {
  rank?: number;
  userId?: string;
  userName?: string;
  userSurname?: string;
  userEmail?: string;
  currency?: string;
  saleCount?: number;
  confirmedCount?: number;
  cancelledCount?: number;
  cancelRate?: number;
  totalRevenue?: number;
  averageBasket?: number;
};

export type EmployeePerformanceResponse = {
  data?: EmployeePerformanceItem[];
  meta?: { total?: number; limit?: number; page?: number; totalPages?: number };
};

export async function getReportEmployeePerformance(params: ReportScopeQuery = {}): Promise<EmployeePerformanceResponse> {
  const q = buildScopeQuery(params);
  return apiFetch<EmployeePerformanceResponse>(`/reports/employees/sales-performance${q ? `?${q}` : ""}`);
}

/* ── Top Customers ── */
export type TopCustomerItem = {
  rank?: number;
  phoneNumber?: string;
  name?: string;
  surname?: string;
  email?: string;
  currency?: string;
  totalOrders?: number;
  confirmedCount?: number;
  cancelledCount?: number;
  cancelRate?: number;
  totalSpent?: number;
  averageBasket?: number;
  firstPurchase?: string;
  lastPurchase?: string;
};

export type TopCustomersResponse = {
  data?: TopCustomerItem[];
  meta?: { total?: number; limit?: number; page?: number; totalPages?: number };
};

export async function getReportTopCustomers(params: ReportScopeQuery = {}): Promise<TopCustomersResponse> {
  const q = buildScopeQuery(params);
  return apiFetch<TopCustomersResponse>(`/reports/customers/top${q ? `?${q}` : ""}`);
}

/* ── Discount Summary ── */
export type DiscountByCampaign = { campaignCode?: string; currency?: string; totalDiscount?: number; saleCount?: number };
export type DiscountByStore = { storeId?: string; storeName?: string; currency?: string; totalDiscount?: number; saleCount?: number };

export type DiscountSummaryResponse = {
  totalDiscount?: number;
  byCampaign?: DiscountByCampaign[];
  byStore?: DiscountByStore[];
};

export async function getReportDiscountSummary(params: ReportScopeQuery = {}): Promise<DiscountSummaryResponse> {
  const q = buildScopeQuery(params);
  return apiFetch<DiscountSummaryResponse>(`/reports/compliance/discount-summary${q ? `?${q}` : ""}`);
}

/* ── VAT Summary ── */
export type VatSummaryQuery = ReportScopeQuery & {
  month?: string;
  breakdown?: "day" | "store";
};

export type VatSummaryItem = {
  taxRate?: number;
  currency?: string;
  transactionCount?: number;
  cancelledCount?: number;
  netSales?: number;
  taxAmount?: number;
  grossTotal?: number;
};

export type VatSummaryResponse = {
  month?: string;
  data?: VatSummaryItem[];
  totals?: { netSales?: number; taxAmount?: number; grossTotal?: number };
};

export async function getReportVatSummary(params: VatSummaryQuery = {}): Promise<VatSummaryResponse> {
  const query = new URLSearchParams();
  if (params.month) query.set("month", params.month);
  if (params.breakdown) query.set("breakdown", params.breakdown);
  (params.storeIds ?? []).forEach((id) => {
    if (id) query.append("storeIds", id);
  });
  const q = query.toString();
  return apiFetch<VatSummaryResponse>(`/reports/compliance/vat-summary${q ? `?${q}` : ""}`);
}

/* ── Inventory Turnover ── */
export type TurnoverQuery = ReportScopeQuery & { periodDays?: number };

export type TurnoverItem = {
  productId?: string;
  productName?: string;
  productVariantId?: string;
  variantName?: string;
  variantCode?: string;
  currentStock?: number;
  soldQuantity?: number;
  periodDays?: number;
  dailyAvgSales?: number;
  turnoverRate?: number;
  supplyDays?: number;
  classification?: string;
};

export type TurnoverResponse = {
  periodDays?: number;
  data?: TurnoverItem[];
  meta?: { total?: number; limit?: number; page?: number; totalPages?: number };
};

export async function getReportTurnover(params: TurnoverQuery = {}): Promise<TurnoverResponse> {
  const query = new URLSearchParams();
  if (params.periodDays) query.set("periodDays", String(params.periodDays));
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  (params.storeIds ?? []).forEach((id) => {
    if (id) query.append("storeIds", id);
  });
  const q = query.toString();
  return apiFetch<TurnoverResponse>(`/reports/inventory/turnover${q ? `?${q}` : ""}`);
}

/* ── Dead Stock ── */
export type DeadStockQuery = ReportScopeQuery & { noSaleDays?: number };

export type DeadStockItem = {
  productId?: string;
  productName?: string;
  productVariantId?: string;
  variantName?: string;
  variantCode?: string;
  currency?: string;
  currentStock?: number;
  lastSaleDate?: string;
  noSaleDays?: number;
  estimatedValue?: number;
};

export type DeadStockResponse = {
  noSaleDays?: number;
  data?: DeadStockItem[];
  totals?: { itemCount?: number; totalEstimatedValue?: number };
  meta?: { total?: number; limit?: number; page?: number; totalPages?: number };
};

export async function getReportDeadStock(params: DeadStockQuery = {}): Promise<DeadStockResponse> {
  const query = new URLSearchParams();
  if (params.noSaleDays) query.set("noSaleDays", String(params.noSaleDays));
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  (params.storeIds ?? []).forEach((id) => {
    if (id) query.append("storeIds", id);
  });
  const q = query.toString();
  return apiFetch<DeadStockResponse>(`/reports/products/dead-stock${q ? `?${q}` : ""}`);
}
