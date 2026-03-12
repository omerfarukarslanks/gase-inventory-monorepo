"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getReportSalesSummary, type SalesSummaryResponse } from "@/lib/reports";
import { formatPrice } from "@/lib/format";
import { getDateRange, exportRowsToCsv, reportInputClassName } from "@/lib/analytics";
import { ReportShell } from "@/components/reports/ReportShell";
import { ReportFilterPanel } from "@/components/reports/ReportFilterPanel";
import { ReportField } from "@/components/reports/ReportField";
import { ReportStoreField } from "@/components/reports/ReportStoreField";
import { ReportSummaryCards } from "@/components/reports/ReportSummaryCards";
import { ReportTableSurface } from "@/components/reports/ReportTableSurface";
import { useReportScopeState } from "@/hooks/useReportScopeState";
import { useSyncAiReportContext } from "@/hooks/useSyncAiReportContext";

const { startDate: defaultStartDate, endDate: defaultEndDate } = getDateRange(30);

export default function SalesSummaryPage() {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [data, setData] = useState<SalesSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { storeIds, setStoreIds, storeOptions, activeStoreId } = useReportScopeState();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportSalesSummary({ startDate, endDate, storeIds });
      setData(res);
    } catch {
      setData(null);
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate, storeIds]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const totals = data?.totals;
  const cards = useMemo(
    () => [
      { label: "Satis Adedi", value: String(totals?.saleCount ?? 0) },
      { label: "Onaylanan", value: String(totals?.confirmedCount ?? 0) },
      { label: "Iptal Edilen", value: String(totals?.cancelledCount ?? 0) },
      { label: "Toplam Birim Fiyat", value: formatPrice(totals?.totalUnitPrice) },
      { label: "Toplam Ciro", value: formatPrice(totals?.totalLineTotal) },
      { label: "Ortalama Sepet", value: formatPrice(totals?.averageBasket) },
      { label: "Iptal Orani", value: totals?.cancelRate != null ? `%${(totals.cancelRate * 100).toFixed(1)}` : "-" },
    ],
    [totals],
  );

  useSyncAiReportContext({
    reportType: "sales-summary",
    title: "Satis Ozeti",
    description: "Secilen tarih araligindaki genel satis istatistikleri",
    path: "/reports/sales-summary",
    filters: { startDate, endDate, storeIds },
    scope: { route: "/reports/sales-summary", storeIds, activeStoreId },
    summary: cards,
    rowCount: cards.length,
    promptPresets: [
      "Satis ozetini yorumla ve en kritik metriyi belirt",
      "Iptal orani ve ortalama sepet uzerinden kisa analiz yap",
      "Bu ozet icin yonetici aksiyon listesi cikar",
    ],
  });

  return (
    <ReportShell
      title="Satis Ozeti"
      description="Secilen tarih araligindaki genel satis istatistikleri"
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
      summary={!loading && !error && totals ? <ReportSummaryCards items={cards} columnsClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" /> : null}
      onExport={() => exportRowsToCsv("sales-summary", cards.map((card) => ({ metric: card.label, value: card.value })))}
      disableExport={!totals}
    >
      <ReportTableSurface
        loading={loading}
        error={error}
        isEmpty={!totals}
        emptyMessage="Secilen tarih araliginda veri bulunamadi."
        className="rounded-2xl border border-border bg-surface p-6 shadow-glow"
      >
        <div className="space-y-3">
          <div className="text-sm font-semibold text-text">Rapor ozeti</div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <div key={card.label} className="rounded-xl2 border border-border bg-surface2/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{card.label}</p>
                <p className="mt-2 text-xl font-bold text-text">{card.value}</p>
              </div>
            ))}
          </div>
        </div>
      </ReportTableSurface>
    </ReportShell>
  );
}
