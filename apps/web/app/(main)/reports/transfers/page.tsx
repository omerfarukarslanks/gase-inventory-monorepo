"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getReportTransfers,
  type TransferItem,
  type StoreFlow,
} from "@/lib/reports";
import { formatDate } from "@/lib/format";

const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

export default function TransfersPage() {
  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);
  const [limit, setLimit] = useState(50);
  const [items, setItems] = useState<TransferItem[]>([]);
  const [storeFlows, setStoreFlows] = useState<StoreFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportTransfers({ startDate, endDate, limit });
      setItems(res.data ?? []);
      setStoreFlows(res.storeFlows ?? []);
    } catch {
      setItems([]);
      setStoreFlows([]);
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, limit]);

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
        <h1 className="text-xl font-semibold text-text">Transfer Analizi</h1>
        <p className="text-sm text-muted">
          Secilen tarih araliginda magazalar arasi transfer hareketleri
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
            max={200}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) || 50)}
            className="h-10 w-20 rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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
      ) : storeFlows.length === 0 && items.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-surface p-12">
          <p className="text-sm text-muted">
            Secilen tarih araliginda transfer verisi bulunamadi.
          </p>
        </div>
      ) : (
        <>
          {/* Store Flows */}
          {storeFlows.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-text">
                Magaza Akislari
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-glow">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                        Magaza
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                        Gonderilen
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                        Alinan
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                        Net Akis
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeFlows.map((flow, idx) => (
                      <tr
                        key={flow.storeId ?? idx}
                        className="border-b border-border last:border-b-0 transition-colors hover:bg-primary/5"
                      >
                        <td className="px-4 py-3 font-medium text-text">
                          {flow.storeName ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-right text-text">
                          {flow.totalSent ?? 0}
                        </td>
                        <td className="px-4 py-3 text-right text-text">
                          {flow.totalReceived ?? 0}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-medium ${
                            (flow.netFlow ?? 0) > 0
                              ? "text-green-600 dark:text-green-400"
                              : (flow.netFlow ?? 0) < 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-text"
                          }`}
                        >
                          {(flow.netFlow ?? 0) > 0
                            ? `+${flow.netFlow}`
                            : flow.netFlow ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transfer Details */}
          {items.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-text">
                Transfer Detaylari
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-glow">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                        Tarih
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                        Gonderen
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                        Alan
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                        Miktar
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                        Kalem
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                        Durum
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                        Not
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr
                        key={item.transferId ?? idx}
                        className="border-b border-border last:border-b-0 transition-colors hover:bg-primary/5"
                      >
                        <td className="px-4 py-3 text-muted">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-text">
                          {item.fromStore?.name ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-text">
                          {item.toStore?.name ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-right text-text">
                          {item.totalQuantity ?? 0}
                        </td>
                        <td className="px-4 py-3 text-right text-text">
                          {item.lineCount ?? 0}
                        </td>
                        <td className="px-4 py-3 text-text">
                          {item.status ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {item.note ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
