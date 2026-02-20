"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getReportMovements,
  type MovementItem,
  type MovementSummaryByType,
} from "@/lib/reports";
import { formatPrice, formatDate } from "@/lib/format";

export default function InventoryMovementsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [data, setData] = useState<MovementItem[]>([]);
  const [summaryByType, setSummaryByType] = useState<MovementSummaryByType[]>([]);
  const [totals, setTotals] = useState<{ movementCount?: number; netQuantity?: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startDateInput, setStartDateInput] = useState(monthAgo);
  const [endDateInput, setEndDateInput] = useState(today);
  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportMovements({ startDate, endDate, limit: 50 });
      setData(res.data ?? []);
      setSummaryByType(res.summaryByType ?? []);
      setTotals(res.totals ?? {});
    } catch {
      setData([]);
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleFilter = () => {
    setStartDate(startDateInput);
    setEndDate(endDateInput);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/reports" className="text-sm text-primary hover:underline">
          &larr; Raporlar
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-text">Stok Hareketleri</h1>
        <p className="text-sm text-muted">Giris/cikis hareket ozeti</p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Baslangic Tarihi</label>
            <input
              type="date"
              value={startDateInput}
              onChange={(e) => setStartDateInput(e.target.value)}
              className="h-10 rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Bitis Tarihi</label>
            <input
              type="date"
              value={endDateInput}
              onChange={(e) => setEndDateInput(e.target.value)}
              className="h-10 rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleFilter}
            className="h-10 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Filtrele
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {!loading && !error && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
              <p className="text-sm text-muted">Toplam Hareket</p>
              <p className="text-2xl font-bold text-text">{(totals.movementCount ?? 0).toLocaleString("tr-TR")}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
              <p className="text-sm text-muted">Net Miktar</p>
              <p className="text-2xl font-bold text-text">{(totals.netQuantity ?? 0).toLocaleString("tr-TR")}</p>
            </div>
          </div>
          {summaryByType.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {summaryByType.map((s) => (
                <div key={s.type} className="rounded-2xl border border-border bg-surface p-4 shadow-glow">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{s.type ?? "-"}</p>
                  <p className="mt-1 text-lg font-bold text-text">{(s.movementCount ?? 0).toLocaleString("tr-TR")} hareket</p>
                  <p className="text-sm text-muted">Toplam: {(s.totalQuantity ?? 0).toLocaleString("tr-TR")} adet</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <p className="py-8 text-center text-sm text-red-500">{error}</p>
        ) : data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">Gosterilecek veri bulunamadi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th className="pb-3 pr-4">Tarih</th>
                  <th className="pb-3 pr-4">Tip</th>
                  <th className="pb-3 pr-4">Urun</th>
                  <th className="pb-3 pr-4">Varyant</th>
                  <th className="pb-3 pr-4">Magaza</th>
                  <th className="pb-3 pr-4 text-right">Miktar</th>
                  <th className="pb-3 pr-4 text-right">Birim Fiyat</th>
                  <th className="pb-3 pr-4 text-right">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={item.id ?? i} className="border-b border-border/50 transition-colors hover:bg-primary/5">
                    <td className="py-3 pr-4 text-muted">{formatDate(item.createdAt)}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {item.type ?? "-"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-medium text-text">{item.product?.name ?? "-"}</td>
                    <td className="py-3 pr-4 text-text">{item.productVariant?.name ?? "-"}</td>
                    <td className="py-3 pr-4 text-text">{item.store?.name ?? "-"}</td>
                    <td className="py-3 pr-4 text-right text-text">{item.quantity ?? 0}</td>
                    <td className="py-3 pr-4 text-right text-text">{formatPrice(item.unitPrice)}</td>
                    <td className="py-3 pr-4 text-right font-medium text-text">{formatPrice(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
