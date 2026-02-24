"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getReportProfitMargin,
  type ProfitMarginItem,
  type ProfitMarginResponse,
} from "@/lib/reports";
import { formatPrice } from "@/lib/format";

const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

export default function ProfitMarginPage() {
  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);
  const [limit, setLimit] = useState(50);
  const [items, setItems] = useState<ProfitMarginItem[]>([]);
  const [totals, setTotals] = useState<ProfitMarginResponse["totals"]>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportProfitMargin({ startDate, endDate, limit });
      setItems(res.data ?? []);
      setTotals(res.totals);
    } catch {
      setItems([]);
      setTotals(undefined);
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, limit]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const hasCurrency = items.some((item) => Boolean(item.currency));

  const summaryCards = [
    { label: "Toplam Gelir", value: formatPrice(totals?.totalRevenue) },
    { label: "Toplam Maliyet", value: formatPrice(totals?.totalCost) },
    { label: "Brut Kar", value: formatPrice(totals?.grossProfit) },
    {
      label: "Kar Marji",
      value:
        totals?.profitMargin != null
          ? totals.profitMargin.toFixed(1) + "%"
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
        <h1 className="text-xl font-semibold text-text">Kar Marji</h1>
        <p className="text-sm text-muted">
          Urun bazli kar marji analizi
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
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">
            Limit
          </label>
          <input
            type="number"
            min={1}
            max={500}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) || 50)}
            className="h-10 w-24 rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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
      ) : items.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-surface p-12">
          <p className="text-sm text-muted">
            Secilen tarih araliginda veri bulunamadi.
          </p>
        </div>
      ) : (
        <>
          {/* Totals */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-text">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-6 shadow-glow">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="pb-3 pr-4">Urun</th>
                  <th className="pb-3 pr-4">Varyant</th>
                  <th className="pb-3 pr-4">Kod</th>
                  <th className="pb-3 pr-4">Satilan</th>
                  {hasCurrency && <th className="pb-3 pr-4">PB</th>}
                  <th className="pb-3 pr-4">Gelir</th>
                  <th className="pb-3 pr-4">Maliyet</th>
                  <th className="pb-3 pr-4">Brut Kar</th>
                  <th className="pb-3">Marj</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, idx) => (
                  <tr key={idx} className="text-text">
                    <td className="py-3 pr-4 font-medium">
                      {item.productName ?? "-"}
                    </td>
                    <td className="py-3 pr-4">{item.variantName ?? "-"}</td>
                    <td className="py-3 pr-4">{item.variantCode ?? "-"}</td>
                    <td className="py-3 pr-4">{item.soldQuantity ?? 0}</td>
                    {hasCurrency && <td className="py-3 pr-4">{item.currency ?? "-"}</td>}
                    <td className="py-3 pr-4">{formatPrice(item.totalRevenue)}</td>
                    <td className="py-3 pr-4">{formatPrice(item.totalCost)}</td>
                    <td className="py-3 pr-4">{formatPrice(item.grossProfit)}</td>
                    <td className="py-3">
                      {item.profitMargin != null
                        ? item.profitMargin.toFixed(1) + "%"
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
