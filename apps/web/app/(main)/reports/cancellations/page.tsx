"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getReportCancellations, type CancellationItem } from "@/lib/reports";
import { formatPrice, formatDate } from "@/lib/format";
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

export default function CancellationsPage() {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [items, setItems] = useState<CancellationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { storeIds, setStoreIds, storeOptions, activeStoreId } = useReportScopeState();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportCancellations({ startDate, endDate, limit: 50, storeIds });
      setItems(res.data ?? []);
    } catch {
      setItems([]);
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
      { label: "Iptal Fis", value: items.length.toLocaleString("tr-TR") },
      {
        label: "Toplam Kayip",
        value: formatPrice(items.reduce((sum, item) => sum + (item.lineTotal ?? item.unitPrice ?? 0), 0)),
      },
    ],
    [items],
  );

  useSyncAiReportContext({
    reportType: "cancellations",
    title: "Iptal Raporlari",
    description: "Secilen tarih araligindaki iptal edilen satis fisleri",
    path: "/reports/cancellations",
    filters: { startDate, endDate, storeIds },
    scope: { route: "/reports/cancellations", storeIds, activeStoreId },
    summary,
    rowCount: items.length,
    promptPresets: [
      "Iptal raporunu yorumla ve anomali var mi soyle",
      "Magaza ve musteri dagilimina gore iptal risklerini ozetle",
      "Iptal tutari yuksek islemler icin aksiyon oner",
    ],
  });

  return (
    <ReportShell
      title="Iptal Raporlari"
      description="Secilen tarih araligindaki iptal edilen satis fisleri"
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
      summary={!loading && !error && items.length > 0 ? <ReportSummaryCards items={summary} columnsClassName="grid-cols-1 sm:grid-cols-2" /> : null}
      onExport={() =>
        exportRowsToCsv(
          "cancellations",
          items.map((item) => ({
            fis_no: item.receiptNo ?? item.id ?? "-",
            musteri: [item.name, item.surname].filter(Boolean).join(" ") || "-",
            magaza: item.store?.name ?? "-",
            para_birimi: item.currency ?? "-",
            tutar: item.lineTotal ?? item.unitPrice ?? 0,
            tarih: item.cancelledAt ?? item.createdAt ?? "-",
          })),
        )
      }
      disableExport={items.length === 0}
    >
      <ReportTableSurface
        loading={loading}
        error={error}
        isEmpty={items.length === 0}
        emptyMessage="Secilen tarih araliginda iptal kaydi bulunamadi."
        className="rounded-2xl border border-border bg-surface p-6 shadow-glow"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Fis No</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Musteri</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Magaza</th>
                {hasCurrency ? <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">PB</th> : null}
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Tutar</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id ?? index} className="border-b border-border last:border-b-0 transition-colors hover:bg-primary/5">
                  <td className="px-4 py-3 font-medium text-text">{item.receiptNo ?? "-"}</td>
                  <td className="px-4 py-3 text-text">{[item.name, item.surname].filter(Boolean).join(" ") || "-"}</td>
                  <td className="px-4 py-3 text-text">{item.store?.name ?? "-"}</td>
                  {hasCurrency ? <td className="px-4 py-3 text-right text-text">{item.currency ?? "-"}</td> : null}
                  <td className="px-4 py-3 text-right font-medium text-text">{formatPrice(item.lineTotal)}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(item.cancelledAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportTableSurface>
    </ReportShell>
  );
}
