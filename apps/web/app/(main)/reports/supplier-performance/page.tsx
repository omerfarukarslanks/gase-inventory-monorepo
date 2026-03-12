"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import {
  getReportSupplierSalesPerformance,
  type SupplierSalesPerformanceItem,
  type SupplierSalesPerformanceResponse,
} from "@/lib/reports";
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

export default function SupplierPerformancePage() {
  const [startDateInput, setStartDateInput] = useState(defaultStartDate);
  const [endDateInput, setEndDateInput] = useState(defaultEndDate);
  const [searchInput, setSearchInput] = useState("");
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [items, setItems] = useState<SupplierSalesPerformanceItem[]>([]);
  const [totals, setTotals] = useState<SupplierSalesPerformanceResponse["totals"]>(undefined);
  const [meta, setMeta] = useState<SupplierSalesPerformanceResponse["meta"]>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { storeIds, setStoreIds, storeOptions, activeStoreId } = useReportScopeState();

  const limitOptions = [
    { value: "20", label: "20" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ] as const;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportSupplierSalesPerformance({
        startDate,
        endDate,
        search: search || undefined,
        page,
        limit,
        storeIds,
      });
      setItems(res.data ?? []);
      setTotals(res.totals);
      setMeta(
        res.meta ?? {
          total: res.data?.length ?? 0,
          limit,
          page,
          totalPages: 1,
        },
      );
    } catch {
      setItems([]);
      setTotals(undefined);
      setMeta(undefined);
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [endDate, limit, page, search, startDate, storeIds]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const hasCurrency = items.some((item) => Boolean(item.currency));
  const totalPages = meta?.totalPages ?? 1;
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const onFilter = () => {
    setStartDate(startDateInput);
    setEndDate(endDateInput);
    setSearch(searchInput.trim());
    setPage(1);
  };

  const summary = useMemo(
    () =>
      totals
        ? [
            { label: "Tedarikci", value: totals.totalSuppliers ?? 0 },
            { label: "Satis", value: totals.totalSales ?? 0 },
            { label: "Urun", value: totals.totalProducts ?? 0 },
            { label: "Varyant", value: totals.totalVariants ?? 0 },
            { label: "Miktar", value: totals.totalQuantity ?? 0 },
            { label: "Toplam Ciro", value: formatPrice(totals.totalLineTotal) },
          ]
        : [],
    [totals],
  );

  useSyncAiReportContext({
    reportType: "supplier-performance",
    title: "Tedarikci Performansi",
    description: "Tedarikci bazli satis performansi ve ciro analizi",
    path: "/reports/supplier-performance",
    filters: { startDate, endDate, search, limit, page, storeIds },
    scope: { route: "/reports/supplier-performance", storeIds, activeStoreId },
    summary,
    rowCount: items.length,
    promptPresets: [
      "Tedarikci performansini ozetle ve fark yaratanlari belirt",
      "Ciro ve urun hacmine gore riskli/guclu tedarikcileri ayir",
      "Bu rapora gore satin alma aksiyonlari oner",
    ],
  });

  return (
    <ReportShell
      title="Tedarikci Performansi"
      description="Tedarikci bazli satis performansi ve ciro analizi"
      filters={
        <ReportFilterPanel onApply={onFilter} loading={loading}>
          <ReportField label="Baslangic">
            <input type="date" value={startDateInput} onChange={(event) => setStartDateInput(event.target.value)} className={reportInputClassName} />
          </ReportField>
          <ReportField label="Bitis">
            <input type="date" value={endDateInput} onChange={(event) => setEndDateInput(event.target.value)} className={reportInputClassName} />
          </ReportField>
          <ReportField label="Arama" className="min-w-[220px] flex-1">
            <input type="text" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tedarikci ara..." className={`${reportInputClassName} w-full`} />
          </ReportField>
          <ReportField label="Limit">
            <SearchableDropdown
              options={[...limitOptions]}
              value={String(limit)}
              onChange={(value) => {
                setLimit(Number(value || 20));
                setPage(1);
              }}
              placeholder="Limit"
              showEmptyOption={false}
              allowClear={false}
              showSearchInput={false}
              inputAriaLabel="Tedarikci performansi limit"
              toggleAriaLabel="Tedarikci performansi limit listesini ac"
              className="w-[100px]"
            />
          </ReportField>
          <ReportStoreField options={storeOptions} values={storeIds} onChange={setStoreIds} />
        </ReportFilterPanel>
      }
      summary={!loading && !error && summary.length > 0 ? <ReportSummaryCards items={summary} columnsClassName="grid-cols-2 sm:grid-cols-3 xl:grid-cols-6" /> : null}
      onExport={() =>
        exportRowsToCsv(
          "supplier-performance",
          items.map((item) => ({
            tedarikci: [item.supplierName, item.supplierSurname].filter(Boolean).join(" ") || "-",
            telefon: item.supplierPhoneNumber ?? "-",
            email: item.supplierEmail ?? "-",
            satis: item.saleCount ?? 0,
            urun: item.productCount ?? 0,
            varyant: item.variantCount ?? 0,
            miktar: item.quantity ?? 0,
            para_birimi: item.currency ?? "-",
            toplam: item.lineTotal ?? 0,
            ortalama_birim: item.avgUnitPrice ?? 0,
          })),
        )
      }
      disableExport={items.length === 0}
    >
      <ReportTableSurface loading={loading} error={error} isEmpty={items.length === 0} emptyMessage="Secilen filtrelerde veri bulunamadi." className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-glow">
          <table className="w-full min-w-[1320px] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Tedarikci</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Telefon</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Email</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Satis</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Urun</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Varyant</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Miktar</th>
                {hasCurrency ? <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">PB</th> : null}
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Toplam</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Ort. Birim</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.supplierId ?? index} className="border-b border-border last:border-b-0 transition-colors hover:bg-primary/5">
                  <td className="px-4 py-3 text-text">{[item.supplierName, item.supplierSurname].filter(Boolean).join(" ") || "-"}</td>
                  <td className="px-4 py-3 text-text">{item.supplierPhoneNumber ?? "-"}</td>
                  <td className="px-4 py-3 text-muted">{item.supplierEmail ?? "-"}</td>
                  <td className="px-4 py-3 text-right text-text">{item.saleCount ?? 0}</td>
                  <td className="px-4 py-3 text-right text-text">{item.productCount ?? 0}</td>
                  <td className="px-4 py-3 text-right text-text">{item.variantCount ?? 0}</td>
                  <td className="px-4 py-3 text-right text-text">{item.quantity ?? 0}</td>
                  {hasCurrency ? <td className="px-4 py-3 text-right text-text">{item.currency ?? "-"}</td> : null}
                  <td className="px-4 py-3 text-right font-medium text-text">{formatPrice(item.lineTotal)}</td>
                  <td className="px-4 py-3 text-right text-text">{formatPrice(item.avgUnitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportTableSurface>

      {!loading && !error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 text-sm">
          <div className="text-muted">
            Toplam: {meta?.total ?? 0} kayit | Sayfa: {page}/{totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => prev - 1)}
              disabled={!canPrev}
              className="h-9 rounded-lg border border-border px-3 text-sm text-text transition-colors hover:bg-surface2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Onceki
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!canNext}
              className="h-9 rounded-lg border border-border px-3 text-sm text-text transition-colors hover:bg-surface2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sonraki
            </button>
          </div>
        </div>
      ) : null}
    </ReportShell>
  );
}
