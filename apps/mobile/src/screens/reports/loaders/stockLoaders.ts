import {
  getReportDeadStock,
  getReportLowStock,
  getReportMovements,
  getReportStockSummary,
  getReportTurnover,
} from "@gase/core";
import { formatCount, formatCurrency, formatDate } from "@/src/lib/format";
import type { ReportDetailModel } from "../types";

type Scope = {
  startDate: string;
  endDate: string;
  compareDate: string;
  storeIds?: string[];
};

export async function buildStockSummaryModel(scope: Scope, _range: "7d" | "30d"): Promise<ReportDetailModel> {
  const response = await getReportStockSummary({ ...scope, limit: 20 });
  return {
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
}

export async function buildLowStockModel(scope: Scope, _range: "7d" | "30d"): Promise<ReportDetailModel> {
  const response = await getReportLowStock({ ...scope, threshold: 50, limit: 20 });
  return {
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
}

export async function buildDeadStockModel(scope: Scope, range: "7d" | "30d"): Promise<ReportDetailModel> {
  const response = await getReportDeadStock({
    ...scope,
    noSaleDays: range === "30d" ? 30 : 14,
    limit: 20,
  });
  return {
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
}

export async function buildInventoryMovementsModel(scope: Scope, _range: "7d" | "30d"): Promise<ReportDetailModel> {
  const response = await getReportMovements({ ...scope, limit: 20 });
  return {
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
}

export async function buildTurnoverModel(scope: Scope, range: "7d" | "30d"): Promise<ReportDetailModel> {
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
  return {
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
}
