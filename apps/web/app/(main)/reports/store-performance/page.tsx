"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getReportStorePerformance,
  type StorePerformanceItem,
} from "@/lib/reports";
import { formatPrice } from "@/lib/format";

const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

export default function StorePerformancePage() {
  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);
  const [items, setItems] = useState<StorePerformanceItem[]>([]);
  const [totals, setTotals] = useState<{
    totalSales?: number;
    totalConfirmed?: number;
    totalCancelled?: number;
    totalLineTotal?: number;
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportStorePerformance({ startDate, endDate });
      setItems(res.data ?? []);
      setTotals(res.totals ?? {});
    } catch {
      setItems([]);
      setTotals({});
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

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
        <h1 className="text-xl font-semibold text-text">Magaza Performansi</h1>
        <p className="text-sm text-muted">
          Secilen tarih araliginda magazalarin satis performansi
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

      {/* Totals */}
      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Toplam Satis
            </p>
            <p className="mt-1 text-2xl font-bold text-text">
              {totals.totalSales ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Onayli
            </p>
            <p className="mt-1 text-2xl font-bold text-text">
              {totals.totalConfirmed ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Iptal
            </p>
            <p className="mt-1 text-2xl font-bold text-text">
              {totals.totalCancelled ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Toplam Gelir
            </p>
            <p className="mt-1 text-2xl font-bold text-text">
              {formatPrice(totals.totalLineTotal)}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-surface p-12">
          <p className="text-sm text-muted">Yukleniyor...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-surface p-12">
          <p className="text-sm text-muted">
            Secilen tarih araliginda magaza performans verisi bulunamadi.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-glow">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Magaza
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Kod
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                  Satis
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                  Onayli
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                  Iptal
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                  Toplam Gelir
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                  Ort. Sepet
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                  Iptal Orani
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={item.storeId ?? idx}
                  className="border-b border-border last:border-b-0 transition-colors hover:bg-primary/5"
                >
                  <td className="px-4 py-3 font-medium text-text">
                    {item.storeName ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-text">
                    {item.storeCode ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-text">
                    {item.saleCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right text-text">
                    {item.confirmedCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right text-text">
                    {item.cancelledCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-text">
                    {formatPrice(item.totalLineTotal)}
                  </td>
                  <td className="px-4 py-3 text-right text-text">
                    {formatPrice(item.averageBasket)}
                  </td>
                  <td className="px-4 py-3 text-right text-text">
                    {item.cancelRate != null
                      ? item.cancelRate.toFixed(1) + "%"
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
