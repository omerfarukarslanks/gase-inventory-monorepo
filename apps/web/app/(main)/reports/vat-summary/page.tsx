"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getReportVatSummary,
  type VatSummaryItem,
  type VatSummaryResponse,
} from "@/lib/reports";
import { formatPrice } from "@/lib/format";

const currentMonth = new Date().toISOString().slice(0, 7);

export default function VatSummaryPage() {
  const [month, setMonth] = useState(currentMonth);
  const [items, setItems] = useState<VatSummaryItem[]>([]);
  const [totals, setTotals] = useState<VatSummaryResponse["totals"]>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportVatSummary({ month });
      setItems(res.data ?? []);
      setTotals(res.totals);
    } catch {
      setItems([]);
      setTotals(undefined);
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const summaryCards = [
    { label: "Net Satis", value: formatPrice(totals?.netSales) },
    { label: "KDV Tutari", value: formatPrice(totals?.taxAmount) },
    { label: "Brut Toplam", value: formatPrice(totals?.grossTotal) },
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
        <h1 className="text-xl font-semibold text-text">KDV Ozeti</h1>
        <p className="text-sm text-muted">
          Aylik KDV orani bazli vergi ozeti
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">
            Ay
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
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
      ) : items.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-surface p-12">
          <p className="text-sm text-muted">
            Secilen donemde veri bulunamadi.
          </p>
        </div>
      ) : (
        <>
          {/* Totals */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                  <th className="pb-3 pr-4">KDV Orani</th>
                  <th className="pb-3 pr-4">Islem Sayisi</th>
                  <th className="pb-3 pr-4">Iptal Sayisi</th>
                  <th className="pb-3 pr-4">Net Satis</th>
                  <th className="pb-3 pr-4">KDV Tutari</th>
                  <th className="pb-3">Brut Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, idx) => (
                  <tr key={idx} className="text-text">
                    <td className="py-3 pr-4 font-medium">
                      {item.taxRate != null ? "%" + item.taxRate : "-"}
                    </td>
                    <td className="py-3 pr-4">{item.transactionCount ?? 0}</td>
                    <td className="py-3 pr-4">{item.cancelledCount ?? 0}</td>
                    <td className="py-3 pr-4">{formatPrice(item.netSales)}</td>
                    <td className="py-3 pr-4">{formatPrice(item.taxAmount)}</td>
                    <td className="py-3">{formatPrice(item.grossTotal)}</td>
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
