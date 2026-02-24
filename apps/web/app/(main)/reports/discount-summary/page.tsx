"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getReportDiscountSummary,
  type DiscountByCampaign,
  type DiscountByStore,
} from "@/lib/reports";
import { formatPrice } from "@/lib/format";

const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

export default function DiscountSummaryPage() {
  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);
  const [totalDiscount, setTotalDiscount] = useState<number | undefined>(undefined);
  const [byCampaign, setByCampaign] = useState<DiscountByCampaign[]>([]);
  const [byStore, setByStore] = useState<DiscountByStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportDiscountSummary({ startDate, endDate });
      setTotalDiscount(res.totalDiscount);
      setByCampaign(res.byCampaign ?? []);
      setByStore(res.byStore ?? []);
    } catch {
      setTotalDiscount(undefined);
      setByCampaign([]);
      setByStore([]);
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const hasData = byCampaign.length > 0 || byStore.length > 0;
  const campaignHasCurrency = byCampaign.some((item) => Boolean(item.currency));
  const storeHasCurrency = byStore.some((item) => Boolean(item.currency));

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
        <h1 className="text-xl font-semibold text-text">Indirim Ozeti</h1>
        <p className="text-sm text-muted">
          Kampanya ve magaza bazli indirim analizi
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
      ) : !hasData ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-surface p-12">
          <p className="text-sm text-muted">
            Secilen tarih araliginda veri bulunamadi.
          </p>
        </div>
      ) : (
        <>
          {/* Total discount */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Toplam Indirim
            </p>
            <p className="mt-2 text-2xl font-bold text-text">
              {formatPrice(totalDiscount)}
            </p>
          </div>

          {/* Campaign table */}
          {byCampaign.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-6 shadow-glow">
              <h2 className="mb-4 text-base font-semibold text-text">
                Kampanya Bazli
              </h2>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
                    <th className="pb-3 pr-4">Kampanya Kodu</th>
                    {campaignHasCurrency && <th className="pb-3 pr-4">PB</th>}
                    <th className="pb-3 pr-4">Toplam Indirim</th>
                    <th className="pb-3">Satis Adedi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {byCampaign.map((item, idx) => (
                    <tr key={idx} className="text-text">
                      <td className="py-3 pr-4 font-medium">
                        {item.campaignCode ?? "Kampanyasiz"}
                      </td>
                      {campaignHasCurrency && (
                        <td className="py-3 pr-4">
                          {item.currency ?? "-"}
                        </td>
                      )}
                      <td className="py-3 pr-4">
                        {formatPrice(item.totalDiscount)}
                      </td>
                      <td className="py-3">{item.saleCount ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Store table */}
          {byStore.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-6 shadow-glow">
              <h2 className="mb-4 text-base font-semibold text-text">
                Magaza Bazli
              </h2>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
                    <th className="pb-3 pr-4">Magaza</th>
                    {storeHasCurrency && <th className="pb-3 pr-4">PB</th>}
                    <th className="pb-3 pr-4">Toplam Indirim</th>
                    <th className="pb-3">Satis Adedi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {byStore.map((item, idx) => (
                    <tr key={idx} className="text-text">
                      <td className="py-3 pr-4 font-medium">
                        {item.storeName ?? "-"}
                      </td>
                      {storeHasCurrency && (
                        <td className="py-3 pr-4">
                          {item.currency ?? "-"}
                        </td>
                      )}
                      <td className="py-3 pr-4">
                        {formatPrice(item.totalDiscount)}
                      </td>
                      <td className="py-3">{item.saleCount ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
