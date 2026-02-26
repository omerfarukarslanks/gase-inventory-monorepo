"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getReportSupplierSalesPerformance,
  type SupplierSalesPerformanceItem,
  type SupplierSalesPerformanceResponse,
} from "@/lib/reports";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { formatPrice } from "@/lib/format";

const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

export default function SupplierPerformancePage() {
  const [startDateInput, setStartDateInput] = useState(monthAgo);
  const [endDateInput, setEndDateInput] = useState(today);
  const [searchInput, setSearchInput] = useState("");

  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [items, setItems] = useState<SupplierSalesPerformanceItem[]>([]);
  const [totals, setTotals] = useState<SupplierSalesPerformanceResponse["totals"]>(undefined);
  const [meta, setMeta] = useState<SupplierSalesPerformanceResponse["meta"]>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  }, [startDate, endDate, search, page, limit]);

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

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/reports"
          className="mb-2 inline-block text-sm text-primary hover:underline"
        >
          &larr; Raporlar
        </Link>
        <h1 className="text-xl font-semibold text-text">Tedarikci Performansi</h1>
        <p className="text-sm text-muted">
          Tedarikci bazli satis performansi ve ciro analizi
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">
            Baslangic
          </label>
          <input
            type="date"
            value={startDateInput}
            onChange={(e) => setStartDateInput(e.target.value)}
            className="h-10 rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">
            Bitis
          </label>
          <input
            type="date"
            value={endDateInput}
            onChange={(e) => setEndDateInput(e.target.value)}
            className="h-10 rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">
            Search
          </label>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tedarikci ara..."
            className="h-10 w-56 rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">
            Limit
          </label>
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
        </div>
        <button
          onClick={onFilter}
          disabled={loading}
          className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Yukleniyor..." : "Filtrele"}
        </button>
      </div>

      {!loading && !error && totals && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tedarikci</p>
            <p className="mt-1 text-lg font-bold text-text">{totals.totalSuppliers ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Satis</p>
            <p className="mt-1 text-lg font-bold text-text">{totals.totalSales ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Urun</p>
            <p className="mt-1 text-lg font-bold text-text">{totals.totalProducts ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Varyant</p>
            <p className="mt-1 text-lg font-bold text-text">{totals.totalVariants ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Miktar</p>
            <p className="mt-1 text-lg font-bold text-text">{totals.totalQuantity ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Toplam Birim</p>
            <p className="mt-1 text-lg font-bold text-text">{formatPrice(totals.totalUnitPrice)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Toplam Indirim</p>
            <p className="mt-1 text-lg font-bold text-text">{formatPrice(totals.totalDiscount)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Toplam Vergi</p>
            <p className="mt-1 text-lg font-bold text-text">{formatPrice(totals.totalTax)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Toplam Ciro</p>
            <p className="mt-1 text-lg font-bold text-text">{formatPrice(totals.totalLineTotal)}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-surface p-12">
          <p className="text-sm text-muted">Yukleniyor...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-surface p-12">
          <p className="text-sm text-muted">Secilen filtrelerde veri bulunamadi.</p>
        </div>
      ) : (
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
                {hasCurrency && (
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">PB</th>
                )}
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Toplam</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Ort. Birim</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={item.supplierId ?? idx}
                  className="border-b border-border last:border-b-0 transition-colors hover:bg-primary/5"
                >
                  <td className="px-4 py-3 text-text">
                    {[item.supplierName, item.supplierSurname].filter(Boolean).join(" ") || "-"}
                  </td>
                  <td className="px-4 py-3 text-text">{item.supplierPhoneNumber ?? "-"}</td>
                  <td className="px-4 py-3 text-muted">{item.supplierEmail ?? "-"}</td>
                  <td className="px-4 py-3 text-right text-text">{item.saleCount ?? 0}</td>
                  <td className="px-4 py-3 text-right text-text">{item.productCount ?? 0}</td>
                  <td className="px-4 py-3 text-right text-text">{item.variantCount ?? 0}</td>
                  <td className="px-4 py-3 text-right text-text">{item.quantity ?? 0}</td>
                  {hasCurrency && <td className="px-4 py-3 text-right text-text">{item.currency ?? "-"}</td>}
                  <td className="px-4 py-3 text-right font-medium text-text">{formatPrice(item.lineTotal)}</td>
                  <td className="px-4 py-3 text-right text-text">{formatPrice(item.avgUnitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && (
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
      )}
    </div>
  );
}
