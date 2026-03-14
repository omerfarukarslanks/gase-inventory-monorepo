"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getReportLowStock, type LowStockItem } from "@/lib/reports";
import { exportRowsToCsv, reportInputClassName } from "@/lib/analytics";
import { ReportShell } from "@/components/reports/ReportShell";
import { ReportFilterPanel } from "@/components/reports/ReportFilterPanel";
import { ReportField } from "@/components/reports/ReportField";
import { ReportStoreField } from "@/components/reports/ReportStoreField";
import { ReportSummaryCards } from "@/components/reports/ReportSummaryCards";
import { ReportTableSurface } from "@/components/reports/ReportTableSurface";
import { useReportScopeState } from "@/hooks/useReportScopeState";
import { useSyncAiReportContext } from "@/hooks/useSyncAiReportContext";
import Button from "@/components/ui/Button";

export default function LowStockPage() {
  const router = useRouter();
  const [data, setData] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [thresholdInput, setThresholdInput] = useState("50");
  const [threshold, setThreshold] = useState(50);
  const { storeIds, setStoreIds, storeOptions, activeStoreId } = useReportScopeState();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportLowStock({ threshold, limit: 50, storeIds });
      setData(res.data ?? []);
    } catch {
      setData([]);
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [storeIds, threshold]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleFilter = () => {
    const parsed = parseInt(thresholdInput, 10);
    if (!Number.isNaN(parsed) && parsed > 0) setThreshold(parsed);
  };

  const summary = useMemo(
    () => [
      { label: "Esik Degeri", value: threshold.toLocaleString("tr-TR") },
      { label: "Kritik SKU", value: data.length.toLocaleString("tr-TR") },
      { label: "En dusuk miktar", value: data.length ? Math.min(...data.map((item) => item.quantity ?? 0)).toLocaleString("tr-TR") : "-" },
    ],
    [data, threshold],
  );

  useSyncAiReportContext({
    reportType: "low-stock",
    title: "Dusuk Stok",
    description: "Esik degerinin altindaki stoklar",
    path: "/reports/low-stock",
    filters: { threshold, storeIds },
    scope: { route: "/reports/low-stock", storeIds, activeStoreId },
    summary,
    rowCount: data.length,
    promptPresets: [
      "Dusuk stok listesini oncelik sirasina gore yorumla",
      "Bu rapordan ikmal icin ilk 5 urunu sec",
      "Magaza ve varyant bazinda risk ozetini cikar",
    ],
  });

  return (
    <ReportShell
      title="Dusuk Stok"
      description="Esik degerinin altindaki stoklar"
      extraActions={
        <Button
          label="Tedarikte Ac"
          onClick={() => router.push("/supply/suggestions")}
          variant="secondary"
          className="px-3 py-2"
        />
      }
      filters={
        <ReportFilterPanel onApply={handleFilter} loading={loading}>
          <ReportField label="Esik Degeri">
            <input
              type="number"
              min={1}
              value={thresholdInput}
              onChange={(event) => setThresholdInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleFilter()}
              className={`${reportInputClassName} w-32`}
            />
          </ReportField>
          <ReportStoreField options={storeOptions} values={storeIds} onChange={setStoreIds} />
        </ReportFilterPanel>
      }
      summary={!loading && !error && data.length > 0 ? <ReportSummaryCards items={summary} columnsClassName="grid-cols-1 sm:grid-cols-3" /> : null}
      onExport={() =>
        exportRowsToCsv(
          "low-stock",
          data.map((item) => ({
            urun: item.productName ?? "-",
            varyant: item.variantName ?? "-",
            kod: item.variantCode ?? "-",
            magaza: item.storeName ?? "-",
            miktar: item.quantity ?? 0,
            durum: item.isActive ? "Aktif" : "Pasif",
          })),
        )
      }
      disableExport={data.length === 0}
    >
      <ReportTableSurface
        loading={loading}
        error={error}
        isEmpty={data.length === 0}
        emptyMessage="Gosterilecek veri bulunamadi."
        className="rounded-2xl border border-border bg-surface p-6 shadow-glow"
      >
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
              {data.map((item, index) => (
                <tr key={`${item.productVariantId}-${item.storeId}-${index}`} className="border-b border-border/50 transition-colors hover:bg-primary/5">
                  <td className="py-3 pr-4 font-medium text-text">{item.productName ?? "-"}</td>
                  <td className="py-3 pr-4 text-text">{item.variantName ?? "-"}</td>
                  <td className="py-3 pr-4 text-muted">{item.variantCode ?? "-"}</td>
                  <td className="py-3 pr-4 text-text">{item.storeName ?? "-"}</td>
                  <td className="py-3 pr-4 text-right font-medium text-text">{item.quantity ?? 0}</td>
                  <td className="py-3 pr-4">
                    <span className={item.isActive ? "inline-block rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-500" : "inline-block rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-500"}>
                      {item.isActive ? "Aktif" : "Pasif"}
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
