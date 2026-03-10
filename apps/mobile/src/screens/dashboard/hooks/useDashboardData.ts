import {
  getSales,
  getReportCancellations,
  getReportConfirmedOrders,
  getReportLowStock,
  getReportReturns,
  getReportRevenueTrend,
  getReportSalesByProduct,
  getReportSalesSummary,
  getReportStockTotal,
  normalizeSalesResponse,
  type CancellationItem,
  type ConfirmedOrdersResponse,
  type LowStockItem,
  type ReturnsResponse,
  type RevenueTrendItem,
  type SaleListItem,
  type SalesByProductItem,
  type SalesSummaryResponse,
  type StockTotalResponse,
} from "@gase/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";

export type DashboardState = {
  loading: boolean;
  error: string;
  salesSummary: SalesSummaryResponse | null;
  stockTotal: StockTotalResponse | null;
  confirmedOrders: ConfirmedOrdersResponse | null;
  returns: ReturnsResponse | null;
  revenueTrend: RevenueTrendItem[];
  productSales: SalesByProductItem[];
  lowStock: LowStockItem[];
  cancellations: CancellationItem[];
  pendingCollections: SaleListItem[];
};

const initialState: DashboardState = {
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
  pendingCollections: [],
};

export type UseDashboardDataResult = {
  state: DashboardState;
  fetchDashboard: () => Promise<void>;
  pendingCollectionsTotal: number;
  pendingCollectionCurrency: "TRY" | "USD" | "EUR";
  topSeller: DashboardState["productSales"][number] | undefined;
  mostUrgentLowStock: DashboardState["lowStock"][number] | undefined;
  nextCollection: DashboardState["pendingCollections"][number] | undefined;
  hasDashboardData: boolean;
};

export function useDashboardData({ isActive }: { isActive: boolean }): UseDashboardDataResult {
  const { storeIds } = useAuth();
  const [state, setState] = useState<DashboardState>(initialState);

  const fetchDashboard = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const scope = storeIds.length ? { storeIds } : {};

    try {
      const [
        salesSummary,
        stockTotal,
        confirmedOrders,
        returns,
        revenueTrend,
        productSales,
        lowStock,
        cancellations,
        recentSales,
      ] = await Promise.all([
        getReportSalesSummary({ ...scope, startDate: weekAgo, endDate: today }),
        getReportStockTotal({ ...scope, compareDate: weekAgo }),
        getReportConfirmedOrders({ ...scope, startDate: weekAgo, endDate: today, compareDate: weekAgo }),
        getReportReturns({ ...scope, startDate: weekAgo, endDate: today }),
        getReportRevenueTrend({ ...scope, groupBy: "day", startDate: weekAgo, endDate: today }),
        getReportSalesByProduct({ ...scope, startDate: weekAgo, endDate: today, limit: 5 }),
        getReportLowStock({ ...scope, threshold: 50, limit: 6 }),
        getReportCancellations({ ...scope, startDate: weekAgo, endDate: today, limit: 5 }),
        getSales({ ...scope, page: 1, limit: 12, status: ["CONFIRMED"] }),
      ]);

      const pendingCollections = normalizeSalesResponse(recentSales).data
        .filter(
          (item) =>
            Number(item.remainingAmount ?? 0) > 0 &&
            item.status !== "CANCELLED" &&
            item.id,
        )
        .sort(
          (left, right) =>
            Number(right.remainingAmount ?? 0) - Number(left.remainingAmount ?? 0),
        )
        .slice(0, 4);

      setState({
        loading: false,
        error: "",
        salesSummary,
        stockTotal,
        confirmedOrders,
        returns,
        revenueTrend: revenueTrend.data ?? [],
        productSales: productSales.data ?? [],
        lowStock: lowStock.data ?? [],
        cancellations: cancellations.data ?? [],
        pendingCollections,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : "Dashboard yuklenemedi.",
      }));
    }
  }, [storeIds]);

  useEffect(() => {
    if (!isActive) return;
    void fetchDashboard();
  }, [fetchDashboard, isActive]);

  const pendingCollectionsTotal = useMemo(
    () =>
      state.pendingCollections.reduce(
        (sum, item) => sum + Number(item.remainingAmount ?? 0),
        0,
      ),
    [state.pendingCollections],
  );

  const pendingCollectionCurrency = useMemo(() => {
    const currencies = Array.from(
      new Set(
        state.pendingCollections
          .map((item) => item.currency)
          .filter((value): value is "TRY" | "USD" | "EUR" => Boolean(value)),
      ),
    );
    return currencies.length === 1 ? currencies[0] : ("TRY" as const);
  }, [state.pendingCollections]);

  const topSeller = state.productSales[0];
  const mostUrgentLowStock = state.lowStock[0];
  const nextCollection = state.pendingCollections[0];

  const hasDashboardData = useMemo(
    () =>
      Boolean(
        state.salesSummary ||
          state.stockTotal ||
          state.confirmedOrders ||
          state.returns ||
          state.revenueTrend.length ||
          state.productSales.length ||
          state.lowStock.length ||
          state.cancellations.length ||
          state.pendingCollections.length,
      ),
    [
      state.cancellations.length,
      state.confirmedOrders,
      state.lowStock.length,
      state.pendingCollections.length,
      state.productSales.length,
      state.revenueTrend.length,
      state.returns,
      state.salesSummary,
      state.stockTotal,
    ],
  );

  return {
    state,
    fetchDashboard,
    pendingCollectionsTotal,
    pendingCollectionCurrency,
    topSeller,
    mostUrgentLowStock,
    nextCollection,
    hasDashboardData,
  };
}
