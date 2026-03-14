"use client";

import { useCallback, useEffect, useState } from "react";
import { getReportTurnover, type TurnoverItem } from "@/lib/reports";
import { exportRowsToCsv, reportInputClassName } from "@/lib/analytics";
import { ReportShell } from "@/components/reports/ReportShell";
import { ReportFilterPanel } from "@/components/reports/ReportFilterPanel";
import { ReportField } from "@/components/reports/ReportField";
import { ReportStoreField } from "@/components/reports/ReportStoreField";
import { ReportTableSurface } from "@/components/reports/ReportTableSurface";
import { useReportScopeState } from "@/hooks/useReportScopeState";
import { useSyncAiReportContext } from "@/hooks/useSyncAiReportContext";

export default function TurnoverPage() {
  const [data, setData] = useState<TurnoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periodDaysInput, setPeriodDaysInput] = useState("30");
  const [periodDays, setPeriodDays] = useState(30);
  const { storeIds, setStoreIds, storeOptions, activeStoreId } = useReportScopeState();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportTurnover({ periodDays, limit: 50, storeIds });
      setData(res.data ?? []);
    } catch {
      setData([]);
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [periodDays, storeIds]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleFilter = () => {
    const parsed = parseInt(periodDaysInput, 10);
    if (!Number.isNaN(parsed) && parsed > 0) setPeriodDays(parsed);
  };

  useSyncAiReportContext({
    reportType: "turnover",
    title: "Stok Devir Hizi",
    description: "Urun bazli devir hizi analizi",
    path: "/reports/turnover",
    filters: { periodDays, storeIds },
    scope: { route: "/reports/turnover", storeIds, activeStoreId },
    summary: [
      { label: "Donem", value: `${periodDays} gun` },
      { label: "Kalem", value: data.length.toLocaleString("tr-TR") },
    ],
    rowCount: data.length,
    promptPresets: [
      "Devir hizi dusuk urunleri yorumla",
      "Siniflandirmaya gore stok aksiyonlari oner",
      "Yeterlilik gun sayisina gore riskleri ozetle",
    ],
  });

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
    <ReportShell
      title="Stok Devir Hizi"
      description="Urun bazli devir hizi analizi"
      filters={
        <ReportFilterPanel onApply={handleFilter} loading={loading}>
          <ReportField label="Donem (gun)">
            <input type="number" value={periodDaysInput} onChange={(event) => setPeriodDaysInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handleFilter()} min={1} className={`${reportInputClassName} w-32`} />
          </ReportField>
          <ReportStoreField options={storeOptions} values={storeIds} onChange={setStoreIds} />
        </ReportFilterPanel>
      }
      onExport={() =>
        exportRowsToCsv(
          "turnover",
          data.map((item) => ({
            urun: item.productName ?? "-",
            varyant: item.variantName ?? "-",
            kod: item.variantCode ?? "-",
            mevcut_stok: item.currentStock ?? 0,
            satilan: item.soldQuantity ?? 0,
            gunluk_ortalama: item.dailyAvgSales ?? 0,
            devir_hizi: item.turnoverRate ?? 0,
            yeterlilik: item.supplyDays ?? 0,
            sinif: item.classification ?? "-",
          })),
        )
      }
      disableExport={data.length === 0}
    >
      <ReportTableSurface loading={loading} error={error} isEmpty={data.length === 0} emptyMessage="Gosterilecek veri bulunamadi." className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
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
              {data.map((item, index) => (
                <tr key={`${item.productVariantId}-${index}`} className="border-b border-border/50 transition-colors hover:bg-primary/5">
                  <td className="py-3 pr-4 font-medium text-text">{item.productName ?? "-"}</td>
                  <td className="py-3 pr-4 text-text">{item.variantName ?? "-"}</td>
                  <td className="py-3 pr-4 text-muted">{item.variantCode ?? "-"}</td>
                  <td className="py-3 pr-4 text-right text-text">{item.currentStock ?? 0}</td>
                  <td className="py-3 pr-4 text-right text-text">{item.soldQuantity ?? 0}</td>
                  <td className="py-3 pr-4 text-right text-text">{(item.dailyAvgSales ?? 0).toFixed(2)}</td>
                  <td className="py-3 pr-4 text-right text-text">{(item.turnoverRate ?? 0).toFixed(2)}</td>
                  <td className="py-3 pr-4 text-right text-text">{`${item.supplyDays ?? 0} gun`}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${classificationColor(item.classification)}`}>
                      {item.classification ?? "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportTableSurface>
    </ReportShell>
  );
}
