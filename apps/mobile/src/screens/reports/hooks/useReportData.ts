import {
  getReportCancellations,
  getReportConfirmedOrders,
  getReportLowStock,
  getReportRevenueTrend,
  getReportReturns,
  getReportSalesByProduct,
  getReportSalesSummary,
  getReportStockTotal,
} from "@gase/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { getDateScope } from "../utils/reportHelpers";
import { initialState, type ReportsState, type ReportDetailKey } from "../types";
import type { ReportPermissions } from "./useReportPermissions";

type UseReportDataParams = {
  detailKey: ReportDetailKey | null;
  isActive: boolean;
  permissions: ReportPermissions;
};

export function useReportData({ detailKey, isActive, permissions }: UseReportDataParams) {
  const { storeIds } = useAuth();
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [state, setState] = useState<ReportsState>(initialState);

  const { canReadSales, canReadStock, canReadFinancial, hasQuickInsights } = permissions;

  const scope = useMemo(() => {
    const dateScope = getDateScope(range);
    return {
      ...dateScope,
      ...(storeIds.length ? { storeIds } : {}),
    };
  }, [range, storeIds]);

  const fetchReports = useCallback(async () => {
    if (!hasQuickInsights) {
      setState({
        ...initialState,
        loading: false,
      });
      return;
    }

    setState((current) => ({ ...current, loading: true, error: "" }));

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
      ] = await Promise.all([
        canReadSales || canReadFinancial ? getReportSalesSummary(scope) : Promise.resolve(null),
        canReadStock ? getReportStockTotal(scope) : Promise.resolve(null),
        canReadSales ? getReportConfirmedOrders(scope) : Promise.resolve(null),
        canReadSales ? getReportReturns(scope) : Promise.resolve(null),
        canReadFinancial
          ? getReportRevenueTrend({ ...scope, groupBy: range === "30d" ? "week" : "day" })
          : Promise.resolve({ data: [] }),
        canReadSales ? getReportSalesByProduct({ ...scope, limit: 5 }) : Promise.resolve({ data: [] }),
        canReadStock ? getReportLowStock({ ...scope, threshold: 50, limit: 5 }) : Promise.resolve({ data: [] }),
        canReadSales ? getReportCancellations({ ...scope, limit: 5 }) : Promise.resolve({ data: [] }),
      ]);

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
      });
    } catch (nextError) {
      setState((current) => ({
        ...current,
        loading: false,
        error: nextError instanceof Error ? nextError.message : "Raporlar yuklenemedi.",
      }));
    }
  }, [canReadFinancial, canReadSales, canReadStock, hasQuickInsights, range, scope]);

  useEffect(() => {
    if (!isActive || detailKey) return;
    void fetchReports();
  }, [detailKey, fetchReports, isActive]);

  return { range, setRange, state, scope, fetchReports };
}
