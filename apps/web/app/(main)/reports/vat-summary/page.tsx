"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getReportVatSummary, type VatSummaryItem, type VatSummaryResponse } from "@/lib/reports";
import { formatPrice } from "@/lib/format";
import { exportRowsToCsv, reportInputClassName } from "@/lib/analytics";
import { ReportShell } from "@/components/reports/ReportShell";
import { ReportFilterPanel } from "@/components/reports/ReportFilterPanel";
import { ReportField } from "@/components/reports/ReportField";
import { ReportStoreField } from "@/components/reports/ReportStoreField";
import { ReportSummaryCards } from "@/components/reports/ReportSummaryCards";
import { ReportTableSurface } from "@/components/reports/ReportTableSurface";
import { useReportScopeState } from "@/hooks/useReportScopeState";
import { useSyncAiReportContext } from "@/hooks/useSyncAiReportContext";

const currentMonth = new Date().toISOString().slice(0, 7);

export default function VatSummaryPage() {
  const [month, setMonth] = useState(currentMonth);
  const [items, setItems] = useState<VatSummaryItem[]>([]);
  const [totals, setTotals] = useState<VatSummaryResponse["totals"]>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { storeIds, setStoreIds, storeOptions, activeStoreId } = useReportScopeState();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportVatSummary({ month, storeIds });
      setItems(res.data ?? []);
      setTotals(res.totals);
    } catch {
      setItems([]);
      setTotals(undefined);
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [month, storeIds]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const hasCurrency = items.some((item) => Boolean(item.currency));
  const summary = useMemo(
    () => [
      { label: "Net Satis", value: formatPrice(totals?.netSales) },
      { label: "KDV Tutari", value: formatPrice(totals?.taxAmount) },
      { label: "Brut Toplam", value: formatPrice(totals?.grossTotal) },
    ],
    [totals],
  );

  useSyncAiReportContext({
    reportType: "vat-summary",
    title: "KDV Ozeti",
    description: "Aylik KDV orani bazli vergi ozeti",
    path: "/reports/vat-summary",
    filters: { month, storeIds },
    scope: { route: "/reports/vat-summary", storeIds, activeStoreId },
    summary,
    rowCount: items.length,
    promptPresets: [
      "KDV dagilimini yorumla",
      "Vergi ve brut toplam iliskisini ozetle",
      "Uyumluluk acisindan dikkat edilmesi gereken noktalar neler",
    ],
  });

  return (
    <ReportShell
      title="KDV Ozeti"
      description="Aylik KDV orani bazli vergi ozeti"
      filters={
        <ReportFilterPanel onApply={() => void fetchData()} loading={loading}>
          <ReportField label="Ay">
            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className={reportInputClassName} />
          </ReportField>
          <ReportStoreField options={storeOptions} values={storeIds} onChange={setStoreIds} />
        </ReportFilterPanel>
      }
      summary={!loading && !error && items.length > 0 ? <ReportSummaryCards items={summary} columnsClassName="grid-cols-1 sm:grid-cols-3" /> : null}
      onExport={() =>
        exportRowsToCsv(
          "vat-summary",
          items.map((item) => ({
            kdv_orani: item.taxRate ?? 0,
            islem_sayisi: item.transactionCount ?? 0,
            iptal_sayisi: item.cancelledCount ?? 0,
            para_birimi: item.currency ?? "-",
            net_satis: item.netSales ?? 0,
            kdv_tutari: item.taxAmount ?? 0,
            brut_toplam: item.grossTotal ?? 0,
          })),
        )
      }
      disableExport={items.length === 0}
    >
      <ReportTableSurface loading={loading} error={error} isEmpty={items.length === 0} emptyMessage="Secilen donemde veri bulunamadi." className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-6 shadow-glow">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="pb-3 pr-4">KDV Orani</th>
                <th className="pb-3 pr-4">Islem Sayisi</th>
                <th className="pb-3 pr-4">Iptal Sayisi</th>
                {hasCurrency ? <th className="pb-3 pr-4">PB</th> : null}
                <th className="pb-3 pr-4">Net Satis</th>
                <th className="pb-3 pr-4">KDV Tutari</th>
                <th className="pb-3">Brut Toplam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item, index) => (
                <tr key={`vat-${index}`} className="text-text">
                  <td className="py-3 pr-4 font-medium">{item.taxRate != null ? `%${item.taxRate}` : "-"}</td>
                  <td className="py-3 pr-4">{item.transactionCount ?? 0}</td>
                  <td className="py-3 pr-4">{item.cancelledCount ?? 0}</td>
                  {hasCurrency ? <td className="py-3 pr-4">{item.currency ?? "-"}</td> : null}
                  <td className="py-3 pr-4">{formatPrice(item.netSales)}</td>
                  <td className="py-3 pr-4">{formatPrice(item.taxAmount)}</td>
                  <td className="py-3">{formatPrice(item.grossTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportTableSurface>
    </ReportShell>
  );
}
