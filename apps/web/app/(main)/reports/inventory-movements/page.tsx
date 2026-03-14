"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getReportMovements, type MovementItem, type MovementSummaryByType } from "@/lib/reports";
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

function getMovementTypeLabel(type?: string | null) {
  if (type === "ADJUSTMENT") return "Duzeltme";
  if (type === "TRANSFER_OUT") return "Transfer Cikis";
  if (type === "TRANSFER_IN") return "Transfer Giris";
  if (type === "OUT") return "Cikis";
  if (type === "IN") return "Giris";
  return type ?? "-";
}

const { startDate: defaultStartDate, endDate: defaultEndDate } = getDateRange(30);

export default function InventoryMovementsPage() {
  const [data, setData] = useState<MovementItem[]>([]);
  const [summaryByType, setSummaryByType] = useState<MovementSummaryByType[]>([]);
  const [totals, setTotals] = useState<{ movementCount?: number; netQuantity?: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startDateInput, setStartDateInput] = useState(defaultStartDate);
  const [endDateInput, setEndDateInput] = useState(defaultEndDate);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const { storeIds, setStoreIds, storeOptions, activeStoreId } = useReportScopeState();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportMovements({ startDate, endDate, limit: 50, storeIds });
      setData(res.data ?? []);
      setSummaryByType(res.summaryByType ?? []);
      setTotals(res.totals ?? {});
    } catch {
      setData([]);
      setSummaryByType([]);
      setTotals({});
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate, storeIds]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleFilter = () => {
    setStartDate(startDateInput);
    setEndDate(endDateInput);
  };

  const hasCurrency = data.some((item) => Boolean(item.currency));
  const summary = useMemo(
    () => [
      { label: "Toplam Hareket", value: (totals.movementCount ?? 0).toLocaleString("tr-TR") },
      { label: "Net Miktar", value: (totals.netQuantity ?? 0).toLocaleString("tr-TR") },
      { label: "Hareket Tipi", value: summaryByType.length.toLocaleString("tr-TR") },
    ],
    [summaryByType.length, totals.movementCount, totals.netQuantity],
  );

  useSyncAiReportContext({
    reportType: "inventory-movements",
    title: "Stok Hareketleri",
    description: "Giris/cikis hareket ozeti",
    path: "/reports/inventory-movements",
    filters: { startDate, endDate, storeIds },
    scope: { route: "/reports/inventory-movements", storeIds, activeStoreId },
    summary,
    rowCount: data.length,
    promptPresets: [
      "Hareket tiplerini ve net miktari yorumla",
      "Transfer ve duzeltme agirligini analiz et",
      "Bu hareket dagilimina gore operasyon aksiyonu oner",
    ],
  });

  return (
    <ReportShell
      title="Stok Hareketleri"
      description="Giris/cikis hareket ozeti"
      filters={
        <ReportFilterPanel onApply={handleFilter} loading={loading}>
          <ReportField label="Baslangic Tarihi">
            <input type="date" value={startDateInput} onChange={(event) => setStartDateInput(event.target.value)} className={reportInputClassName} />
          </ReportField>
          <ReportField label="Bitis Tarihi">
            <input type="date" value={endDateInput} onChange={(event) => setEndDateInput(event.target.value)} className={reportInputClassName} />
          </ReportField>
          <ReportStoreField options={storeOptions} values={storeIds} onChange={setStoreIds} />
        </ReportFilterPanel>
      }
      summary={!loading && !error ? <ReportSummaryCards items={summary} columnsClassName="grid-cols-1 sm:grid-cols-3" /> : null}
      onExport={() =>
        exportRowsToCsv(
          "inventory-movements",
          data.map((item) => ({
            tarih: item.createdAt ?? "-",
            tip: getMovementTypeLabel(item.type),
            urun: item.product?.name ?? "-",
            varyant: item.productVariant?.name ?? "-",
            magaza: item.store?.name ?? "-",
            miktar: item.quantity ?? 0,
            para_birimi: item.currency ?? "-",
            birim_fiyat: item.unitPrice ?? 0,
            toplam: item.lineTotal ?? 0,
          })),
        )
      }
      disableExport={data.length === 0}
    >
      {!loading && !error && summaryByType.length > 0 ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaryByType.map((item) => (
            <div key={item.type} className="rounded-2xl border border-border bg-surface p-4 shadow-glow">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{getMovementTypeLabel(item.type)}</p>
              <p className="mt-1 text-lg font-bold text-text">{(item.movementCount ?? 0).toLocaleString("tr-TR")} hareket</p>
              <p className="text-sm text-muted">Toplam: {(item.totalQuantity ?? 0).toLocaleString("tr-TR")} adet</p>
            </div>
          ))}
        </section>
      ) : null}

      <ReportTableSurface loading={loading} error={error} isEmpty={data.length === 0} emptyMessage="Gosterilecek veri bulunamadi." className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="pb-3 pr-4">Tarih</th>
                <th className="pb-3 pr-4">Tip</th>
                <th className="pb-3 pr-4">Urun</th>
                <th className="pb-3 pr-4">Varyant</th>
                <th className="pb-3 pr-4">Magaza</th>
                <th className="pb-3 pr-4 text-right">Miktar</th>
                {hasCurrency ? <th className="pb-3 pr-4 text-right">PB</th> : null}
                <th className="pb-3 pr-4 text-right">Birim Fiyat</th>
                <th className="pb-3 pr-4 text-right">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={item.id ?? index} className="border-b border-border/50 transition-colors hover:bg-primary/5">
                  <td className="py-3 pr-4 text-muted">{formatDate(item.createdAt)}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {getMovementTypeLabel(item.type)}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-medium text-text">{item.product?.name ?? "-"}</td>
                  <td className="py-3 pr-4 text-text">{item.productVariant?.name ?? "-"}</td>
                  <td className="py-3 pr-4 text-text">{item.store?.name ?? "-"}</td>
                  <td className="py-3 pr-4 text-right text-text">{item.quantity ?? 0}</td>
                  {hasCurrency ? <td className="py-3 pr-4 text-right text-text">{item.currency ?? "-"}</td> : null}
                  <td className="py-3 pr-4 text-right text-text">{formatPrice(item.unitPrice)}</td>
                  <td className="py-3 pr-4 text-right font-medium text-text">{formatPrice(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportTableSurface>
    </ReportShell>
  );
}
