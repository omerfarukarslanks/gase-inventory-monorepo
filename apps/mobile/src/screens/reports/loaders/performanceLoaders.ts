import {
  getReportEmployeePerformance,
  getReportProductRanking,
  getReportStorePerformance,
  getReportSupplierSalesPerformance,
  getReportTopCustomers,
} from "@gase/core";
import { formatCount, formatCurrency, formatDate } from "@/src/lib/format";
import { formatPercent } from "../utils/reportHelpers";
import type { ReportDetailModel } from "../types";

type Scope = {
  startDate: string;
  endDate: string;
  compareDate: string;
  storeIds?: string[];
};

export async function buildProductPerformanceModel(scope: Scope, _range: "7d" | "30d"): Promise<ReportDetailModel> {
  const response = await getReportProductRanking({ ...scope, limit: 20 });
  const topItem = response.data?.[0];
  return {
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
}

export async function buildSupplierPerformanceModel(scope: Scope, _range: "7d" | "30d"): Promise<ReportDetailModel> {
  const response = await getReportSupplierSalesPerformance({ ...scope, limit: 20 });
  return {
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
}

export async function buildStorePerformanceModel(scope: Scope, _range: "7d" | "30d"): Promise<ReportDetailModel> {
  const response = await getReportStorePerformance({ ...scope, limit: 20 });
  return {
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
}

export async function buildEmployeePerformanceModel(scope: Scope, _range: "7d" | "30d"): Promise<ReportDetailModel> {
  const response = await getReportEmployeePerformance({ ...scope, limit: 20 });
  const topItem = response.data?.[0];
  return {
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
}

export async function buildCustomersModel(scope: Scope, _range: "7d" | "30d"): Promise<ReportDetailModel> {
  const response = await getReportTopCustomers({ ...scope, limit: 20 });
  const topCustomer = response.data?.[0];
  return {
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
}
