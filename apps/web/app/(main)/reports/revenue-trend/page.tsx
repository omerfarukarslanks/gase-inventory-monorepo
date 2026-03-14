"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { RevenueTrendChart } from "@/components/dashboard/Chart";
import { getReportRevenueTrend, type RevenueTrendItem } from "@/lib/reports";
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

export default function RevenueTrendPage() {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [items, setItems] = useState<RevenueTrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { storeIds, setStoreIds, storeOptions, activeStoreId } = useReportScopeState();

  const groupByOptions = [
    { value: "day", label: "Gun" },
    { value: "week", label: "Hafta" },
    { value: "month", label: "Ay" },
  ] as const;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportRevenueTrend({ startDate, endDate, groupBy, storeIds });
      setItems(res.data ?? []);
    } catch {
      setItems([]);
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [endDate, groupBy, startDate, storeIds]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const hasCurrency = items.some((item) => Boolean(item.currency));
  const summary = useMemo(
    () => [
      { label: "Donem Sayisi", value: items.length.toLocaleString("tr-TR") },
      {
        label: "Toplam Gelir",
        value: formatPrice(items.reduce((sum, item) => sum + (item.totalRevenue ?? 0), 0)),
      },
      {
        label: "Toplam Satis",
        value: items.reduce((sum, item) => sum + (item.saleCount ?? 0), 0).toLocaleString("tr-TR"),
      },
    ],
    [items],
  );

  useSyncAiReportContext({
    reportType: "revenue-trend",
    title: "Gelir Trendi",
    description: "Secilen tarih araliginda donem bazli gelir degisimi",
    path: "/reports/revenue-trend",
    filters: { startDate, endDate, groupBy, storeIds },
    scope: { route: "/reports/revenue-trend", storeIds, activeStoreId },
    summary,
    rowCount: items.length,
    promptPresets: [
      "Gelir trendini ve degisim yuzdelerini yorumla",
      "Hangi donemlerde ivme kaybi var, ozetle",
      "Bu trend icin yoneticiye kisa aksiyon plani cikar",
    ],
  });

  return (
    <ReportShell
      title="Gelir Trendi"
      description="Secilen tarih araliginda donem bazli gelir degisimi"
      filters={
        <ReportFilterPanel onApply={() => void fetchData()} loading={loading}>
          <ReportField label="Baslangic">
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={reportInputClassName} />
          </ReportField>
          <ReportField label="Bitis">
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={reportInputClassName} />
          </ReportField>
          <ReportField label="Gruplama">
            <SearchableDropdown
              options={[...groupByOptions]}
              value={groupBy}
              onChange={(value) => setGroupBy(value as "day" | "week" | "month")}
              placeholder="Gruplama"
              showEmptyOption={false}
              allowClear={false}
              showSearchInput={false}
              inputAriaLabel="Gelir trendi gruplama"
              toggleAriaLabel="Gelir trendi gruplama listesini ac"
              className="w-[130px]"
            />
          </ReportField>
          <ReportStoreField options={storeOptions} values={storeIds} onChange={setStoreIds} />
        </ReportFilterPanel>
      }
      summary={!loading && !error && items.length > 0 ? <ReportSummaryCards items={summary} columnsClassName="grid-cols-1 sm:grid-cols-3" /> : null}
      onExport={() =>
        exportRowsToCsv(
          "revenue-trend",
          items.map((item) => ({
            donem: item.period ?? "-",
            satis_adedi: item.saleCount ?? 0,
            para_birimi: item.currency ?? "-",
            toplam_gelir: item.totalRevenue ?? 0,
            ortalama_sepet: item.averageBasket ?? 0,
            degisim: item.changePercent ?? 0,
            trend: item.trend ?? "-",
          })),
        )
      }
      disableExport={items.length === 0}
    >
      {!loading && !error && items.length > 0 ? (
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
          <div className="mb-4 text-sm font-semibold text-text">Grafik gorunumu</div>
          <RevenueTrendChart data={items} />
        </section>
      ) : null}

      <ReportTableSurface
        loading={loading}
        error={error}
        isEmpty={items.length === 0}
        emptyMessage="Secilen tarih araliginda veri bulunamadi."
        className="rounded-2xl border border-border bg-surface p-6 shadow-glow"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="pb-3 pr-4">Donem</th>
                <th className="pb-3 pr-4">Satis Adedi</th>
                {hasCurrency ? <th className="pb-3 pr-4">PB</th> : null}
                <th className="pb-3 pr-4">Toplam Gelir</th>
                <th className="pb-3 pr-4">Ort. Sepet</th>
                <th className="pb-3 pr-4">Degisim</th>
                <th className="pb-3">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item, index) => (
                <tr key={`${item.period}-${index}`} className="text-text">
                  <td className="py-3 pr-4 font-medium">{item.period ?? "-"}</td>
                  <td className="py-3 pr-4">{item.saleCount ?? 0}</td>
                  {hasCurrency ? <td className="py-3 pr-4">{item.currency ?? "-"}</td> : null}
                  <td className="py-3 pr-4">{formatPrice(item.totalRevenue)}</td>
                  <td className="py-3 pr-4">{formatPrice(item.averageBasket)}</td>
                  <td className="py-3 pr-4">{item.changePercent != null ? `${item.changePercent.toFixed(1)}%` : "-"}</td>
                  <td className="py-3">{item.trend ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportTableSurface>
    </ReportShell>
  );
}
