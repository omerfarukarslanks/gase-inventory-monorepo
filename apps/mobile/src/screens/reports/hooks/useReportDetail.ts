import {
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
  getReportSalesSummary,
  getReportStockSummary,
  getReportStorePerformance,
  getReportSupplierSalesPerformance,
  getReportTopCustomers,
  getReportTurnover,
  getReportVatSummary,
} from "@gase/core";
import { useCallback, useEffect, useState } from "react"; // useState kept for detailState
import { formatCount, formatCurrency, formatDate } from "@/src/lib/format";
import { formatPercent, formatReportDateLabel } from "../utils/reportHelpers";
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
