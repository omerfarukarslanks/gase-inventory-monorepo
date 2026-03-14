"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getReportEmployeePerformance, type EmployeePerformanceItem } from "@/lib/reports";
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

export default function EmployeePerformancePage() {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [limit, setLimit] = useState(50);
  const [items, setItems] = useState<EmployeePerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { storeIds, setStoreIds, storeOptions, activeStoreId } = useReportScopeState();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportEmployeePerformance({ startDate, endDate, limit, storeIds });
      setItems(res.data ?? []);
    } catch {
      setItems([]);
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
      { label: "Calisan", value: items.length.toLocaleString("tr-TR") },
      { label: "Toplam Gelir", value: formatPrice(items.reduce((sum, item) => sum + (item.totalRevenue ?? 0), 0)) },
      { label: "Toplam Satis", value: items.reduce((sum, item) => sum + (item.saleCount ?? 0), 0).toLocaleString("tr-TR") },
    ],
    [items],
  );

  useSyncAiReportContext({
    reportType: "employee-performance",
    title: "Calisan Performansi",
    description: "Secilen tarih araliginda calisan satis performansi",
    path: "/reports/employee-performance",
    filters: { startDate, endDate, limit, storeIds },
    scope: { route: "/reports/employee-performance", storeIds, activeStoreId },
    summary,
    rowCount: items.length,
    promptPresets: [
      "Calisan performansini yorumla ve fark yaratanlari belirt",
      "Iptal orani yuksek kullanicilari tespit et",
      "Ekibe yonelik gelisim aksiyonlari oner",
    ],
  });

  return (
    <ReportShell
      title="Calisan Performansi"
      description="Secilen tarih araliginda calisan satis performansi"
      filters={
        <ReportFilterPanel onApply={() => void fetchData()} loading={loading}>
          <ReportField label="Baslangic">
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={reportInputClassName} />
          </ReportField>
          <ReportField label="Bitis">
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={reportInputClassName} />
          </ReportField>
          <ReportField label="Limit">
            <input
              type="number"
              min={1}
              max={200}
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value) || 50)}
              className={`${reportInputClassName} w-24`}
            />
          </ReportField>
          <ReportStoreField options={storeOptions} values={storeIds} onChange={setStoreIds} />
        </ReportFilterPanel>
      }
      summary={!loading && !error && items.length > 0 ? <ReportSummaryCards items={summary} columnsClassName="grid-cols-1 sm:grid-cols-3" /> : null}
      onExport={() =>
        exportRowsToCsv(
          "employee-performance",
          items.map((item, index) => ({
            sira: item.rank ?? index + 1,
            ad_soyad: [item.userName, item.userSurname].filter(Boolean).join(" ") || "-",
            email: item.userEmail ?? "-",
            satis: item.saleCount ?? 0,
            onayli: item.confirmedCount ?? 0,
            iptal: item.cancelledCount ?? 0,
            iptal_orani: item.cancelRate ?? 0,
            para_birimi: item.currency ?? "-",
            toplam_gelir: item.totalRevenue ?? 0,
            ortalama_sepet: item.averageBasket ?? 0,
          })),
        )
      }
      disableExport={items.length === 0}
    >
      <ReportTableSurface
        loading={loading}
        error={error}
        isEmpty={items.length === 0}
        emptyMessage="Secilen tarih araliginda calisan performans verisi bulunamadi."
        className="rounded-2xl border border-border bg-surface p-6 shadow-glow"
      >
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-glow">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Sira</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Ad Soyad</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Email</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Satis</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Onayli</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Iptal</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Iptal Orani</th>
                {hasCurrency ? <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">PB</th> : null}
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Toplam Gelir</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Ort. Sepet</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.userId ?? index} className="border-b border-border last:border-b-0 transition-colors hover:bg-primary/5">
                  <td className="px-4 py-3 font-medium text-text">{item.rank ?? index + 1}</td>
                  <td className="px-4 py-3 text-text">{[item.userName, item.userSurname].filter(Boolean).join(" ") || "-"}</td>
                  <td className="px-4 py-3 text-muted">{item.userEmail ?? "-"}</td>
                  <td className="px-4 py-3 text-right text-text">{item.saleCount ?? 0}</td>
                  <td className="px-4 py-3 text-right text-text">{item.confirmedCount ?? 0}</td>
                  <td className="px-4 py-3 text-right text-text">{item.cancelledCount ?? 0}</td>
                  <td className="px-4 py-3 text-right text-text">{item.cancelRate != null ? `${item.cancelRate.toFixed(1)}%` : "-"}</td>
                  {hasCurrency ? <td className="px-4 py-3 text-right text-text">{item.currency ?? "-"}</td> : null}
                  <td className="px-4 py-3 text-right font-medium text-text">{formatPrice(item.totalRevenue)}</td>
                  <td className="px-4 py-3 text-right text-text">{formatPrice(item.averageBasket)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportTableSurface>
    </ReportShell>
  );
}
