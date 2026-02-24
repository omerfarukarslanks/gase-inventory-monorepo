"use client";

import Link from "next/link";

const reportCategories = [
  {
    title: "Satis Raporlari",
    items: [
      { href: "/reports/sales-summary", label: "Satis Ozeti", desc: "Genel satis istatistikleri ve ozet" },
      { href: "/reports/cancellations", label: "Iptal Raporlari", desc: "Iptal edilen fislerin detayli listesi" },
      { href: "/reports/product-performance", label: "Urun Performansi", desc: "Urun bazli satis siralamasi" },
      { href: "/reports/supplier-performance", label: "Tedarikci Performansi", desc: "Tedarikci bazli satis ve ciro analizi" },
    ],
  },
  {
    title: "Stok Raporlari",
    items: [
      { href: "/reports/stock-summary", label: "Stok Ozeti", desc: "Urun-varyant-magaza stok durumu" },
      { href: "/reports/low-stock", label: "Dusuk Stok", desc: "Esik degerinin altindaki stoklar" },
      { href: "/reports/dead-stock", label: "Olu Stok", desc: "Uzun suredir satilmayan urunler" },
      { href: "/reports/inventory-movements", label: "Stok Hareketleri", desc: "Giris/cikis hareket ozeti" },
      { href: "/reports/turnover", label: "Stok Devir Hizi", desc: "Urun bazli devir hizi analizi" },
    ],
  },
  {
    title: "Finansal Raporlar",
    items: [
      { href: "/reports/revenue-trend", label: "Gelir Trendi", desc: "Gunluk/haftalik/aylik gelir trendi" },
      { href: "/reports/profit-margin", label: "Kar Marji", desc: "Urun bazli kar marji analizi" },
      { href: "/reports/discount-summary", label: "Indirim Ozeti", desc: "Kampanya ve indirim analizi" },
      { href: "/reports/vat-summary", label: "KDV Ozeti", desc: "Aylik KDV hesap ozeti" },
    ],
  },
  {
    title: "Magaza & Calisan",
    items: [
      { href: "/reports/store-performance", label: "Magaza Performansi", desc: "Magaza bazli satis metrikleri" },
      { href: "/reports/employee-performance", label: "Calisan Performansi", desc: "Calisan bazli satis performansi" },
    ],
  },
  {
    title: "Musteri",
    items: [{ href: "/reports/customers", label: "Musteri Analizi", desc: "En iyi musteriler ve harcama analizi" }],
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Raporlar</h1>
        <p className="text-sm text-muted">Tum rapor kategorileri ve detayli analizler</p>
      </div>

      {reportCategories.map((category) => (
        <section key={category.title}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{category.title}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {category.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-xl2 border border-border bg-surface p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <h3 className="text-sm font-semibold text-text group-hover:text-primary">{item.label}</h3>
                <p className="mt-1 text-xs text-muted">{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
