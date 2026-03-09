import {
  type LowStockItem,
  type RevenueTrendItem,
  type SalesByProductItem,
  type CancellationItem,
  getReportCancellations,
  getReportConfirmedOrders,
  getReportDeadStock,
  getReportDiscountSummary,
  getReportEmployeePerformance,
  getReportLowStock,
  getReportMovements,
  getReportProductRanking,
  getReportProfitMargin,
  getReportReturns,
  getReportRevenueTrend,
  getReportSalesByProduct,
  getReportSalesSummary,
  getReportStockSummary,
  getReportStockTotal,
  getReportStorePerformance,
  getReportSupplierSalesPerformance,
  getReportTopCustomers,
  getReportTurnover,
  getReportVatSummary,
} from "@gase/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Banner,
  BarList,
  Button,
  Card,
  EmptyStateWithAction,
  FilterTabs,
  ListRow,
  MetricCard,
  ScreenHeader,
  SectionTitle,
  SkeletonBlock,
} from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { formatCount, formatCurrency, formatDate } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";

type BadgeTone = "positive" | "warning" | "danger" | "neutral" | "info";
type ReportsRange = "7d" | "30d";
type ReportDetailKey =
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

type ReportsState = {
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

type ReportMetric = {
  key: string;
  label: string;
  value: string;
  hint?: string;
};

type ReportStat = {
  label: string;
  value: string;
};

type ReportListItem = {
  key: string;
  title: string;
  subtitle?: string;
  caption?: string;
  badgeLabel?: string;
  badgeTone?: BadgeTone;
};

type ReportBarItem = {
  key: string;
  label: string;
  value: number;
};

type ReportSection =
  | {
      type: "stats";
      title: string;
      items: ReportStat[];
    }
  | {
      type: "bars";
      title: string;
      items: ReportBarItem[];
      formatter?: (value: number) => string;
    }
  | {
      type: "list";
      title: string;
      items: ReportListItem[];
      emptyTitle: string;
      emptySubtitle: string;
    };

type ReportDetailModel = {
  title: string;
  subtitle: string;
  metrics: ReportMetric[];
  sections: ReportSection[];
  note?: string;
};

type DetailState = {
  loading: boolean;
  error: string;
  model: ReportDetailModel | null;
};

type CatalogItem = {
  key: ReportDetailKey;
  title: string;
  description: string;
};

const rangeOptions = [
  { label: "7 gun", value: "7d" as const },
  { label: "30 gun", value: "30d" as const },
];

const initialState: ReportsState = {
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

const initialDetailState: DetailState = {
  loading: false,
  error: "",
  model: null,
};

function getDateScope(range: ReportsRange) {
  const today = new Date();
  const start = new Date(today.getTime() - (range === "30d" ? 29 : 6) * 86400000);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: today.toISOString().slice(0, 10),
    compareDate: start.toISOString().slice(0, 10),
  };
}

function formatPercent(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "-";
  return `%${amount.toFixed(1)}`;
}

function formatReportDateLabel(value: string | null | undefined): string {
  if (!value) return "-";
  if (/^\d{4}-\d{2}$/.test(value)) {
    return value;
  }
  return formatDate(value);
}

export default function ReportsScreen({
  isActive = true,
  onBack,
}: {
  isActive?: boolean;
  onBack?: () => void;
}) {
  const { permissions, storeIds } = useAuth();
  const [range, setRange] = useState<ReportsRange>("7d");
  const [state, setState] = useState<ReportsState>(initialState);
  const [detailKey, setDetailKey] = useState<ReportDetailKey | null>(null);
  const [detailState, setDetailState] = useState<DetailState>(initialDetailState);

  const canReadSales = permissions.includes("REPORT_SALES_READ");
  const canReadStock =
    permissions.includes("REPORT_STOCK_READ") || permissions.includes("REPORT_INVENTORY_READ");
  const canReadFinancial = permissions.includes("REPORT_FINANCIAL_READ");
  const canReadInventory = permissions.includes("REPORT_INVENTORY_READ");
  const canReadEmployee = permissions.includes("REPORT_EMPLOYEE_READ");
  const canReadCustomers = permissions.includes("REPORT_CUSTOMER_READ");
  const hasQuickInsights = canReadSales || canReadStock || canReadFinancial;
  const hasAnyReports =
    hasQuickInsights || canReadInventory || canReadEmployee || canReadCustomers;

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

  const loadDetail = useCallback(
    async (key: ReportDetailKey) => {
      setDetailState({
        loading: true,
        error: "",
        model: null,
      });

      try {
        let model: ReportDetailModel;

        switch (key) {
          case "sales-summary": {
            const [salesSummary, confirmedOrders, returns] = await Promise.all([
              getReportSalesSummary(scope),
              getReportConfirmedOrders(scope),
              getReportReturns(scope),
            ]);
            model = {
              title: "Satis ozeti",
              subtitle: "Toplam, sepet, onay ve iade dengesi",
              metrics: [
                {
                  key: "total-sales",
                  label: "Toplam satis",
                  value: formatCurrency(salesSummary.totals?.totalLineTotal, "TRY"),
                  hint: `${formatCount(salesSummary.totals?.saleCount)} islem`,
                },
                {
                  key: "avg-basket",
                  label: "Ortalama sepet",
                  value: formatCurrency(salesSummary.totals?.averageBasket, "TRY"),
                  hint: `Iptal oranı ${formatPercent(salesSummary.totals?.cancelRate)}`,
                },
                {
                  key: "confirmed",
                  label: "Onayli siparis",
                  value: formatCount(confirmedOrders.totals?.orderCount),
                  hint: formatCurrency(confirmedOrders.totals?.totalLineTotal, "TRY"),
                },
                {
                  key: "returns",
                  label: "Iade",
                  value: formatCount(returns.totals?.orderCount),
                  hint: formatCurrency(returns.totals?.totalLineTotal, "TRY"),
                },
              ],
              sections: [
                {
                  type: "stats",
                  title: "Donem ozetleri",
                  items: [
                    {
                      label: "Toplam islem",
                      value: formatCount(salesSummary.totals?.saleCount),
                    },
                    {
                      label: "Onayli adet",
                      value: formatCount(salesSummary.totals?.confirmedCount),
                    },
                    {
                      label: "Iptal adet",
                      value: formatCount(salesSummary.totals?.cancelledCount),
                    },
                    {
                      label: "Iptal orani",
                      value: formatPercent(salesSummary.totals?.cancelRate),
                    },
                  ],
                },
                {
                  type: "bars",
                  title: "Gunluk onayli siparisler",
                  items: (confirmedOrders.daily ?? []).map((item, index) => ({
                    key: `${item.date ?? index}`,
                    label: formatReportDateLabel(item.date),
                    value: Number(item.orderCount ?? 0),
                  })),
                  formatter: (value) => `${formatCount(value)} siparis`,
                },
              ],
              note:
                "Bu rapor satis temposunu ve iptal/iade etkisini tek bakista gosterir. Dusuk ortalama sepet veya yuksek iptal orani olan donemler sonraki operasyon iyilestirme alanidir.",
            };
            break;
          }
          case "cancellations": {
            const response = await getReportCancellations({ ...scope, limit: 20 });
            model = {
              title: "Satis iptalleri",
              subtitle: "Iptal edilen fis ve tutar dagilimi",
              metrics: [
                {
                  key: "cancel-count",
                  label: "Iptal adedi",
                  value: formatCount(response.totals?.cancelledCount),
                },
                {
                  key: "cancel-total",
                  label: "Iptal tutari",
                  value: formatCurrency(response.totals?.totalLineTotal, "TRY"),
                },
              ],
              sections: [
                {
                  type: "list",
                  title: "Son iptaller",
                  items: (response.data ?? []).map((item, index) => ({
                    key: `${item.id ?? item.receiptNo ?? index}`,
                    title: item.receiptNo ?? "Iptal edilen fis",
                    subtitle: `${item.name ?? "-"} ${item.surname ?? ""}`.trim(),
                    caption: `${formatDate(item.cancelledAt ?? item.createdAt)} • ${formatCurrency(item.lineTotal ?? item.unitPrice, (item.currency as never) ?? "TRY")}`,
                    badgeLabel: item.store?.name ?? "iptal",
                    badgeTone: "danger",
                  })),
                  emptyTitle: "Iptal kaydi yok.",
                  emptySubtitle: "Secili donemde iptal edilen satis bulunmadi.",
                },
              ],
            };
            break;
          }
          case "product-performance": {
            const response = await getReportProductRanking({ ...scope, limit: 20 });
            const topItem = response.data?.[0];
            model = {
              title: "Urun performansi",
              subtitle: "Satis, gelir ve mevcut stok dengesi",
              metrics: [
                {
                  key: "top-revenue",
                  label: "En yuksek gelir",
                  value: formatCurrency(topItem?.totalRevenue, (topItem?.currency as never) ?? "TRY"),
                  hint: topItem?.variantName ?? topItem?.productName ?? "Kalem yok",
                },
                {
                  key: "top-qty",
                  label: "En cok satilan",
                  value: formatCount(topItem?.soldQuantity),
                  hint: `${formatCount(topItem?.saleCount)} satis`,
                },
                {
                  key: "rank-count",
                  label: "Kayit",
                  value: formatCount(response.data?.length),
                },
              ],
              sections: [
                {
                  type: "list",
                  title: "Performans sirasi",
                  items: (response.data ?? []).map((item, index) => ({
                    key: `${item.productVariantId ?? item.productId ?? index}`,
                    title: `${formatCount(item.rank ?? index + 1)}. ${item.variantName ?? item.productName ?? "Urun"}`,
                    subtitle: `${formatCount(item.soldQuantity)} adet • ${formatCount(item.saleCount)} satis`,
                    caption: `${formatCurrency(item.totalRevenue, (item.currency as never) ?? "TRY")} • Stok ${formatCount(item.currentStock)}`,
                    badgeLabel: item.stockStatus ?? "urun",
                    badgeTone:
                      item.stockStatus?.toLowerCase().includes("low") ? "warning" : "info",
                  })),
                  emptyTitle: "Performans verisi yok.",
                  emptySubtitle: "Secili donemde satis performansi kaydi bulunmadi.",
                },
              ],
            };
            break;
          }
          case "supplier-performance": {
            const response = await getReportSupplierSalesPerformance({ ...scope, limit: 20 });
            model = {
              title: "Tedarikci performansi",
              subtitle: "Satis, miktar ve ciro etkisi",
              metrics: [
                {
                  key: "suppliers",
                  label: "Tedarikci",
                  value: formatCount(response.totals?.totalSuppliers),
                },
                {
                  key: "sales",
                  label: "Toplam satis",
                  value: formatCount(response.totals?.totalSales),
                },
                {
                  key: "quantity",
                  label: "Toplam miktar",
                  value: formatCount(response.totals?.totalQuantity),
                },
                {
                  key: "line-total",
                  label: "Toplam ciro",
                  value: formatCurrency(response.totals?.totalLineTotal, "TRY"),
                },
              ],
              sections: [
                {
                  type: "list",
                  title: "Tedarikci listesi",
                  items: (response.data ?? []).map((item, index) => ({
                    key: `${item.supplierId ?? index}`,
                    title: `${item.supplierName ?? "-"} ${item.supplierSurname ?? ""}`.trim(),
                    subtitle: `${formatCount(item.saleCount)} satis • ${formatCount(item.quantity)} adet`,
                    caption: `${formatCurrency(item.lineTotal, (item.currency as never) ?? "TRY")} • ${formatCount(item.productCount)} urun`,
                    badgeLabel: item.supplierPhoneNumber ?? "tedarikci",
                    badgeTone: "info",
                  })),
                  emptyTitle: "Tedarikci performansi bulunamadi.",
                  emptySubtitle: "Secili donem icin tedarikci bazli satis verisi yok.",
                },
              ],
            };
            break;
          }
          case "stock-summary": {
            const response = await getReportStockSummary({ ...scope, limit: 20 });
            model = {
              title: "Stok ozeti",
              subtitle: "Urun ve varyant bazinda mevcut stok dagilimi",
              metrics: [
                {
                  key: "qty",
                  label: "Toplam stok",
                  value: formatCount(response.totalQuantity),
                },
                {
                  key: "products",
                  label: "Urun",
                  value: formatCount(response.data?.length),
                },
                {
                  key: "variants",
                  label: "Varyant",
                  value: formatCount(
                    response.data?.reduce((sum, item) => sum + (item.variants?.length ?? 0), 0),
                  ),
                },
              ],
              sections: [
                {
                  type: "list",
                  title: "Urun bazli stok",
                  items: (response.data ?? []).map((item, index) => ({
                    key: `${item.productId ?? index}`,
                    title: item.productName ?? "Urun",
                    subtitle: `${formatCount(item.totalQuantity)} toplam adet`,
                    caption: `${formatCount(item.variants?.length)} varyant`,
                    badgeLabel:
                      item.variants?.[0]?.stores?.[0]?.storeName ??
                      `${formatCount(item.variants?.length)} varyant`,
                    badgeTone: "info",
                  })),
                  emptyTitle: "Stok ozeti bos.",
                  emptySubtitle: "Secili scope icin stok kaydi bulunmadi.",
                },
              ],
            };
            break;
          }
          case "low-stock": {
            const response = await getReportLowStock({ ...scope, threshold: 50, limit: 20 });
            model = {
              title: "Kritik stok",
              subtitle: "Esik altina dusen varyantlar",
              metrics: [
                {
                  key: "threshold",
                  label: "Esik",
                  value: formatCount(response.threshold ?? 50),
                },
                {
                  key: "items",
                  label: "Varyant",
                  value: formatCount(response.data?.length),
                },
              ],
              sections: [
                {
                  type: "list",
                  title: "Kritik varyantlar",
                  items: (response.data ?? []).map((item, index) => ({
                    key: `${item.productVariantId ?? index}-${item.storeId ?? "scope"}`,
                    title: item.variantName ?? item.productName ?? "Dusuk stok",
                    subtitle: item.storeName ?? "Scope bazli",
                    caption: `${formatCount(item.quantity)} adet kaldi`,
                    badgeLabel: item.variantCode ?? "kritik",
                    badgeTone: "warning",
                  })),
                  emptyTitle: "Kritik stok yok.",
                  emptySubtitle: "Secili donem ve scope icin kritik stok kalemi bulunmadi.",
                },
              ],
            };
            break;
          }
          case "dead-stock": {
            const response = await getReportDeadStock({
              ...scope,
              noSaleDays: range === "30d" ? 30 : 14,
              limit: 20,
            });
            model = {
              title: "Dead stock",
              subtitle: "Uzun suredir satilmayan stok kalemleri",
              metrics: [
                {
                  key: "item-count",
                  label: "Kalem",
                  value: formatCount(response.totals?.itemCount),
                },
                {
                  key: "estimated",
                  label: "Tahmini deger",
                  value: formatCurrency(response.totals?.totalEstimatedValue, "TRY"),
                },
                {
                  key: "days",
                  label: "Hareketsiz gun",
                  value: formatCount(response.noSaleDays ?? (range === "30d" ? 30 : 14)),
                },
              ],
              sections: [
                {
                  type: "list",
                  title: "Hareketsiz kalemler",
                  items: (response.data ?? []).map((item, index) => ({
                    key: `${item.productVariantId ?? index}`,
                    title: item.variantName ?? item.productName ?? "Kalem",
                    subtitle: `Son satis ${formatDate(item.lastSaleDate)}`,
                    caption: `${formatCount(item.currentStock)} stok • ${formatCurrency(item.estimatedValue, (item.currency as never) ?? "TRY")}`,
                    badgeLabel: `${formatCount(item.noSaleDays)} gun`,
                    badgeTone: "warning",
                  })),
                  emptyTitle: "Dead stock bulunmadi.",
                  emptySubtitle: "Secili kapsam icin hareketsiz stok kalemi yok.",
                },
              ],
            };
            break;
          }
          case "inventory-movements": {
            const response = await getReportMovements({ ...scope, limit: 20 });
            model = {
              title: "Envanter hareketleri",
              subtitle: "Hareket tipi, miktar ve son kayitlar",
              metrics: [
                {
                  key: "movement-count",
                  label: "Hareket",
                  value: formatCount(response.totals?.movementCount),
                },
                {
                  key: "net-quantity",
                  label: "Net miktar",
                  value: formatCount(response.totals?.netQuantity),
                },
              ],
              sections: [
                {
                  type: "bars",
                  title: "Ture gore ozet",
                  items: (response.summaryByType ?? []).map((item, index) => ({
                    key: `${item.type ?? index}`,
                    label: item.type ?? "hareket",
                    value: Number(item.totalQuantity ?? 0),
                  })),
                  formatter: (value) => `${formatCount(value)} adet`,
                },
                {
                  type: "list",
                  title: "Son hareketler",
                  items: (response.data ?? []).map((item, index) => ({
                    key: `${item.id ?? index}`,
                    title: item.productVariant?.name ?? item.product?.name ?? "Hareket",
                    subtitle: `${item.type ?? "hareket"} • ${item.store?.name ?? "magaza yok"}`,
                    caption: `${formatDate(item.createdAt)} • ${formatCount(item.quantity)} adet`,
                    badgeLabel: item.productVariant?.code ?? "stok",
                    badgeTone: "info",
                  })),
                  emptyTitle: "Hareket bulunamadi.",
                  emptySubtitle: "Secili donem icin stok hareketi kaydi yok.",
                },
              ],
            };
            break;
          }
          case "turnover": {
            const response = await getReportTurnover({
              ...scope,
              periodDays: range === "30d" ? 30 : 7,
              limit: 20,
            });
            const averageTurnover =
              response.data?.length
                ? response.data.reduce((sum, item) => sum + Number(item.turnoverRate ?? 0), 0) /
                  response.data.length
                : 0;
            model = {
              title: "Stok devir hizi",
              subtitle: "Donem bazli turnover ve supply days",
              metrics: [
                {
                  key: "period",
                  label: "Donem",
                  value: `${formatCount(response.periodDays ?? (range === "30d" ? 30 : 7))} gun`,
                },
                {
                  key: "items",
                  label: "Varyant",
                  value: formatCount(response.data?.length),
                },
                {
                  key: "avg-turnover",
                  label: "Ort. turnover",
                  value: Number.isFinite(averageTurnover) ? averageTurnover.toFixed(2) : "-",
                },
              ],
              sections: [
                {
                  type: "list",
                  title: "Turnover listesi",
                  items: (response.data ?? []).map((item, index) => ({
                    key: `${item.productVariantId ?? index}`,
                    title: item.variantName ?? item.productName ?? "Varyant",
                    subtitle: `Turnover ${Number(item.turnoverRate ?? 0).toFixed(2)} • Supply ${formatCount(item.supplyDays)} gun`,
                    caption: `${formatCount(item.currentStock)} stok • ${formatCount(item.soldQuantity)} satis`,
                    badgeLabel: item.classification ?? "stok",
                    badgeTone:
                      item.classification?.toLowerCase().includes("slow") ? "warning" : "info",
                  })),
                  emptyTitle: "Turnover verisi yok.",
                  emptySubtitle: "Secili donemde turnover analizi icin kayit bulunamadi.",
                },
              ],
            };
            break;
          }
          case "revenue-trend": {
            const response = await getReportRevenueTrend({
              ...scope,
              groupBy: range === "30d" ? "week" : "day",
            });
            const totalRevenue = (response.data ?? []).reduce(
              (sum, item) => sum + Number(item.totalRevenue ?? 0),
              0,
            );
            const totalSales = (response.data ?? []).reduce(
              (sum, item) => sum + Number(item.saleCount ?? 0),
              0,
            );
            model = {
              title: "Gelir trendi",
              subtitle: "Donemsel ciro ve satis ritmi",
              metrics: [
                {
                  key: "revenue",
                  label: "Toplam gelir",
                  value: formatCurrency(totalRevenue, "TRY"),
                },
                {
                  key: "sales",
                  label: "Toplam satis",
                  value: formatCount(totalSales),
                },
              ],
              sections: [
                {
                  type: "bars",
                  title: "Donemsel gelir",
                  items: (response.data ?? []).map((item, index) => ({
                    key: `${item.period ?? index}`,
                    label: item.period ?? `${index + 1}`,
                    value: Number(item.totalRevenue ?? 0),
                  })),
                  formatter: (value) => formatCurrency(value, "TRY"),
                },
                {
                  type: "list",
                  title: "Donem detaylari",
                  items: (response.data ?? []).map((item, index) => ({
                    key: `${item.period ?? index}-detail`,
                    title: item.period ?? `${index + 1}. donem`,
                    subtitle: `${formatCount(item.saleCount)} satis • Ortalama ${formatCurrency(item.averageBasket, (item.currency as never) ?? "TRY")}`,
                    caption: formatCurrency(item.totalRevenue, (item.currency as never) ?? "TRY"),
                    badgeLabel: formatPercent(item.changePercent),
                    badgeTone:
                      Number(item.changePercent ?? 0) >= 0 ? "positive" : "warning",
                  })),
                  emptyTitle: "Trend verisi yok.",
                  emptySubtitle: "Secili donem icin gelir kaydi bulunamadi.",
                },
              ],
            };
            break;
          }
          case "profit-margin": {
            const response = await getReportProfitMargin({ ...scope, limit: 20 });
            model = {
              title: "Kar marji",
              subtitle: "Gelir, maliyet ve brut kar dagilimi",
              metrics: [
                {
                  key: "revenue",
                  label: "Toplam gelir",
                  value: formatCurrency(response.totals?.totalRevenue, "TRY"),
                },
                {
                  key: "cost",
                  label: "Toplam maliyet",
                  value: formatCurrency(response.totals?.totalCost, "TRY"),
                },
                {
                  key: "gross-profit",
                  label: "Brut kar",
                  value: formatCurrency(response.totals?.grossProfit, "TRY"),
                },
                {
                  key: "margin",
                  label: "Marj",
                  value: formatPercent(response.totals?.profitMargin),
                },
              ],
              sections: [
                {
                  type: "list",
                  title: "Kalem bazli marj",
                  items: (response.data ?? []).map((item, index) => ({
                    key: `${item.productVariantId ?? index}`,
                    title: item.variantName ?? item.productName ?? "Urun",
                    subtitle: `${formatCount(item.soldQuantity)} adet • Maliyet ${formatCurrency(item.totalCost, (item.currency as never) ?? "TRY")}`,
                    caption: `${formatCurrency(item.grossProfit, (item.currency as never) ?? "TRY")} • Marj ${formatPercent(item.profitMargin)}`,
                    badgeLabel: formatCurrency(item.totalRevenue, (item.currency as never) ?? "TRY"),
                    badgeTone: Number(item.profitMargin ?? 0) >= 0 ? "positive" : "danger",
                  })),
                  emptyTitle: "Marj verisi yok.",
                  emptySubtitle: "Secili donem icin kar marji analizi bulunamadi.",
                },
              ],
            };
            break;
          }
          case "discount-summary": {
            const response = await getReportDiscountSummary(scope);
            model = {
              title: "Indirim ozeti",
              subtitle: "Kampanya ve magaza bazli indirim dagilimi",
              metrics: [
                {
                  key: "discount",
                  label: "Toplam indirim",
                  value: formatCurrency(response.totalDiscount, "TRY"),
                },
                {
                  key: "campaigns",
                  label: "Kampanya",
                  value: formatCount(response.byCampaign?.length),
                },
                {
                  key: "stores",
                  label: "Magaza",
                  value: formatCount(response.byStore?.length),
                },
              ],
              sections: [
                {
                  type: "bars",
                  title: "Kampanyaya gore indirim",
                  items: (response.byCampaign ?? []).map((item, index) => ({
                    key: `${item.campaignCode ?? index}`,
                    label: item.campaignCode ?? "kampanya yok",
                    value: Number(item.totalDiscount ?? 0),
                  })),
                  formatter: (value) => formatCurrency(value, "TRY"),
                },
                {
                  type: "list",
                  title: "Magaza dagilimi",
                  items: (response.byStore ?? []).map((item, index) => ({
                    key: `${item.storeId ?? index}`,
                    title: item.storeName ?? "Magaza",
                    subtitle: `${formatCount(item.saleCount)} satis`,
                    caption: formatCurrency(item.totalDiscount, (item.currency as never) ?? "TRY"),
                    badgeLabel: "indirim",
                    badgeTone: "warning",
                  })),
                  emptyTitle: "Magaza dagilimi yok.",
                  emptySubtitle: "Secili kapsam icin indirim dagilimi bulunamadi.",
                },
              ],
            };
            break;
          }
          case "vat-summary": {
            const response = await getReportVatSummary({
              storeIds: scope.storeIds,
              month: scope.endDate?.slice(0, 7),
              breakdown: "store",
            });
            model = {
              title: "KDV ozeti",
              subtitle: "Vergi orani ve brut toplam dagilimi",
              metrics: [
                {
                  key: "net",
                  label: "Net satis",
                  value: formatCurrency(response.totals?.netSales, "TRY"),
                },
                {
                  key: "vat",
                  label: "Vergi",
                  value: formatCurrency(response.totals?.taxAmount, "TRY"),
                },
                {
                  key: "gross",
                  label: "Brut",
                  value: formatCurrency(response.totals?.grossTotal, "TRY"),
                },
              ],
              sections: [
                {
                  type: "list",
                  title: "Vergi satirlari",
                  items: (response.data ?? []).map((item, index) => ({
                    key: `${item.taxRate ?? index}`,
                    title: `%${Number(item.taxRate ?? 0)}`,
                    subtitle: `${formatCount(item.transactionCount)} islem • ${formatCount(item.cancelledCount)} iptal`,
                    caption: `${formatCurrency(item.taxAmount, (item.currency as never) ?? "TRY")} vergi • ${formatCurrency(item.grossTotal, (item.currency as never) ?? "TRY")} brut`,
                    badgeLabel: formatCurrency(item.netSales, (item.currency as never) ?? "TRY"),
                    badgeTone: "info",
                  })),
                  emptyTitle: "KDV verisi yok.",
                  emptySubtitle: "Secili ay ve kapsam icin vergi ozeti bulunamadi.",
                },
              ],
            };
            break;
          }
          case "store-performance": {
            const response = await getReportStorePerformance({ ...scope, limit: 20 });
            model = {
              title: "Magaza performansi",
              subtitle: "Magaza bazli satis ve ortalama sepet",
              metrics: [
                {
                  key: "sales",
                  label: "Toplam satis",
                  value: formatCount(response.totals?.totalSales),
                },
                {
                  key: "confirmed",
                  label: "Onayli",
                  value: formatCount(response.totals?.totalConfirmed),
                },
                {
                  key: "revenue",
                  label: "Toplam ciro",
                  value: formatCurrency(response.totals?.totalLineTotal, "TRY"),
                },
              ],
              sections: [
                {
                  type: "list",
                  title: "Magaza siralamasi",
                  items: (response.data ?? []).map((item, index) => ({
                    key: `${item.storeId ?? index}`,
                    title: item.storeName ?? "Magaza",
                    subtitle: `${formatCount(item.saleCount)} satis • Sepet ${formatCurrency(item.averageBasket, (item.currency as never) ?? "TRY")}`,
                    caption: `${formatCurrency(item.totalLineTotal, (item.currency as never) ?? "TRY")} • Iptal ${formatPercent(item.cancelRate)}`,
                    badgeLabel: item.storeCode ?? "magaza",
                    badgeTone: "info",
                  })),
                  emptyTitle: "Magaza performansi yok.",
                  emptySubtitle: "Secili donem icin magaza bazli performans kaydi bulunamadi.",
                },
              ],
            };
            break;
          }
          case "employee-performance": {
            const response = await getReportEmployeePerformance({ ...scope, limit: 20 });
            const topItem = response.data?.[0];
            model = {
              title: "Calisan performansi",
              subtitle: "Satis ve sepet etkisine gore ekip gorunumu",
              metrics: [
                {
                  key: "users",
                  label: "Calisan",
                  value: formatCount(response.data?.length),
                },
                {
                  key: "top-performer",
                  label: "En iyi ciro",
                  value: formatCurrency(topItem?.totalRevenue, (topItem?.currency as never) ?? "TRY"),
                  hint: `${topItem?.userName ?? "-"} ${topItem?.userSurname ?? ""}`.trim(),
                },
              ],
              sections: [
                {
                  type: "list",
                  title: "Calisan listesi",
                  items: (response.data ?? []).map((item, index) => ({
                    key: `${item.userId ?? index}`,
                    title: `${formatCount(item.rank ?? index + 1)}. ${item.userName ?? "-"} ${item.userSurname ?? ""}`.trim(),
                    subtitle: `${formatCount(item.saleCount)} satis • Sepet ${formatCurrency(item.averageBasket, (item.currency as never) ?? "TRY")}`,
                    caption: `${formatCurrency(item.totalRevenue, (item.currency as never) ?? "TRY")} • Iptal ${formatPercent(item.cancelRate)}`,
                    badgeLabel: item.userEmail ?? "ekip",
                    badgeTone: "info",
                  })),
                  emptyTitle: "Calisan performansi yok.",
                  emptySubtitle: "Secili donem icin ekip performansi kaydi bulunamadi.",
                },
              ],
            };
            break;
          }
          case "customers": {
            const response = await getReportTopCustomers({ ...scope, limit: 20 });
            const topCustomer = response.data?.[0];
            model = {
              title: "Musteri analizi",
              subtitle: "En degerli musteri ve siparis davranisi",
              metrics: [
                {
                  key: "customers",
                  label: "Kayit",
                  value: formatCount(response.data?.length),
                },
                {
                  key: "top-spent",
                  label: "En yuksek harcama",
                  value: formatCurrency(topCustomer?.totalSpent, (topCustomer?.currency as never) ?? "TRY"),
                  hint: `${topCustomer?.name ?? "-"} ${topCustomer?.surname ?? ""}`.trim(),
                },
              ],
              sections: [
                {
                  type: "list",
                  title: "Top musteriler",
                  items: (response.data ?? []).map((item, index) => ({
                    key: `${item.phoneNumber ?? item.email ?? index}`,
                    title: `${formatCount(item.rank ?? index + 1)}. ${item.name ?? "-"} ${item.surname ?? ""}`.trim(),
                    subtitle: `${formatCount(item.totalOrders)} siparis • Sepet ${formatCurrency(item.averageBasket, (item.currency as never) ?? "TRY")}`,
                    caption: `${formatCurrency(item.totalSpent, (item.currency as never) ?? "TRY")} • Son alisveris ${formatDate(item.lastPurchase)}`,
                    badgeLabel: formatPercent(item.cancelRate),
                    badgeTone: Number(item.cancelRate ?? 0) > 10 ? "warning" : "positive",
                  })),
                  emptyTitle: "Musteri analizi yok.",
                  emptySubtitle: "Secili donem icin top musteri verisi bulunamadi.",
                },
              ],
            };
            break;
          }
        }

        setDetailState({
          loading: false,
          error: "",
          model,
        });
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
    if (!isActive || detailKey) return;
    void fetchReports();
  }, [detailKey, fetchReports, isActive]);

  useEffect(() => {
    if (!isActive || !detailKey) return;
    void loadDetail(detailKey);
  }, [detailKey, isActive, loadDetail]);

  const metricCards = useMemo(() => {
    const cards: ReportMetric[] = [];

    if (canReadSales || canReadFinancial) {
      cards.push({
        key: "sales",
        label: "Toplam satis",
        value: formatCurrency(state.salesSummary?.totals?.totalLineTotal, "TRY"),
        hint: `${formatCount(state.salesSummary?.totals?.saleCount)} islem`,
      });
    }

    if (canReadSales) {
      cards.push({
        key: "confirmed",
        label: "Onayli siparis",
        value: formatCount(state.confirmedOrders?.totals?.orderCount),
        hint: formatCurrency(state.confirmedOrders?.totals?.totalLineTotal, "TRY"),
      });
      cards.push({
        key: "returns",
        label: "Iade",
        value: formatCount(state.returns?.totals?.orderCount),
        hint: formatCurrency(state.returns?.totals?.totalLineTotal, "TRY"),
      });
    }

    if (canReadStock) {
      cards.push({
        key: "stock",
        label: "Toplam stok",
        value: formatCount(state.stockTotal?.totals?.todayTotalQuantity),
        hint: `Degisim ${formatPercent(state.stockTotal?.comparison?.changePercent)}`,
      });
    }

    return cards;
  }, [canReadFinancial, canReadSales, canReadStock, state.confirmedOrders, state.returns, state.salesSummary, state.stockTotal]);

  const reportCatalog = useMemo(() => {
    const groups: { title: string; items: CatalogItem[] }[] = [];

    const salesItems: CatalogItem[] = [];
    if (canReadSales || canReadFinancial) {
      salesItems.push({
        key: "sales-summary",
        title: "Satis ozeti",
        description: "Toplam satis, sepet, onay ve iade dengesi.",
      });
    }
    if (canReadSales) {
      salesItems.push(
        {
          key: "cancellations",
          title: "Iptaller",
          description: "Iptal edilen fis ve tutar hareketleri.",
        },
        {
          key: "product-performance",
          title: "Urun performansi",
          description: "En iyi satis ve gelir ureten varyantlar.",
        },
        {
          key: "supplier-performance",
          title: "Tedarikci performansi",
          description: "Tedarikci bazli satis ve miktar etkisi.",
        },
      );
    }
    if (salesItems.length) groups.push({ title: "Satis", items: salesItems });

    const stockItems: CatalogItem[] = [];
    if (canReadStock) {
      stockItems.push(
        {
          key: "stock-summary",
          title: "Stok ozeti",
          description: "Urun ve varyant bazli mevcut stok dagilimi.",
        },
        {
          key: "low-stock",
          title: "Kritik stok",
          description: "Esik altina dusen varyantlarin listesi.",
        },
      );
    }
    if (canReadInventory || canReadStock) {
      stockItems.push(
        {
          key: "dead-stock",
          title: "Dead stock",
          description: "Uzun suredir satilmayan stok kalemleri.",
        },
        {
          key: "inventory-movements",
          title: "Envanter hareketleri",
          description: "Hareket tipi ve son stok aksiyonlari.",
        },
        {
          key: "turnover",
          title: "Turnover",
          description: "Devir hizi ve supply days analizi.",
        },
      );
    }
    if (stockItems.length) groups.push({ title: "Stok", items: stockItems });

    const financeItems: CatalogItem[] = [];
    if (canReadFinancial) {
      financeItems.push(
        {
          key: "revenue-trend",
          title: "Gelir trendi",
          description: "Donemsel ciro ve satis ritmi.",
        },
        {
          key: "profit-margin",
          title: "Kar marji",
          description: "Gelir, maliyet ve brut kar dagilimi.",
        },
        {
          key: "discount-summary",
          title: "Indirim ozeti",
          description: "Kampanya ve magaza bazli indirimler.",
        },
        {
          key: "vat-summary",
          title: "KDV ozeti",
          description: "Vergi orani ve brut toplam dagilimi.",
        },
      );
    }
    if (financeItems.length) groups.push({ title: "Finans", items: financeItems });

    const peopleItems: CatalogItem[] = [];
    if (canReadSales || canReadFinancial) {
      peopleItems.push({
        key: "store-performance",
        title: "Magaza performansi",
        description: "Magaza bazli satis ve sepet etkisi.",
      });
    }
    if (canReadEmployee) {
      peopleItems.push({
        key: "employee-performance",
        title: "Calisan performansi",
        description: "Ekip bazli satis ve verim gorunumu.",
      });
    }
    if (canReadCustomers) {
      peopleItems.push({
        key: "customers",
        title: "Musteri analizi",
        description: "Top musteri harcama ve siparis davranisi.",
      });
    }
    if (peopleItems.length) groups.push({ title: "Insan", items: peopleItems });

    return groups;
  }, [canReadCustomers, canReadEmployee, canReadFinancial, canReadInventory, canReadSales, canReadStock]);

  const rangeLabel = range === "30d" ? "Son 30 gun" : "Son 7 gun";
  const storeScopeLabel = storeIds.length ? `${storeIds.length} magaza` : "Tum magazalar";

  if (detailKey) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title={detailState.model?.title ?? "Rapor detayi"}
            subtitle={detailState.model?.subtitle ?? "Detay verisi yukleniyor"}
            onBack={() => {
              setDetailKey(null);
              setDetailState(initialDetailState);
            }}
            action={
              <Button
                label="Yenile"
                onPress={() => void loadDetail(detailKey)}
                variant="secondary"
                size="sm"
                fullWidth={false}
              />
            }
          />

          {detailState.error ? <Banner text={detailState.error} /> : null}

          <Card>
            <SectionTitle title="Rapor kapsami" />
            <View style={styles.scopeBlock}>
              <FilterTabs value={range} options={rangeOptions} onChange={setRange} />
              <View style={styles.scopeStats}>
                <View style={styles.scopeStat}>
                  <Text style={styles.scopeLabel}>Donem</Text>
                  <Text style={styles.scopeValue}>{rangeLabel}</Text>
                </View>
                <View style={styles.scopeStat}>
                  <Text style={styles.scopeLabel}>Scope</Text>
                  <Text style={styles.scopeValue}>{storeScopeLabel}</Text>
                </View>
              </View>
            </View>
          </Card>

          {detailState.loading ? (
            <>
              <View style={styles.metricGrid}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <View key={index} style={styles.metricItem}>
                    <Card style={styles.metricSkeletonCard}>
                      <SkeletonBlock width="45%" />
                      <SkeletonBlock height={28} width="65%" style={styles.skeletonGap} />
                      <SkeletonBlock width="55%" />
                    </Card>
                  </View>
                ))}
              </View>
              <Card>
                <SkeletonBlock height={18} width="35%" />
                <View style={styles.loadingList}>
                  <SkeletonBlock height={72} />
                  <SkeletonBlock height={72} />
                </View>
              </Card>
            </>
          ) : detailState.model ? (
            <>
              {detailState.model.metrics.length ? (
                <View style={styles.metricGrid}>
                  {detailState.model.metrics.map((metric) => (
                    <View key={metric.key} style={styles.metricItem}>
                      <MetricCard label={metric.label} value={metric.value} hint={metric.hint} />
                    </View>
                  ))}
                </View>
              ) : null}

              {detailState.model.sections.map((section) => {
                if (section.type === "stats") {
                  return (
                    <Card key={section.title}>
                      <SectionTitle title={section.title} />
                      <View style={styles.detailStats}>
                        {section.items.map((item) => (
                          <View key={item.label} style={styles.scopeStat}>
                            <Text style={styles.scopeLabel}>{item.label}</Text>
                            <Text style={styles.scopeValue}>{item.value}</Text>
                          </View>
                        ))}
                      </View>
                    </Card>
                  );
                }

                if (section.type === "bars") {
                  return (
                    <Card key={section.title}>
                      <SectionTitle title={section.title} />
                      {section.items.length ? (
                        <BarList items={section.items} formatter={section.formatter} />
                      ) : (
                        <EmptyStateWithAction
                          title="Bar veri bulunamadi."
                          subtitle="Secili kapsam icin ozet dagilim kaydi yok."
                          actionLabel="Yenile"
                          onAction={() => void loadDetail(detailKey)}
                        />
                      )}
                    </Card>
                  );
                }

                return (
                  <Card key={section.title}>
                    <SectionTitle title={section.title} />
                    {section.items.length ? (
                      <View style={styles.list}>
                        {section.items.map((item) => (
                          <ListRow
                            key={item.key}
                            title={item.title}
                            subtitle={item.subtitle}
                            caption={item.caption}
                            badgeLabel={item.badgeLabel}
                            badgeTone={item.badgeTone ?? "neutral"}
                          />
                        ))}
                      </View>
                    ) : (
                      <EmptyStateWithAction
                        title={section.emptyTitle}
                        subtitle={section.emptySubtitle}
                        actionLabel="Yenile"
                        onAction={() => void loadDetail(detailKey)}
                      />
                    )}
                  </Card>
                );
              })}

              {detailState.model.note ? (
                <Card>
                  <SectionTitle title="Operator notu" />
                  <Text style={styles.noteText}>{detailState.model.note}</Text>
                </Card>
              ) : null}
            </>
          ) : (
            <EmptyStateWithAction
              title="Rapor detayi yuklenemedi."
              subtitle="Bu raporu yeniden acmayi dene."
              actionLabel="Geri don"
              onAction={() => {
                setDetailKey(null);
                setDetailState(initialDetailState);
              }}
            />
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="Quick insights"
          subtitle="Mobilde hizli rapor ozeti ve detay merkezi"
          onBack={onBack}
          action={
            <Button
              label="Yenile"
              onPress={() => void fetchReports()}
              variant="secondary"
              size="sm"
              fullWidth={false}
            />
          }
        />

        {state.error ? <Banner text={state.error} /> : null}

        <Card>
          <SectionTitle title="Rapor kapsami" />
          <View style={styles.scopeBlock}>
            <FilterTabs value={range} options={rangeOptions} onChange={setRange} />
            <View style={styles.scopeStats}>
              <View style={styles.scopeStat}>
                <Text style={styles.scopeLabel}>Donem</Text>
                <Text style={styles.scopeValue}>{rangeLabel}</Text>
              </View>
              <View style={styles.scopeStat}>
                <Text style={styles.scopeLabel}>Scope</Text>
                <Text style={styles.scopeValue}>{storeScopeLabel}</Text>
              </View>
            </View>
          </View>
        </Card>

        {!hasAnyReports ? (
          <EmptyStateWithAction
            title="Bu hesap icin desteklenen mobil rapor yok."
            subtitle="Rapor merkezi satis, stok, finans, ekip veya musteri okuma izinleriyle calisir."
            actionLabel="Geri don"
            onAction={() => onBack?.()}
          />
        ) : (
          <>
            {hasQuickInsights ? (
              <>
                <View style={styles.metricGrid}>
                  {metricCards.map((metric) => (
                    <View key={metric.key} style={styles.metricItem}>
                      {state.loading ? (
                        <Card style={styles.metricSkeletonCard}>
                          <SkeletonBlock width="45%" />
                          <SkeletonBlock height={28} width="65%" style={styles.skeletonGap} />
                          <SkeletonBlock width="55%" />
                        </Card>
                      ) : (
                        <MetricCard label={metric.label} value={metric.value} hint={metric.hint} />
                      )}
                    </View>
                  ))}
                </View>

                {canReadFinancial ? (
                  <Card>
                    <SectionTitle
                      title="Gelir trendi"
                      action={
                        <Button
                          label="Detay"
                          onPress={() => setDetailKey("revenue-trend")}
                          variant="ghost"
                          size="sm"
                          fullWidth={false}
                        />
                      }
                    />
                    {state.loading ? (
                      <View style={styles.loadingList}>
                        <SkeletonBlock height={18} />
                        <SkeletonBlock height={18} width="80%" />
                        <SkeletonBlock height={18} width="68%" />
                      </View>
                    ) : state.revenueTrend.length ? (
                      <BarList
                        items={state.revenueTrend.map((item, index) => ({
                          key: `${item.period ?? index}`,
                          label: item.period ?? `${index + 1}`,
                          value: Number(item.totalRevenue ?? 0),
                        }))}
                        formatter={(value) => formatCurrency(value, "TRY")}
                      />
                    ) : (
                      <EmptyStateWithAction
                        title="Trend verisi yok."
                        subtitle="Secili donem icin gelir kaydi bulunamadi."
                        actionLabel="Yenile"
                        onAction={() => void fetchReports()}
                      />
                    )}
                  </Card>
                ) : null}

                {canReadSales ? (
                  <Card>
                    <SectionTitle
                      title="En cok satanlar"
                      action={
                        <Button
                          label="Detay"
                          onPress={() => setDetailKey("product-performance")}
                          variant="ghost"
                          size="sm"
                          fullWidth={false}
                        />
                      }
                    />
                    {state.loading ? (
                      <View style={styles.loadingList}>
                        <SkeletonBlock height={72} />
                        <SkeletonBlock height={72} />
                      </View>
                    ) : state.productSales.length ? (
                      <View style={styles.list}>
                        {state.productSales.map((item, index) => (
                          <ListRow
                            key={`${item.productVariantId ?? index}`}
                            title={item.variantName ?? item.productName ?? `Kalem ${index + 1}`}
                            subtitle={`${formatCount(item.quantity)} adet`}
                            caption={formatCurrency(item.lineTotal, "TRY")}
                            badgeLabel="satis"
                            badgeTone="info"
                          />
                        ))}
                      </View>
                    ) : (
                      <EmptyStateWithAction
                        title="Urun satis verisi yok."
                        subtitle="Secili donem icinde satis kaydi olustugunda burada gorunecek."
                        actionLabel="Yenile"
                        onAction={() => void fetchReports()}
                      />
                    )}
                  </Card>
                ) : null}

                {canReadStock ? (
                  <Card>
                    <SectionTitle
                      title="Kritik stoklar"
                      action={
                        <Button
                          label="Detay"
                          onPress={() => setDetailKey("low-stock")}
                          variant="ghost"
                          size="sm"
                          fullWidth={false}
                        />
                      }
                    />
                    {state.loading ? (
                      <View style={styles.loadingList}>
                        <SkeletonBlock height={72} />
                        <SkeletonBlock height={72} />
                      </View>
                    ) : state.lowStock.length ? (
                      <View style={styles.list}>
                        {state.lowStock.map((item, index) => (
                          <ListRow
                            key={`${item.productVariantId ?? index}-${item.storeId ?? "scope"}`}
                            title={item.variantName ?? item.productName ?? "Dusuk stok"}
                            subtitle={item.storeName ?? storeScopeLabel}
                            caption={`${formatCount(item.quantity)} adet kaldi`}
                            badgeLabel="kritik"
                            badgeTone="warning"
                          />
                        ))}
                      </View>
                    ) : (
                      <EmptyStateWithAction
                        title="Kritik stok yok."
                        subtitle="Secili donem ve scope icin kritik stok kalemi bulunmadi."
                        actionLabel="Yenile"
                        onAction={() => void fetchReports()}
                      />
                    )}
                  </Card>
                ) : null}

                {canReadSales ? (
                  <Card>
                    <SectionTitle
                      title="Son iptaller"
                      action={
                        <Button
                          label="Detay"
                          onPress={() => setDetailKey("cancellations")}
                          variant="ghost"
                          size="sm"
                          fullWidth={false}
                        />
                      }
                    />
                    {state.loading ? (
                      <View style={styles.loadingList}>
                        <SkeletonBlock height={72} />
                        <SkeletonBlock height={72} />
                      </View>
                    ) : state.cancellations.length ? (
                      <View style={styles.list}>
                        {state.cancellations.map((item, index) => (
                          <ListRow
                            key={`${item.id ?? item.receiptNo ?? index}`}
                            title={item.receiptNo ?? "Iptal edilen fis"}
                            subtitle={`${item.name ?? "-"} ${item.surname ?? ""}`.trim()}
                            caption={`${formatDate(item.cancelledAt ?? item.createdAt)} • ${formatCurrency(item.lineTotal ?? item.unitPrice, "TRY")}`}
                            badgeLabel="iptal"
                            badgeTone="danger"
                          />
                        ))}
                      </View>
                    ) : (
                      <EmptyStateWithAction
                        title="Iptal kaydi yok."
                        subtitle="Secili donemde iptal edilen satis bulunmadi."
                        actionLabel="Yenile"
                        onAction={() => void fetchReports()}
                      />
                    )}
                  </Card>
                ) : null}
              </>
            ) : null}

            {reportCatalog.map((group) => (
              <Card key={group.title}>
                <SectionTitle title={group.title} />
                <View style={styles.catalogList}>
                  {group.items.map((item) => (
                    <ListRow
                      key={item.key}
                      title={item.title}
                      subtitle={item.description}
                      caption="Detay raporu ac"
                      onPress={() => setDetailKey(item.key)}
                      icon={
                        <View style={styles.catalogIcon}>
                          <Text style={styles.catalogIconText}>
                            {item.title.slice(0, 1).toUpperCase()}
                          </Text>
                        </View>
                      }
                    />
                  ))}
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: mobileTheme.colors.dark.bg,
  },
  screenContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
    gap: 16,
  },
  scopeBlock: {
    marginTop: 12,
    gap: 12,
  },
  scopeStats: {
    gap: 12,
  },
  scopeStat: {
    gap: 4,
  },
  scopeLabel: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  scopeValue: {
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricItem: {
    flexBasis: "47%",
    flexGrow: 1,
    minWidth: 150,
  },
  metricSkeletonCard: {
    minHeight: 132,
    gap: 8,
  },
  skeletonGap: {
    marginVertical: 6,
  },
  loadingList: {
    marginTop: 12,
    gap: 12,
  },
  list: {
    marginTop: 12,
    gap: 12,
  },
  detailStats: {
    marginTop: 12,
    gap: 12,
  },
  noteText: {
    marginTop: 12,
    color: mobileTheme.colors.dark.text2,
    fontSize: 13,
    lineHeight: 19,
  },
  catalogList: {
    marginTop: 12,
    gap: 12,
  },
  catalogIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.dark.surface2,
  },
  catalogIconText: {
    color: mobileTheme.colors.brand.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});
