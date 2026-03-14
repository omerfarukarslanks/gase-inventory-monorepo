"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getReportStorePerformance, type StorePerformanceItem } from "@/lib/reports";
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

export default function StorePerformancePage() {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [items, setItems] = useState<StorePerformanceItem[]>([]);
  const [totals, setTotals] = useState<{
    totalSales?: number;
    totalConfirmed?: number;
    totalCancelled?: number;
    totalLineTotal?: number;
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { storeIds, setStoreIds, storeOptions, activeStoreId } = useReportScopeState();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportStorePerformance({ startDate, endDate, storeIds });
      setItems(res.data ?? []);
      setTotals(res.totals ?? {});
    } catch {
      setItems([]);
      setTotals({});
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate, storeIds]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const hasCurrency = items.some((item) => Boolean(item.currency));
  const summary = useMemo(
    () => [
      { label: "Toplam Satis", value: totals.totalSales ?? 0 },
      { label: "Onayli", value: totals.totalConfirmed ?? 0 },
      { label: "Iptal", value: totals.totalCancelled ?? 0 },
      { label: "Toplam Gelir", value: formatPrice(totals.totalLineTotal) },
    ],
    [totals],
  );

  useSyncAiReportContext({
    reportType: "store-performance",
    title: "Magaza Performansi",
    description: "Secilen tarih araliginda magazalarin satis performansi",
    path: "/reports/store-performance",
    filters: { startDate, endDate, storeIds },
    scope: { route: "/reports/store-performance", storeIds, activeStoreId },
    summary,
    rowCount: items.length,
    promptPresets: [
      "Magazalari performansa gore sirala ve farklari yorumla",
      "Iptal orani yuksek magazalari tespit et",
      "Bu rapor icin kisa yonetim ozeti hazirla",
    ],
  });

  return (
    <ReportShell
      title="Magaza Performansi"
      description="Secilen tarih araliginda magazalarin satis performansi"
      filters={
        <ReportFilterPanel onApply={() => void fetchData()} loading={loading}>
          <ReportField label="Baslangic">
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={reportInputClassName} />
          </ReportField>
          <ReportField label="Bitis">
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={reportInputClassName} />
          </ReportField>
          <ReportStoreField options={storeOptions} values={storeIds} onChange={setStoreIds} />
        </ReportFilterPanel>
      }
      summary={!loading && !error && items.length > 0 ? <ReportSummaryCards items={summary} /> : null}
      onExport={() =>
        exportRowsToCsv(
          "store-performance",
          items.map((item) => ({
            magaza: item.storeName ?? "-",
            kod: item.storeCode ?? "-",
            satis: item.saleCount ?? 0,
            onayli: item.confirmedCount ?? 0,
            iptal: item.cancelledCount ?? 0,
            para_birimi: item.currency ?? "-",
            toplam_gelir: item.totalLineTotal ?? 0,
            ortalama_sepet: item.averageBasket ?? 0,
            iptal_orani: item.cancelRate ?? 0,
          })),
        )
      }
      disableExport={items.length === 0}
    >
      <ReportTableSurface
        loading={loading}
        error={error}
        isEmpty={items.length === 0}
        emptyMessage="Secilen tarih araliginda magaza performans verisi bulunamadi."
        className="rounded-2xl border border-border bg-surface p-6 shadow-glow"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Magaza</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Kod</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Satis</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Onayli</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Iptal</th>
                {hasCurrency ? <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">PB</th> : null}
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Toplam Gelir</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Ort. Sepet</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Iptal Orani</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.storeId ?? index} className="border-b border-border last:border-b-0 transition-colors hover:bg-primary/5">
                  <td className="px-4 py-3 font-medium text-text">{item.storeName ?? "-"}</td>
                  <td className="px-4 py-3 text-text">{item.storeCode ?? "-"}</td>
                  <td className="px-4 py-3 text-right text-text">{item.saleCount ?? 0}</td>
                  <td className="px-4 py-3 text-right text-text">{item.confirmedCount ?? 0}</td>
                  <td className="px-4 py-3 text-right text-text">{item.cancelledCount ?? 0}</td>
                  {hasCurrency ? <td className="px-4 py-3 text-right text-text">{item.currency ?? "-"}</td> : null}
                  <td className="px-4 py-3 text-right font-medium text-text">{formatPrice(item.totalLineTotal)}</td>
                  <td className="px-4 py-3 text-right text-text">{formatPrice(item.averageBasket)}</td>
                  <td className="px-4 py-3 text-right text-text">{item.cancelRate != null ? `${item.cancelRate.toFixed(1)}%` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportTableSurface>
    </ReportShell>
  );
}
