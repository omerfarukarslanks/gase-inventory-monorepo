import {
  getReportCancellations,
  getReportConfirmedOrders,
  getReportDiscountSummary,
  getReportProfitMargin,
  getReportReturns,
  getReportRevenueTrend,
  getReportSalesSummary,
  getReportVatSummary,
} from "@gase/core";
import { formatCount, formatCurrency, formatDate } from "@/src/lib/format";
import { formatPercent, formatReportDateLabel } from "../utils/reportHelpers";
import type { ReportDetailModel } from "../types";

type Scope = {
  startDate: string;
  endDate: string;
  compareDate: string;
  storeIds?: string[];
};

export async function buildSalesSummaryModel(scope: Scope, _range: "7d" | "30d"): Promise<ReportDetailModel> {
  const [salesSummary, confirmedOrders, returns] = await Promise.all([
    getReportSalesSummary(scope),
    getReportConfirmedOrders(scope),
    getReportReturns(scope),
  ]);
  return {
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
    note: "Bu rapor satis temposunu ve iptal/iade etkisini tek bakista gosterir. Dusuk ortalama sepet veya yuksek iptal orani olan donemler sonraki operasyon iyilestirme alanidir.",
  };
}

export async function buildCancellationsModel(scope: Scope, _range: "7d" | "30d"): Promise<ReportDetailModel> {
  const response = await getReportCancellations({ ...scope, limit: 20 });
  return {
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
}

export async function buildRevenueTrendModel(scope: Scope, range: "7d" | "30d"): Promise<ReportDetailModel> {
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
  return {
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
}

export async function buildDiscountSummaryModel(scope: Scope, _range: "7d" | "30d"): Promise<ReportDetailModel> {
  const response = await getReportDiscountSummary(scope);
  return {
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
}

export async function buildVatSummaryModel(scope: Scope, _range: "7d" | "30d"): Promise<ReportDetailModel> {
  const response = await getReportVatSummary({
    storeIds: scope.storeIds,
    month: scope.endDate?.slice(0, 7),
    breakdown: "store",
  });
  return {
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
}

export async function buildProfitMarginModel(scope: Scope, _range: "7d" | "30d"): Promise<ReportDetailModel> {
  const response = await getReportProfitMargin({ ...scope, limit: 20 });
  return {
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
}
