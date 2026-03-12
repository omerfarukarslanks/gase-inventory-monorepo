"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getReportDiscountSummary, type DiscountByCampaign, type DiscountByStore } from "@/lib/reports";
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

export default function DiscountSummaryPage() {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [totalDiscount, setTotalDiscount] = useState<number | undefined>(undefined);
  const [byCampaign, setByCampaign] = useState<DiscountByCampaign[]>([]);
  const [byStore, setByStore] = useState<DiscountByStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { storeIds, setStoreIds, storeOptions, activeStoreId } = useReportScopeState();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportDiscountSummary({ startDate, endDate, storeIds });
      setTotalDiscount(res.totalDiscount);
      setByCampaign(res.byCampaign ?? []);
      setByStore(res.byStore ?? []);
    } catch {
      setTotalDiscount(undefined);
      setByCampaign([]);
      setByStore([]);
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate, storeIds]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const hasData = byCampaign.length > 0 || byStore.length > 0;
  const campaignHasCurrency = byCampaign.some((item) => Boolean(item.currency));
  const storeHasCurrency = byStore.some((item) => Boolean(item.currency));
  const summary = useMemo(
    () => [
      { label: "Toplam Indirim", value: formatPrice(totalDiscount) },
      { label: "Kampanya", value: byCampaign.length.toLocaleString("tr-TR") },
      { label: "Magaza", value: byStore.length.toLocaleString("tr-TR") },
    ],
    [byCampaign.length, byStore.length, totalDiscount],
  );

  useSyncAiReportContext({
    reportType: "discount-summary",
    title: "Indirim Ozeti",
    description: "Kampanya ve magaza bazli indirim analizi",
    path: "/reports/discount-summary",
    filters: { startDate, endDate, storeIds },
    scope: { route: "/reports/discount-summary", storeIds, activeStoreId },
    summary,
    rowCount: byCampaign.length + byStore.length,
    promptPresets: [
      "Indirim dagilimini kampanya ve magaza bazinda yorumla",
      "Fazla indirim yuklenen alanlari tespit et",
      "Karlilik acisindan dikkat edilmesi gereken noktalar neler",
    ],
  });

  return (
    <ReportShell
      title="Indirim Ozeti"
      description="Kampanya ve magaza bazli indirim analizi"
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
      summary={!loading && !error && hasData ? <ReportSummaryCards items={summary} columnsClassName="grid-cols-1 sm:grid-cols-3" /> : null}
      onExport={() =>
        exportRowsToCsv(
          "discount-summary",
          [
            ...byCampaign.map((item) => ({
              tip: "kampanya",
              anahtar: item.campaignCode ?? "Kampanyasiz",
              para_birimi: item.currency ?? "-",
              toplam_indirim: item.totalDiscount ?? 0,
              satis_adedi: item.saleCount ?? 0,
            })),
            ...byStore.map((item) => ({
              tip: "magaza",
              anahtar: item.storeName ?? "-",
              para_birimi: item.currency ?? "-",
              toplam_indirim: item.totalDiscount ?? 0,
              satis_adedi: item.saleCount ?? 0,
            })),
          ],
        )
      }
      disableExport={!hasData}
    >
      <ReportTableSurface loading={loading} error={error} isEmpty={!hasData} emptyMessage="Secilen tarih araliginda veri bulunamadi." className="space-y-4">
        <>
          {byCampaign.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-6 shadow-glow">
              <h2 className="mb-4 text-base font-semibold text-text">Kampanya Bazli</h2>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
                    <th className="pb-3 pr-4">Kampanya Kodu</th>
                    {campaignHasCurrency ? <th className="pb-3 pr-4">PB</th> : null}
                    <th className="pb-3 pr-4">Toplam Indirim</th>
                    <th className="pb-3">Satis Adedi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {byCampaign.map((item, index) => (
                    <tr key={`campaign-${index}`} className="text-text">
                      <td className="py-3 pr-4 font-medium">{item.campaignCode ?? "Kampanyasiz"}</td>
                      {campaignHasCurrency ? <td className="py-3 pr-4">{item.currency ?? "-"}</td> : null}
                      <td className="py-3 pr-4">{formatPrice(item.totalDiscount)}</td>
                      <td className="py-3">{item.saleCount ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {byStore.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-6 shadow-glow">
              <h2 className="mb-4 text-base font-semibold text-text">Magaza Bazli</h2>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
                    <th className="pb-3 pr-4">Magaza</th>
                    {storeHasCurrency ? <th className="pb-3 pr-4">PB</th> : null}
                    <th className="pb-3 pr-4">Toplam Indirim</th>
                    <th className="pb-3">Satis Adedi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {byStore.map((item, index) => (
                    <tr key={`store-${index}`} className="text-text">
                      <td className="py-3 pr-4 font-medium">{item.storeName ?? "-"}</td>
                      {storeHasCurrency ? <td className="py-3 pr-4">{item.currency ?? "-"}</td> : null}
                      <td className="py-3 pr-4">{formatPrice(item.totalDiscount)}</td>
                      <td className="py-3">{item.saleCount ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      </ReportTableSurface>
    </ReportShell>
  );
}
