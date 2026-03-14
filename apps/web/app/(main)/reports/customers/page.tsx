"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getReportTopCustomers, type TopCustomerItem } from "@/lib/reports";
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

export default function CustomersPage() {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [limit, setLimit] = useState(50);
  const [items, setItems] = useState<TopCustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { storeIds, setStoreIds, storeOptions, activeStoreId } = useReportScopeState();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportTopCustomers({ startDate, endDate, limit, storeIds });
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
      { label: "Musteri", value: items.length.toLocaleString("tr-TR") },
      {
        label: "Toplam Harcama",
        value: formatPrice(items.reduce((sum, item) => sum + (item.totalSpent ?? 0), 0)),
      },
      {
        label: "Toplam Siparis",
        value: items.reduce((sum, item) => sum + (item.totalOrders ?? 0), 0).toLocaleString("tr-TR"),
      },
    ],
    [items],
  );

  useSyncAiReportContext({
    reportType: "customers",
    title: "Musteri Analizi",
    description: "Secilen tarih araliginda en cok alisveris yapan musteriler",
    path: "/reports/customers",
    filters: { startDate, endDate, limit, storeIds },
    scope: { route: "/reports/customers", storeIds, activeStoreId },
    summary,
    rowCount: items.length,
    promptPresets: [
      "Musteri listesini deger ve siparis sayisina gore yorumla",
      "En degerli segmenti ve riskli sinyalleri ozetle",
      "Bu rapora gore CRM aksiyon onerileri ver",
    ],
  });

  return (
    <ReportShell
      title="Musteri Analizi"
      description="Secilen tarih araliginda en cok alisveris yapan musteriler"
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
          "customer-analysis",
          items.map((item, index) => ({
            sira: item.rank ?? index + 1,
            musteri: [item.name, item.surname].filter(Boolean).join(" ") || "-",
            telefon: item.phoneNumber ?? "-",
            email: item.email ?? "-",
            siparis: item.totalOrders ?? 0,
            onayli: item.confirmedCount ?? 0,
            iptal: item.cancelledCount ?? 0,
            para_birimi: item.currency ?? "-",
            toplam_harcama: item.totalSpent ?? 0,
            ortalama_sepet: item.averageBasket ?? 0,
            ilk_alis: item.firstPurchase ?? "-",
            son_alis: item.lastPurchase ?? "-",
          })),
        )
      }
      disableExport={items.length === 0}
    >
      <ReportTableSurface
        loading={loading}
        error={error}
        isEmpty={items.length === 0}
        emptyMessage="Secilen tarih araliginda musteri verisi bulunamadi."
        className="rounded-2xl border border-border bg-surface p-6 shadow-glow"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Sira</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Musteri</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Telefon</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Email</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Siparis</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Onayli</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Iptal</th>
                {hasCurrency ? <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">PB</th> : null}
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Toplam Harcama</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Ort. Sepet</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Ilk Alis</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Son Alis</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.phoneNumber ?? index} className="border-b border-border last:border-b-0 transition-colors hover:bg-primary/5">
                  <td className="px-4 py-3 font-medium text-text">{item.rank ?? index + 1}</td>
                  <td className="px-4 py-3 text-text">{[item.name, item.surname].filter(Boolean).join(" ") || "-"}</td>
                  <td className="px-4 py-3 text-text">{item.phoneNumber ?? "-"}</td>
                  <td className="px-4 py-3 text-muted">{item.email ?? "-"}</td>
                  <td className="px-4 py-3 text-right text-text">{item.totalOrders ?? 0}</td>
                  <td className="px-4 py-3 text-right text-text">{item.confirmedCount ?? 0}</td>
                  <td className="px-4 py-3 text-right text-text">{item.cancelledCount ?? 0}</td>
                  {hasCurrency ? <td className="px-4 py-3 text-right text-text">{item.currency ?? "-"}</td> : null}
                  <td className="px-4 py-3 text-right font-medium text-text">{formatPrice(item.totalSpent)}</td>
                  <td className="px-4 py-3 text-right text-text">{formatPrice(item.averageBasket)}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(item.firstPurchase)}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(item.lastPurchase)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportTableSurface>
    </ReportShell>
  );
}
