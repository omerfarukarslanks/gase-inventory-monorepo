"use client";

export type ReportFilterState = {
  startDate?: string;
  endDate?: string;
  storeIds?: string[];
  search?: string;
  [key: string]: unknown;
};

export type ReportScopeState = {
  route: string;
  storeIds?: string[];
  activeStoreId?: string | null;
};

export type ReportPageConfig = {
  reportType: string;
  title: string;
  description?: string;
  path: string;
};

export type ReportSummaryItem = {
  label: string;
  value: string | number;
  hint?: string;
};

export type AiReportContext = ReportPageConfig & {
  filters?: ReportFilterState;
  scope?: ReportScopeState;
  summary?: ReportSummaryItem[];
  rowCount?: number;
  promptPresets?: string[];
};

export type ReportDirectoryItem = {
  href: string;
  title: string;
  description: string;
};

export type ReportDirectorySection = {
  id: string;
  title: string;
  description: string;
  items: ReportDirectoryItem[];
};

export const REPORT_DIRECTORY: ReportDirectorySection[] = [
  {
    id: "sales",
    title: "Satis ve performans",
    description: "Gelir, iptal, urun ve tedarikci performansi raporlari.",
    items: [
      { href: "/reports/sales-summary", title: "Satis Ozeti", description: "Toplam satis, onay ve ciro ozetleri." },
      { href: "/reports/cancellations", title: "Iptal Raporlari", description: "Iptal edilen fisler ve iptal tutarlari." },
      { href: "/reports/product-performance", title: "Urun Performansi", description: "Satis sira ve gelir performansi." },
      { href: "/reports/supplier-performance", title: "Tedarikci Performansi", description: "Tedarikci bazli satis ve ciro analizi." },
      { href: "/reports/employee-performance", title: "Calisan Performansi", description: "Calisan bazli satis etkinligi." },
    ],
  },
  {
    id: "stock",
    title: "Stok ve envanter",
    description: "Dusuk stok, olu stok ve stok hareketleri izleme.",
    items: [
      { href: "/reports/stock-summary", title: "Stok Ozeti", description: "Urun, varyant ve magaza stok dagilimi." },
      { href: "/reports/low-stock", title: "Dusuk Stok", description: "Esik altindaki varyantlar." },
      { href: "/reports/dead-stock", title: "Olu Stok", description: "Uzun suredir satilmayan urunler." },
      { href: "/reports/inventory-movements", title: "Stok Hareketleri", description: "Giris, cikis ve transfer hareketleri." },
      { href: "/reports/turnover", title: "Stok Devir Hizi", description: "Devir hizi ve tedarik yeterliligi." },
    ],
  },
  {
    id: "financial",
    title: "Finans ve uyumluluk",
    description: "Gelir trendi, marj, indirim ve KDV ozetleri.",
    items: [
      { href: "/reports/revenue-trend", title: "Gelir Trendi", description: "Donem bazli gelir degisimi." },
      { href: "/reports/profit-margin", title: "Kar Marji", description: "Urun bazli marj ve brut kar." },
      { href: "/reports/discount-summary", title: "Indirim Ozeti", description: "Kampanya ve magaza bazli indirimler." },
      { href: "/reports/vat-summary", title: "KDV Ozeti", description: "Aylik vergi ve brut toplam ozetleri." },
    ],
  },
  {
    id: "store-customer",
    title: "Magaza ve musteri",
    description: "Magaza bazli performans ve musteri segmentleri.",
    items: [
      { href: "/reports/store-performance", title: "Magaza Performansi", description: "Magazalar arasi satis karsilastirmasi." },
      { href: "/reports/customers", title: "Musteri Analizi", description: "En degerli musteriler ve harcama dagilimi." },
    ],
  },
];

function escapeCsvCell(value: unknown): string {
  if (value == null) return "";
  const serialized = String(value).replaceAll('"', '""');
  return /[",\n]/.test(serialized) ? `"${serialized}"` : serialized;
}

export function exportRowsToCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (typeof window === "undefined" || rows.length === 0) return;

  const columns = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );

  const csvLines = [
    columns.map((column) => escapeCsvCell(column)).join(","),
    ...rows.map((row) => columns.map((column) => escapeCsvCell(row[column])).join(",")),
  ];

  const blob = new Blob(["\uFEFF" + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function getDateRange(days: number) {
  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  return { startDate, endDate };
}

export const reportInputClassName =
  "h-10 rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary";
