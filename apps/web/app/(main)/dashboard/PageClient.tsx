"use client";

import { useCallback, useEffect, useState } from "react";
import { KpiCard } from "@/components/ui/KpiCard";
import { useLang } from "@/context/LangContext";
import { RevenueTrendChart, ProductSalesChart } from "@/components/dashboard/Chart";
import DashboardLowStock from "@/components/dashboard/DashboardLowStock";
import DashboardCancellations from "@/components/dashboard/DashboardCancellations";
import {
  getReportSalesSummary,
  getReportStockTotal,
  getReportConfirmedOrders,
  getReportReturns,
  getReportRevenueTrend,
  getReportSalesByProduct,
  getReportLowStock,
  getReportCancellations,
  type SalesSummaryResponse,
  type StockTotalResponse,
  type ConfirmedOrdersResponse,
  type ReturnsResponse,
  type RevenueTrendItem,
  type SalesByProductItem,
  type LowStockItem,
  type CancellationItem,
} from "@/lib/reports";

function fmtValue(n: number | undefined | null): string {
  if (n == null) return "-";
  if (n >= 1_000_000) return "₺" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "₺" + (n / 1_000).toFixed(1) + "K";
  return "₺" + n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtCount(n: number | undefined | null): string {
  if (n == null) return "-";
  return n.toLocaleString("tr-TR");
}

export default function DashboardPage() {
  const { t } = useLang();
  const [loading, setLoading] = useState(true);

  /* KPI data */
  const [salesSummary, setSalesSummary] = useState<SalesSummaryResponse | null>(null);
  const [stockTotal, setStockTotal] = useState<StockTotalResponse | null>(null);
  const [confirmedOrders, setConfirmedOrders] = useState<ConfirmedOrdersResponse | null>(null);
  const [returns, setReturns] = useState<ReturnsResponse | null>(null);

  /* Chart data */
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendItem[]>([]);
  const [productSales, setProductSales] = useState<SalesByProductItem[]>([]);

  /* Table data */
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [cancellations, setCancellations] = useState<CancellationItem[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setTablesLoading(true);

    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    try {
      const [salesRes, stockRes, ordersRes, returnsRes, trendRes, productRes, lowStockRes, cancelRes] =
        await Promise.allSettled([
          getReportSalesSummary({ startDate: weekAgo, endDate: today }),
          getReportStockTotal({ compareDate: weekAgo }),
          getReportConfirmedOrders({ startDate: weekAgo, endDate: today, compareDate: weekAgo }),
          getReportReturns({ startDate: weekAgo, endDate: today }),
          getReportRevenueTrend({ groupBy: "day", startDate: weekAgo, endDate: today }),
          getReportSalesByProduct({ startDate: weekAgo, endDate: today, limit: 5 }),
          getReportLowStock({ threshold: 50, limit: 6 }),
          getReportCancellations({ startDate: weekAgo, endDate: today, limit: 5 }),
        ]);

      if (salesRes.status === "fulfilled") setSalesSummary(salesRes.value);
      if (stockRes.status === "fulfilled") setStockTotal(stockRes.value);
      if (ordersRes.status === "fulfilled") setConfirmedOrders(ordersRes.value);
      if (returnsRes.status === "fulfilled") setReturns(returnsRes.value);
      if (trendRes.status === "fulfilled") setRevenueTrend(trendRes.value.data ?? []);
      if (productRes.status === "fulfilled") setProductSales(productRes.value.data ?? []);
      if (lowStockRes.status === "fulfilled") setLowStock(lowStockRes.value.data ?? []);
      if (cancelRes.status === "fulfilled") setCancellations(cancelRes.value.data ?? []);
    } catch {
      // silently handle — individual cards show "-"
    } finally {
      setLoading(false);
      setTablesLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  /* KPI derived values */
  const salesTotal = salesSummary?.totals?.totalLineTotal;
  const salesDelta = salesSummary?.totals?.cancelRate != null ? -(salesSummary.totals.cancelRate.toFixed(2)) : 0;

  const stockQty = stockTotal?.totals?.todayTotalQuantity;
  const stockDelta = stockTotal?.comparison?.changePercent ?? 0;

  const orderInfo = fmtValue(confirmedOrders?.totals?.totalLineTotal) + ` (${fmtCount(confirmedOrders?.totals?.orderCount)})`;
  const orderDelta = confirmedOrders?.comparison?.changePercent ?? 0;

  const returnInfo = fmtValue(returns?.totals?.totalLineTotal) + ` (${fmtCount(returns?.totals?.orderCount)})`;
  const returnDelta = returns?.comparison?.changePercent ?? 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={t("dashboard.weeklySales")}
          value={loading ? "..." : fmtValue(salesTotal)}
          hint={t("dashboard.weeklySalesHint")}
          delta={loading ? 0 : salesDelta}
          variant="primary"
        />
        <KpiCard
          title={t("dashboard.stockQuantity")}
          value={loading ? "..." : fmtCount(stockQty)}
          hint={t("dashboard.stockQuantityHint")}
          delta={loading ? 0 : stockDelta}
          variant="accent"
        />
        <KpiCard
          title={t("dashboard.confirmedOrders")}
          value={loading ? "..." : orderInfo}
          hint={t("dashboard.confirmedOrdersHint")}
          delta={loading ? 0 : orderDelta}
          variant="warning"
        />
        <KpiCard
          title={t("dashboard.returns")}
          value={loading ? "..." : returnInfo}
          hint={t("dashboard.returnsHint")}
          delta={loading ? 0 : returnDelta}
          variant="error"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-text">{t("dashboard.revenueTrend")}</h3>
            <p className="text-sm text-muted">{t("dashboard.revenueTrendSubtitle")}</p>
          </div>
          {loading ? (
            <div className="flex h-65 items-center justify-center text-sm text-muted">{t("dashboard.loading")}</div>
          ) : revenueTrend.length > 0 ? (
            <RevenueTrendChart data={revenueTrend} />
          ) : (
            <div className="flex h-65 items-center justify-center text-sm text-muted">{t("dashboard.noData")}</div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-text">{t("dashboard.productSales")}</h3>
            <p className="text-sm text-muted">{t("dashboard.productSalesSubtitle")}</p>
          </div>
          {loading ? (
            <div className="flex h-65 items-center justify-center text-sm text-muted">{t("dashboard.loading")}</div>
          ) : productSales.length > 0 ? (
            <ProductSalesChart data={productSales} />
          ) : (
            <div className="flex h-65 items-center justify-center text-sm text-muted">{t("dashboard.noData")}</div>
          )}
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text">{t("dashboard.lowStockWarnings")}</h3>
            {lowStock.length > 0 && (
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-500">
                {lowStock.length} {t("dashboard.productCount")}
              </span>
            )}
          </div>
          <DashboardLowStock data={lowStock} loading={tablesLoading} />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
          <h3 className="mb-4 text-lg font-semibold text-text">{t("dashboard.recentCancellations")}</h3>
          <DashboardCancellations data={cancellations} loading={tablesLoading} />
        </div>
      </div>
    </div>
  );
}
