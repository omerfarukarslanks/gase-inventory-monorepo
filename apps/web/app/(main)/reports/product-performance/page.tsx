"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getReportProductRanking, type ProductRankingItem } from "@/lib/reports";
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

export default function ProductPerformancePage() {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [items, setItems] = useState<ProductRankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { storeIds, setStoreIds, storeOptions, activeStoreId } = useReportScopeState();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportProductRanking({ startDate, endDate, limit: 50, storeIds });
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
      { label: "Urun", value: items.length.toLocaleString("tr-TR") },
      {
        label: "Toplam Gelir",
        value: formatPrice(items.reduce((sum, item) => sum + (item.totalRevenue ?? 0), 0)),
      },
      {
        label: "Toplam Satilan",
        value: items.reduce((sum, item) => sum + (item.soldQuantity ?? 0), 0).toLocaleString("tr-TR"),
      },
    ],
    [items],
  );

  useSyncAiReportContext({
    reportType: "product-performance",
    title: "Urun Performansi",
    description: "Secilen tarih araligindaki urun bazli satis siralamasi",
    path: "/reports/product-performance",
    filters: { startDate, endDate, storeIds },
    scope: { route: "/reports/product-performance", storeIds, activeStoreId },
    summary,
    rowCount: items.length,
    promptPresets: [
      "En iyi ve zayif performansli urunleri yorumla",
      "Gelir ve stok birlikte dusunulurse hangi urunler kritik",
      "Bu listeye gore katalog aksiyonlari oner",
    ],
  });

  return (
    <ReportShell
      title="Urun Performansi"
      description="Secilen tarih araligindaki urun bazli satis siralamasi"
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
      summary={!loading && !error && items.length > 0 ? <ReportSummaryCards items={summary} columnsClassName="grid-cols-1 sm:grid-cols-3" /> : null}
      onExport={() =>
        exportRowsToCsv(
          "product-performance",
          items.map((item, index) => ({
            sira: item.rank ?? index + 1,
            urun: item.productName ?? "-",
            varyant: item.variantName ?? "-",
            kod: item.variantCode ?? "-",
            satilan: item.soldQuantity ?? 0,
            para_birimi: item.currency ?? "-",
            gelir: item.totalRevenue ?? 0,
            satis_adedi: item.saleCount ?? 0,
            mevcut_stok: item.currentStock ?? 0,
          })),
        )
      }
      disableExport={items.length === 0}
    >
      <ReportTableSurface
        loading={loading}
        error={error}
        isEmpty={items.length === 0}
        emptyMessage="Secilen tarih araliginda urun performans verisi bulunamadi."
        className="rounded-2xl border border-border bg-surface p-6 shadow-glow"
      >
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Sira</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Urun</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Varyant</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Kod</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Satilan</th>
                {hasCurrency ? <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">PB</th> : null}
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Gelir</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Satis Adedi</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Mevcut Stok</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.productVariantId ?? index} className="border-b border-border last:border-b-0 transition-colors hover:bg-primary/5">
                  <td className="px-4 py-3 font-medium text-text">{item.rank ?? index + 1}</td>
                  <td className="px-4 py-3 text-text">{item.productName ?? "-"}</td>
                  <td className="px-4 py-3 text-text">{item.variantName ?? "-"}</td>
                  <td className="px-4 py-3 text-muted">{item.variantCode ?? "-"}</td>
                  <td className="px-4 py-3 text-right font-medium text-text">{item.soldQuantity ?? 0}</td>
                  {hasCurrency ? <td className="px-4 py-3 text-right text-text">{item.currency ?? "-"}</td> : null}
                  <td className="px-4 py-3 text-right font-medium text-text">{formatPrice(item.totalRevenue)}</td>
                  <td className="px-4 py-3 text-right text-text">{item.saleCount ?? 0}</td>
                  <td className="px-4 py-3 text-right text-text">{item.currentStock ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportTableSurface>
    </ReportShell>
  );
}
