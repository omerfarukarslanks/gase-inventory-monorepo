"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getReportTurnover, type TurnoverItem } from "@/lib/reports";

export default function TurnoverPage() {
  const [data, setData] = useState<TurnoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periodDaysInput, setPeriodDaysInput] = useState("30");
  const [periodDays, setPeriodDays] = useState(30);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportTurnover({ periodDays, limit: 50 });
      setData(res.data ?? []);
    } catch {
      setData([]);
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [periodDays]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleFilter = () => {
    const parsed = parseInt(periodDaysInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setPeriodDays(parsed);
    }
  };

  const classificationColor = (classification?: string): string => {
    switch (classification) {
      case "FAST":
        return "bg-green-500/10 text-green-500";
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-500";
      case "SLOW":
        return "bg-orange-500/10 text-orange-500";
      case "DEAD":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/reports" className="text-sm text-primary hover:underline">
          &larr; Raporlar
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-text">Stok Devir Hizi</h1>
        <p className="text-sm text-muted">Urun bazli devir hizi analizi</p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Donem (gun)</label>
            <input
              type="number"
              value={periodDaysInput}
              onChange={(e) => setPeriodDaysInput(e.target.value)}
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
                  <th className="pb-3 pr-4 text-right">Mevcut Stok</th>
                  <th className="pb-3 pr-4 text-right">Satilan</th>
                  <th className="pb-3 pr-4 text-right">Gunluk Ort.</th>
                  <th className="pb-3 pr-4 text-right">Devir Hizi</th>
                  <th className="pb-3 pr-4 text-right">Yeterlilik</th>
                  <th className="pb-3 pr-4">Sinif</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={`${item.productVariantId}-${i}`} className="border-b border-border/50 transition-colors hover:bg-primary/5">
                    <td className="py-3 pr-4 font-medium text-text">{item.productName ?? "-"}</td>
                    <td className="py-3 pr-4 text-text">{item.variantName ?? "-"}</td>
                    <td className="py-3 pr-4 text-muted">{item.variantCode ?? "-"}</td>
                    <td className="py-3 pr-4 text-right text-text">{item.currentStock ?? 0}</td>
                    <td className="py-3 pr-4 text-right text-text">{item.soldQuantity ?? 0}</td>
                    <td className="py-3 pr-4 text-right text-text">{(item.dailyAvgSales ?? 0).toFixed(2)}</td>
                    <td className="py-3 pr-4 text-right text-text">{(item.turnoverRate ?? 0).toFixed(2)}</td>
                    <td className="py-3 pr-4 text-right text-text">{(item.supplyDays ?? 0) + " gun"}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${classificationColor(item.classification)}`}
                      >
                        {item.classification ?? "-"}
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
