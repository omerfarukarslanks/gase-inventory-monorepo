import { useCallback, useEffect, useState } from "react";
import {
  buildCancellationsModel,
  buildDiscountSummaryModel,
  buildProfitMarginModel,
  buildRevenueTrendModel,
  buildSalesSummaryModel,
  buildVatSummaryModel,
} from "../loaders/salesLoaders";
import {
  buildDeadStockModel,
  buildInventoryMovementsModel,
  buildLowStockModel,
  buildStockSummaryModel,
  buildTurnoverModel,
} from "../loaders/stockLoaders";
import {
  buildCustomersModel,
  buildEmployeePerformanceModel,
  buildProductPerformanceModel,
  buildStorePerformanceModel,
  buildSupplierPerformanceModel,
} from "../loaders/performanceLoaders";
import {
  initialDetailState,
  type DetailState,
  type ReportDetailKey,
  type ReportDetailModel,
} from "../types";

type Scope = {
  startDate: string;
  endDate: string;
  compareDate: string;
  storeIds?: string[];
};

type UseReportDetailParams = {
  isActive: boolean;
  range: "7d" | "30d";
  scope: Scope;
  /** Owned by parent screen; passed in so useReportData can also read it. */
  detailKey: ReportDetailKey | null;
  setDetailKey: (key: ReportDetailKey | null) => void;
};

export function useReportDetail({ isActive, range, scope, detailKey, setDetailKey }: UseReportDetailParams) {
  const [detailState, setDetailState] = useState<DetailState>(initialDetailState);

  const loadDetail = useCallback(
    async (key: ReportDetailKey) => {
      setDetailState({ loading: true, error: "", model: null });

      try {
        let model: ReportDetailModel;

        switch (key) {
          case "sales-summary":       model = await buildSalesSummaryModel(scope, range); break;
          case "cancellations":       model = await buildCancellationsModel(scope, range); break;
          case "revenue-trend":       model = await buildRevenueTrendModel(scope, range); break;
          case "discount-summary":    model = await buildDiscountSummaryModel(scope, range); break;
          case "vat-summary":         model = await buildVatSummaryModel(scope, range); break;
          case "profit-margin":       model = await buildProfitMarginModel(scope, range); break;
          case "stock-summary":       model = await buildStockSummaryModel(scope, range); break;
          case "low-stock":           model = await buildLowStockModel(scope, range); break;
          case "dead-stock":          model = await buildDeadStockModel(scope, range); break;
          case "inventory-movements": model = await buildInventoryMovementsModel(scope, range); break;
          case "turnover":            model = await buildTurnoverModel(scope, range); break;
          case "product-performance":  model = await buildProductPerformanceModel(scope, range); break;
          case "supplier-performance": model = await buildSupplierPerformanceModel(scope, range); break;
          case "store-performance":    model = await buildStorePerformanceModel(scope, range); break;
          case "employee-performance": model = await buildEmployeePerformanceModel(scope, range); break;
          case "customers":            model = await buildCustomersModel(scope, range); break;
        }

        setDetailState({ loading: false, error: "", model });
      } catch (nextError) {
        setDetailState({
          loading: false,
          error: nextError instanceof Error ? nextError.message : "Rapor detayi yuklenemedi.",
          model: null,
        });
      }
    },
    [range, scope],
  );

  useEffect(() => {
    if (!isActive || !detailKey) return;
    void loadDetail(detailKey);
  }, [detailKey, isActive, loadDetail]);

  const openDetail = (key: ReportDetailKey) => {
    setDetailKey(key);
  };

  const closeDetail = () => {
    setDetailKey(null);
    setDetailState(initialDetailState);
  };

  return { detailKey, detailState, openDetail, closeDetail, loadDetail };
}
