"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getReportSalesSummary, type SalesSummaryResponse } from "@/lib/reports";
import { formatPrice } from "@/lib/format";

const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

export default function SalesSummaryPage() {
  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState<SalesSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportSalesSummary({ startDate, endDate });
      setData(res);
    } catch {
      setData(null);
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const totals = data?.totals;

  const cards: { label: string; value: string }[] = [
    { label: "Satis Adedi", value: String(totals?.saleCount ?? 0) },
    { label: "Onaylanan", value: String(totals?.confirmedCount ?? 0) },
    { label: "Iptal Edilen", value: String(totals?.cancelledCount ?? 0) },
    { label: "Toplam Birim Fiyat", value: formatPrice(totals?.totalUnitPrice) },
    { label: "Toplam Ciro", value: formatPrice(totals?.totalLineTotal) },
    { label: "Ortalama Sepet", value: formatPrice(totals?.averageBasket) },
    {
      label: "Iptal Orani",
      value:
        totals?.cancelRate != null
          ? `%${(totals.cancelRate * 100).toFixed(1)}`
          : "-",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/reports"
          className="mb-2 inline-block text-sm text-primary hover:underline"
        >
          &larr; Raporlar
        </Link>
        <h1 className="text-xl font-semibold text-text">Satis Ozeti</h1>
        <p className="text-sm text-muted">
          Secilen tarih araligindaki genel satis istatistikleri
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">
            Baslangic
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">
            Bitis
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-10 rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          onClick={() => void fetchData()}
          disabled={loading}
          className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Yukleniyor..." : "Filtrele"}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-surface p-12">
          <p className="text-sm text-muted">Yukleniyor...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      ) : !totals ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-surface p-12">
          <p className="text-sm text-muted">
            Secilen tarih araliginda veri bulunamadi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-text">{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
