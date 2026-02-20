"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getReportLowStock, type LowStockItem } from "@/lib/reports";

export default function LowStockPage() {
  const [data, setData] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [thresholdInput, setThresholdInput] = useState("50");
  const [threshold, setThreshold] = useState(50);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportLowStock({ threshold, limit: 50 });
      setData(res.data ?? []);
    } catch {
      setData([]);
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [threshold]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleFilter = () => {
    const parsed = parseInt(thresholdInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setThreshold(parsed);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/reports" className="text-sm text-primary hover:underline">
          &larr; Raporlar
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-text">Dusuk Stok</h1>
        <p className="text-sm text-muted">Esik degerinin altindaki stoklar</p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Esik Degeri</label>
            <input
              type="number"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
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
                  <th className="pb-3 pr-4">Magaza</th>
                  <th className="pb-3 pr-4 text-right">Miktar</th>
                  <th className="pb-3 pr-4">Durum</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={`${item.productVariantId}-${item.storeId}-${i}`} className="border-b border-border/50 transition-colors hover:bg-primary/5">
                    <td className="py-3 pr-4 font-medium text-text">{item.productName ?? "-"}</td>
                    <td className="py-3 pr-4 text-text">{item.variantName ?? "-"}</td>
                    <td className="py-3 pr-4 text-muted">{item.variantCode ?? "-"}</td>
                    <td className="py-3 pr-4 text-text">{item.storeName ?? "-"}</td>
                    <td className="py-3 pr-4 text-right font-medium text-text">{item.quantity ?? 0}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          item.isActive
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {item.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
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
