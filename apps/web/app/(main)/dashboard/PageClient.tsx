"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { KpiCard } from "@/components/ui/KpiCard";
import { useLang } from "@/context/LangContext";
import dynamic from "next/dynamic";

const RevenueTrendChart = dynamic(
  () => import("@/components/dashboard/Chart").then((m) => ({ default: m.RevenueTrendChart })),
  { ssr: false },
);
const ProductSalesChart = dynamic(
  () => import("@/components/dashboard/Chart").then((m) => ({ default: m.ProductSalesChart })),
  { ssr: false },
);
import DashboardLowStock from "@/components/dashboard/DashboardLowStock";
import DashboardCancellations from "@/components/dashboard/DashboardCancellations";
import { usePermissions } from "@/hooks/usePermissions";
import { useSessionProfile } from "@/hooks/useSessionProfile";
import { useSyncAiReportContext } from "@/hooks/useSyncAiReportContext";
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
import type { ReportSummaryItem } from "@/lib/analytics";

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
  const { canAny } = usePermissions();
  const { activeStoreId, storeIds } = useSessionProfile();
  const [loading, setLoading] = useState(true);
  const [salesSummary, setSalesSummary] = useState<SalesSummaryResponse | null>(null);
  const [stockTotal, setStockTotal] = useState<StockTotalResponse | null>(null);
  const [confirmedOrders, setConfirmedOrders] = useState<ConfirmedOrdersResponse | null>(null);
  const [returns, setReturns] = useState<ReturnsResponse | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendItem[]>([]);
  const [productSales, setProductSales] = useState<SalesByProductItem[]>([]);
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
          getReportSalesSummary({ startDate: weekAgo, endDate: today, storeIds: activeStoreId ? [activeStoreId] : undefined }),
          getReportStockTotal({ compareDate: weekAgo, storeIds: activeStoreId ? [activeStoreId] : undefined }),
          getReportConfirmedOrders({ startDate: weekAgo, endDate: today, compareDate: weekAgo, storeIds: activeStoreId ? [activeStoreId] : undefined }),
          getReportReturns({ startDate: weekAgo, endDate: today, storeIds: activeStoreId ? [activeStoreId] : undefined }),
          getReportRevenueTrend({ groupBy: "day", startDate: weekAgo, endDate: today, storeIds: activeStoreId ? [activeStoreId] : undefined }),
          getReportSalesByProduct({ startDate: weekAgo, endDate: today, limit: 5, storeIds: activeStoreId ? [activeStoreId] : undefined }),
          getReportLowStock({ threshold: 50, limit: 6, storeIds: activeStoreId ? [activeStoreId] : undefined }),
          getReportCancellations({ startDate: weekAgo, endDate: today, limit: 5, storeIds: activeStoreId ? [activeStoreId] : undefined }),
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
      // individual widgets already fall back gracefully
    } finally {
      setLoading(false);
      setTablesLoading(false);
    }
  }, [activeStoreId]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const salesTotal = salesSummary?.totals?.totalLineTotal;
  const salesDelta = salesSummary?.totals?.cancelRate != null ? -(salesSummary.totals.cancelRate.toFixed(2)) : 0;
  const stockQty = stockTotal?.totals?.todayTotalQuantity;
  const stockDelta = stockTotal?.comparison?.changePercent ?? 0;
  const orderInfo = `${fmtValue(confirmedOrders?.totals?.totalLineTotal)} (${fmtCount(confirmedOrders?.totals?.orderCount)})`;
  const orderDelta = confirmedOrders?.comparison?.changePercent ?? 0;
  const returnInfo = `${fmtValue(returns?.totals?.totalLineTotal)} (${fmtCount(returns?.totals?.orderCount)})`;
  const returnDelta = returns?.comparison?.changePercent ?? 0;

  const quickActions = useMemo(
    () =>
      [
        {
          href: "/supply/suggestions",
          label: "Tedarik Onerileri",
          description: "Ikmal ve PO akislarini yonet",
          enabled: canAny(["REPLENISHMENT_READ", "PO_READ", "PO_CREATE"]),
        },
        {
          href: "/reports/sales-summary",
          label: "Satis Ozeti",
          description: "Haftalik satis ozetine git",
          enabled: canAny(["REPORT_SALES_READ", "REPORT_FINANCIAL_READ"]),
        },
        {
          href: "/reports/low-stock",
          label: "Dusuk Stok",
          description: "Kritik SKU listesini ac",
          enabled: canAny(["REPORT_STOCK_READ", "REPORT_INVENTORY_READ"]),
        },
        {
          href: "/reports/revenue-trend",
          label: "Gelir Trendi",
          description: "Donem bazli ciroyu incele",
          enabled: canAny(["REPORT_FINANCIAL_READ", "REPORT_SALES_READ"]),
        },
        {
          href: "/reports/store-performance",
          label: "Magaza Performansi",
          description: "Magazalari karsilastir",
          enabled: canAny(["REPORT_SALES_READ", "REPORT_FINANCIAL_READ"]),
        },
      ].filter((item) => item.enabled),
    [canAny],
  );

  const dashboardSummary = useMemo<ReportSummaryItem[]>(
    () => [
      { label: "Haftalik Satis", value: fmtValue(salesTotal) },
      { label: "Toplam Stok", value: fmtCount(stockQty) },
      { label: "Onaylanan Siparis", value: fmtCount(confirmedOrders?.totals?.orderCount) },
      { label: "Iadeler", value: fmtValue(returns?.totals?.totalLineTotal) },
    ],
    [confirmedOrders?.totals?.orderCount, returns?.totals?.totalLineTotal, salesTotal, stockQty],
  );

  useSyncAiReportContext({
    reportType: "dashboard",
    title: "Dashboard",
    description: "Genel satis, stok ve iptal ozetleri",
    path: "/dashboard",
    filters: { storeIds: activeStoreId ? [activeStoreId] : [] },
    scope: { route: "/dashboard", activeStoreId, storeIds },
    summary: dashboardSummary,
    rowCount: lowStock.length + cancellations.length,
    promptPresets: [
      "Dashboard ozetine gore dikkat edilmesi gereken 3 konuyu sirala",
      "Dusuk stok ve iptal hareketlerine gore aksiyon oner",
      "Gelir trendini ve son iptalleri birlikte yorumla",
    ],
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/reports/sales-summary" className="block">
          <KpiCard
            title={t("dashboard.weeklySales")}
            value={loading ? "..." : fmtValue(salesTotal)}
            hint={t("dashboard.weeklySalesHint")}
            delta={loading ? 0 : salesDelta}
            variant="primary"
            className="h-full"
          />
        </Link>
        <Link href="/reports/stock-summary" className="block">
          <KpiCard
            title={t("dashboard.stockQuantity")}
            value={loading ? "..." : fmtCount(stockQty)}
            hint={t("dashboard.stockQuantityHint")}
            delta={loading ? 0 : stockDelta}
            variant="accent"
            className="h-full"
          />
        </Link>
        <Link href="/reports/store-performance" className="block">
          <KpiCard
            title={t("dashboard.confirmedOrders")}
            value={loading ? "..." : orderInfo}
            hint={t("dashboard.confirmedOrdersHint")}
            delta={loading ? 0 : orderDelta}
            variant="warning"
            className="h-full"
          />
        </Link>
        <Link href="/reports/cancellations" className="block">
          <KpiCard
            title={t("dashboard.returns")}
            value={loading ? "..." : returnInfo}
            hint={t("dashboard.returnsHint")}
            delta={loading ? 0 : returnDelta}
            variant="error"
            className="h-full"
          />
        </Link>
      </div>

      {quickActions.length > 0 ? (
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-glow">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-text">Hizli aksiyonlar</h2>
            <p className="text-sm text-muted">Analitik merkezi icin en kritik girisler.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-xl2 border border-border bg-surface2/60 p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="text-sm font-semibold text-text">{action.label}</div>
                <div className="mt-1 text-xs text-muted">{action.description}</div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-text">{t("dashboard.lowStockWarnings")}</h3>
              <p className="text-sm text-muted">Kritik esigin altindaki urunler.</p>
            </div>
            <div className="flex items-center gap-3">
              {canAny(["REPLENISHMENT_READ", "PO_READ", "PO_CREATE"]) ? (
                <Link href="/supply/suggestions" className="text-sm font-semibold text-primary hover:underline">
                  Tedarik
                </Link>
              ) : null}
              <Link href="/reports/low-stock" className="text-sm font-semibold text-primary hover:underline">
                Raporu ac
              </Link>
            </div>
          </div>
          <DashboardLowStock data={lowStock} loading={tablesLoading} />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-text">{t("dashboard.recentCancellations")}</h3>
              <p className="text-sm text-muted">Son iptal fisleri ve kayip etkisi.</p>
            </div>
            <Link href="/reports/cancellations" className="text-sm font-semibold text-primary hover:underline">
              Raporu ac
            </Link>
          </div>
          <DashboardCancellations data={cancellations} loading={tablesLoading} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-text">{t("dashboard.revenueTrend")}</h3>
              <p className="text-sm text-muted">{t("dashboard.revenueTrendSubtitle")}</p>
            </div>
            <Link href="/reports/revenue-trend" className="text-sm font-semibold text-primary hover:underline">
              Raporu ac
            </Link>
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
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-text">{t("dashboard.productSales")}</h3>
              <p className="text-sm text-muted">{t("dashboard.productSalesSubtitle")}</p>
            </div>
            <Link href="/reports/product-performance" className="text-sm font-semibold text-primary hover:underline">
              Raporu ac
            </Link>
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
    </div>
  );
}
