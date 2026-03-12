"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getReportDeadStock, type DeadStockItem } from "@/lib/reports";
import { formatPrice, formatDate } from "@/lib/format";
import { exportRowsToCsv, reportInputClassName } from "@/lib/analytics";
import { ReportShell } from "@/components/reports/ReportShell";
import { ReportFilterPanel } from "@/components/reports/ReportFilterPanel";
import { ReportField } from "@/components/reports/ReportField";
import { ReportStoreField } from "@/components/reports/ReportStoreField";
import { ReportSummaryCards } from "@/components/reports/ReportSummaryCards";
import { ReportTableSurface } from "@/components/reports/ReportTableSurface";
import { useReportScopeState } from "@/hooks/useReportScopeState";
import { useSyncAiReportContext } from "@/hooks/useSyncAiReportContext";

export default function DeadStockPage() {
  const [data, setData] = useState<DeadStockItem[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [totalEstimatedValue, setTotalEstimatedValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noSaleDaysInput, setNoSaleDaysInput] = useState("90");
  const [noSaleDays, setNoSaleDays] = useState(90);
  const { storeIds, setStoreIds, storeOptions, activeStoreId } = useReportScopeState();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportDeadStock({ noSaleDays, limit: 50, storeIds });
      setData(res.data ?? []);
      setItemCount(res.totals?.itemCount ?? 0);
      setTotalEstimatedValue(res.totals?.totalEstimatedValue ?? 0);
    } catch {
      setData([]);
      setItemCount(0);
      setTotalEstimatedValue(0);
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [noSaleDays, storeIds]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleFilter = () => {
    const parsed = parseInt(noSaleDaysInput, 10);
    if (!Number.isNaN(parsed) && parsed > 0) setNoSaleDays(parsed);
  };

  const hasCurrency = data.some((item) => Boolean(item.currency));
  const summary = useMemo(
    () => [
      { label: "Urun Sayisi", value: itemCount.toLocaleString("tr-TR") },
      { label: "Toplam Tahmini Deger", value: formatPrice(totalEstimatedValue) },
    ],
    [itemCount, totalEstimatedValue],
  );

  useSyncAiReportContext({
    reportType: "dead-stock",
    title: "Olu Stok",
    description: "Uzun suredir satilmayan urunler",
    path: "/reports/dead-stock",
    filters: { noSaleDays, storeIds },
    scope: { route: "/reports/dead-stock", storeIds, activeStoreId },
    summary,
    rowCount: data.length,
    promptPresets: [
      "Olu stok listesini yorumla ve en riskli kalemleri sec",
      "Deger ve no-sale gun sayisina gore aksiyon planla",
      "Bu rapora gore kampanya veya tasfiye onerileri ver",
    ],
  });

  return (
    <ReportShell
      title="Olu Stok"
      description="Uzun suredir satilmayan urunler"
      filters={
        <ReportFilterPanel onApply={handleFilter} loading={loading}>
          <ReportField label="Satilmayan Gun Sayisi">
            <input type="number" min={1} value={noSaleDaysInput} onChange={(event) => setNoSaleDaysInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handleFilter()} className={`${reportInputClassName} w-32`} />
          </ReportField>
          <ReportStoreField options={storeOptions} values={storeIds} onChange={setStoreIds} />
        </ReportFilterPanel>
      }
      summary={!loading && !error ? <ReportSummaryCards items={summary} columnsClassName="grid-cols-1 sm:grid-cols-2" /> : null}
      onExport={() =>
        exportRowsToCsv(
          "dead-stock",
          data.map((item) => ({
            urun: item.productName ?? "-",
            varyant: item.variantName ?? "-",
            kod: item.variantCode ?? "-",
            mevcut_stok: item.currentStock ?? 0,
            son_satis: item.lastSaleDate ?? "-",
            satilmayan_gun: item.noSaleDays ?? 0,
            para_birimi: item.currency ?? "-",
            tahmini_deger: item.estimatedValue ?? 0,
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
                <th className="pb-3 pr-4">Son Satis</th>
                <th className="pb-3 pr-4 text-right">Satilmayan Gun</th>
                {hasCurrency ? <th className="pb-3 pr-4 text-right">PB</th> : null}
                <th className="pb-3 pr-4 text-right">Tahmini Deger</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={`${item.productVariantId}-${index}`} className="border-b border-border/50 transition-colors hover:bg-primary/5">
                  <td className="py-3 pr-4 font-medium text-text">{item.productName ?? "-"}</td>
                  <td className="py-3 pr-4 text-text">{item.variantName ?? "-"}</td>
                  <td className="py-3 pr-4 text-muted">{item.variantCode ?? "-"}</td>
                  <td className="py-3 pr-4 text-right text-text">{item.currentStock ?? 0}</td>
                  <td className="py-3 pr-4 text-muted">{formatDate(item.lastSaleDate)}</td>
                  <td className="py-3 pr-4 text-right text-text">{item.noSaleDays ?? 0}</td>
                  {hasCurrency ? <td className="py-3 pr-4 text-right text-text">{item.currency ?? "-"}</td> : null}
                  <td className="py-3 pr-4 text-right font-medium text-text">{formatPrice(item.estimatedValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportTableSurface>
    </ReportShell>
  );
}
