"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getReportDeadStock, type DeadStockItem } from "@/lib/reports";
import { formatPrice, formatDate } from "@/lib/format";

export default function DeadStockPage() {
  const [data, setData] = useState<DeadStockItem[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [totalEstimatedValue, setTotalEstimatedValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noSaleDaysInput, setNoSaleDaysInput] = useState("90");
  const [noSaleDays, setNoSaleDays] = useState(90);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportDeadStock({ noSaleDays, limit: 50 });
      setData(res.data ?? []);
      setItemCount(res.totals?.itemCount ?? 0);
      setTotalEstimatedValue(res.totals?.totalEstimatedValue ?? 0);
    } catch {
      setData([]);
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [noSaleDays]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const hasCurrency = data.some((item) => Boolean(item.currency));

  const handleFilter = () => {
    const parsed = parseInt(noSaleDaysInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setNoSaleDays(parsed);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/reports" className="text-sm text-primary hover:underline">
          &larr; Raporlar
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-text">Olu Stok</h1>
        <p className="text-sm text-muted">Uzun suredir satilmayan urunler</p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Satilmayan Gun Sayisi</label>
            <input
              type="number"
              value={noSaleDaysInput}
              onChange={(e) => setNoSaleDaysInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              min={1}
              className="h-10 w-32 rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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

      {/* Totals */}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
            <p className="text-sm text-muted">Urun Sayisi</p>
            <p className="text-2xl font-bold text-text">{itemCount.toLocaleString("tr-TR")}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
            <p className="text-sm text-muted">Toplam Tahmini Deger</p>
            <p className="text-2xl font-bold text-text">{formatPrice(totalEstimatedValue)}</p>
          </div>
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
                  <th className="pb-3 pr-4">Urun</th>
                  <th className="pb-3 pr-4">Varyant</th>
                  <th className="pb-3 pr-4">Kod</th>
                  <th className="pb-3 pr-4 text-right">Mevcut Stok</th>
                  <th className="pb-3 pr-4">Son Satis</th>
                  <th className="pb-3 pr-4 text-right">Satilmayan Gun</th>
                  {hasCurrency && <th className="pb-3 pr-4 text-right">PB</th>}
                  <th className="pb-3 pr-4 text-right">Tahmini Deger</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={`${item.productVariantId}-${i}`} className="border-b border-border/50 transition-colors hover:bg-primary/5">
                    <td className="py-3 pr-4 font-medium text-text">{item.productName ?? "-"}</td>
                    <td className="py-3 pr-4 text-text">{item.variantName ?? "-"}</td>
                    <td className="py-3 pr-4 text-muted">{item.variantCode ?? "-"}</td>
                    <td className="py-3 pr-4 text-right text-text">{item.currentStock ?? 0}</td>
                    <td className="py-3 pr-4 text-muted">{formatDate(item.lastSaleDate)}</td>
                    <td className="py-3 pr-4 text-right text-text">{item.noSaleDays ?? 0}</td>
                    {hasCurrency && <td className="py-3 pr-4 text-right text-text">{item.currency ?? "-"}</td>}
                    <td className="py-3 pr-4 text-right font-medium text-text">{formatPrice(item.estimatedValue)}</td>
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
