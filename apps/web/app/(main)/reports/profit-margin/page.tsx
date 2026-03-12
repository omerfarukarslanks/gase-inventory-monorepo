"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getReportProfitMargin, type ProfitMarginItem, type ProfitMarginResponse } from "@/lib/reports";
import { formatPrice } from "@/lib/format";
import { exportRowsToCsv, getDateRange, reportInputClassName } from "@/lib/analytics";
import { ReportShell } from "@/components/reports/ReportShell";
import { ReportFilterPanel } from "@/components/reports/ReportFilterPanel";
import { ReportField } from "@/components/reports/ReportField";
import { ReportStoreField } from "@/components/reports/ReportStoreField";
import { ReportSummaryCards } from "@/components/reports/ReportSummaryCards";
import { ReportTableSurface } from "@/components/reports/ReportTableSurface";
import { useReportScopeState } from "@/hooks/useReportScopeState";
import { useSyncAiReportContext } from "@/hooks/useSyncAiReportContext";

const { startDate: defaultStartDate, endDate: defaultEndDate } = getDateRange(30);

export default function ProfitMarginPage() {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [limit, setLimit] = useState(50);
  const [items, setItems] = useState<ProfitMarginItem[]>([]);
  const [totals, setTotals] = useState<ProfitMarginResponse["totals"]>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { storeIds, setStoreIds, storeOptions, activeStoreId } = useReportScopeState();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportProfitMargin({ startDate, endDate, limit, storeIds });
      setItems(res.data ?? []);
      setTotals(res.totals);
    } catch {
      setItems([]);
      setTotals(undefined);
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [endDate, limit, startDate, storeIds]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const hasCurrency = items.some((item) => Boolean(item.currency));
  const summary = useMemo(
    () => [
      { label: "Toplam Gelir", value: formatPrice(totals?.totalRevenue) },
      { label: "Toplam Maliyet", value: formatPrice(totals?.totalCost) },
      { label: "Brut Kar", value: formatPrice(totals?.grossProfit) },
      { label: "Kar Marji", value: totals?.profitMargin != null ? `${totals.profitMargin.toFixed(1)}%` : "-" },
    ],
    [totals],
  );

  useSyncAiReportContext({
    reportType: "profit-margin",
    title: "Kar Marji",
    description: "Urun bazli kar marji analizi",
    path: "/reports/profit-margin",
    filters: { startDate, endDate, limit, storeIds },
    scope: { route: "/reports/profit-margin", storeIds, activeStoreId },
    summary,
    rowCount: items.length,
    promptPresets: [
      "Marj raporunu yorumla ve dusuk marjli urunleri belirt",
      "Gelir ve maliyet farklarina gore riskleri ozetle",
      "Bu rapora gore fiyatlama aksiyonlari oner",
    ],
  });

  return (
    <ReportShell
      title="Kar Marji"
      description="Urun bazli kar marji analizi"
      filters={
        <ReportFilterPanel onApply={() => void fetchData()} loading={loading}>
          <ReportField label="Baslangic">
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={reportInputClassName} />
          </ReportField>
          <ReportField label="Bitis">
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={reportInputClassName} />
          </ReportField>
          <ReportField label="Limit">
            <input type="number" min={1} max={500} value={limit} onChange={(event) => setLimit(Number(event.target.value) || 50)} className={`${reportInputClassName} w-24`} />
          </ReportField>
          <ReportStoreField options={storeOptions} values={storeIds} onChange={setStoreIds} />
        </ReportFilterPanel>
      }
      summary={!loading && !error && items.length > 0 ? <ReportSummaryCards items={summary} /> : null}
      onExport={() =>
        exportRowsToCsv(
          "profit-margin",
          items.map((item) => ({
            urun: item.productName ?? "-",
            varyant: item.variantName ?? "-",
            kod: item.variantCode ?? "-",
            satilan: item.soldQuantity ?? 0,
            para_birimi: item.currency ?? "-",
            gelir: item.totalRevenue ?? 0,
            maliyet: item.totalCost ?? 0,
            brut_kar: item.grossProfit ?? 0,
            marj: item.profitMargin ?? 0,
          })),
        )
      }
      disableExport={items.length === 0}
    >
      <ReportTableSurface
        loading={loading}
        error={error}
        isEmpty={items.length === 0}
        emptyMessage="Secilen tarih araliginda veri bulunamadi."
        className="rounded-2xl border border-border bg-surface p-6 shadow-glow"
      >
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-6 shadow-glow">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="pb-3 pr-4">Urun</th>
                <th className="pb-3 pr-4">Varyant</th>
                <th className="pb-3 pr-4">Kod</th>
                <th className="pb-3 pr-4">Satilan</th>
                {hasCurrency ? <th className="pb-3 pr-4">PB</th> : null}
                <th className="pb-3 pr-4">Gelir</th>
                <th className="pb-3 pr-4">Maliyet</th>
                <th className="pb-3 pr-4">Brut Kar</th>
                <th className="pb-3">Marj</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item, index) => (
                <tr key={`${item.productVariantId}-${index}`} className="text-text">
                  <td className="py-3 pr-4 font-medium">{item.productName ?? "-"}</td>
                  <td className="py-3 pr-4">{item.variantName ?? "-"}</td>
                  <td className="py-3 pr-4">{item.variantCode ?? "-"}</td>
                  <td className="py-3 pr-4">{item.soldQuantity ?? 0}</td>
                  {hasCurrency ? <td className="py-3 pr-4">{item.currency ?? "-"}</td> : null}
                  <td className="py-3 pr-4">{formatPrice(item.totalRevenue)}</td>
                  <td className="py-3 pr-4">{formatPrice(item.totalCost)}</td>
                  <td className="py-3 pr-4">{formatPrice(item.grossProfit)}</td>
                  <td className="py-3">{item.profitMargin != null ? `${item.profitMargin.toFixed(1)}%` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportTableSurface>
    </ReportShell>
  );
}
