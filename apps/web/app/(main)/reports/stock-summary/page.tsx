"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { getReportStockSummary, type StockSummaryProduct } from "@/lib/reports";
import { exportRowsToCsv, reportInputClassName } from "@/lib/analytics";
import { ReportShell } from "@/components/reports/ReportShell";
import { ReportFilterPanel } from "@/components/reports/ReportFilterPanel";
import { ReportField } from "@/components/reports/ReportField";
import { ReportStoreField } from "@/components/reports/ReportStoreField";
import { ReportSummaryCards } from "@/components/reports/ReportSummaryCards";
import { ReportTableSurface } from "@/components/reports/ReportTableSurface";
import { useReportScopeState } from "@/hooks/useReportScopeState";
import { useSyncAiReportContext } from "@/hooks/useSyncAiReportContext";

export default function StockSummaryPage() {
  const [data, setData] = useState<StockSummaryProduct[]>([]);
  const [totalQuantity, setTotalQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());
  const { storeIds, setStoreIds, storeOptions, activeStoreId } = useReportScopeState();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportStockSummary({ limit: 50, search: search || undefined, storeIds });
      setData(res.data ?? []);
      setTotalQuantity(res.totalQuantity ?? 0);
    } catch {
      setData([]);
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [search, storeIds]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const toggleProduct = (id: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleVariant = (id: string) => {
    setExpandedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFilter = () => {
    setSearch(searchInput);
  };

  const summary = useMemo(
    () => [
      { label: "Toplam Stok Miktari", value: totalQuantity.toLocaleString("tr-TR") },
      { label: "Urun Sayisi", value: data.length.toLocaleString("tr-TR") },
    ],
    [data.length, totalQuantity],
  );

  useSyncAiReportContext({
    reportType: "stock-summary",
    title: "Stok Ozeti",
    description: "Urun-varyant-magaza bazli stok durumu",
    path: "/reports/stock-summary",
    filters: { search, storeIds },
    scope: { route: "/reports/stock-summary", storeIds, activeStoreId },
    summary,
    rowCount: data.length,
    promptPresets: [
      "Stok ozetini ve toplam miktari yorumla",
      "Hangi urunlerde stok yogunlugu var, ozetle",
      "Bu dagilima gore aksiyon listesi cikar",
    ],
  });

  return (
    <ReportShell
      title="Stok Ozeti"
      description="Urun-varyant-magaza bazli stok durumu"
      filters={
        <ReportFilterPanel onApply={handleFilter} loading={loading}>
          <ReportField label="Arama" className="min-w-[220px] flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleFilter()}
              placeholder="Urun adi ile ara..."
              className={`${reportInputClassName} w-full`}
            />
          </ReportField>
          <ReportStoreField options={storeOptions} values={storeIds} onChange={setStoreIds} />
        </ReportFilterPanel>
      }
      summary={!loading && !error ? <ReportSummaryCards items={summary} columnsClassName="grid-cols-1 sm:grid-cols-2" /> : null}
      onExport={() =>
        exportRowsToCsv(
          "stock-summary",
          data.flatMap((product) =>
            (product.variants ?? []).flatMap((variant) =>
              (variant.stores ?? []).map((store) => ({
                urun: product.productName ?? "-",
                varyant: variant.variantName ?? "-",
                kod: variant.variantCode ?? "-",
                magaza: store.storeName ?? "-",
                miktar: store.quantity ?? store.totalQuantity ?? 0,
              })),
            ),
          ),
        )
      }
      disableExport={data.length === 0}
    >
      <ReportTableSurface
        loading={loading}
        error={error}
        isEmpty={data.length === 0}
        emptyMessage="Gosterilecek veri bulunamadi."
        className="rounded-2xl border border-border bg-surface p-6 shadow-glow"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="pb-3 pr-4" />
                <th className="pb-3 pr-4">Urun Adi</th>
                <th className="pb-3 pr-4 text-right">Toplam Miktar</th>
              </tr>
            </thead>
            <tbody>
              {data.map((product) => {
                const productKey = product.productId ?? product.productName ?? "";
                const isProductExpanded = expandedProducts.has(productKey);
                return (
                  <Fragment key={productKey}>
                    <tr
                      className="cursor-pointer border-b border-border/50 transition-colors hover:bg-primary/5"
                      onClick={() => toggleProduct(productKey)}
                    >
                      <td className="py-3 pr-4 text-muted">{isProductExpanded ? "▼" : "▶"}</td>
                      <td className="py-3 pr-4 font-medium text-text">{product.productName ?? "-"}</td>
                      <td className="py-3 pr-4 text-right text-text">{product.totalQuantity ?? 0}</td>
                    </tr>
                    {isProductExpanded &&
                      (product.variants ?? []).map((variant) => {
                        const variantKey = variant.productVariantId ?? variant.variantCode ?? "";
                        const isVariantExpanded = expandedVariants.has(variantKey);
                        return (
                          <Fragment key={variantKey}>
                            <tr
                              className="cursor-pointer border-b border-border/30 bg-surface2/50 transition-colors hover:bg-primary/5"
                              onClick={() => toggleVariant(variantKey)}
                            >
                              <td className="py-2 pl-6 pr-4 text-muted">{isVariantExpanded ? "▽" : "▷"}</td>
                              <td className="py-2 pr-4">
                                <span className="text-text">{variant.variantName ?? "-"}</span>
                                {variant.variantCode ? <span className="ml-2 text-xs text-muted">({variant.variantCode})</span> : null}
                              </td>
                              <td className="py-2 pr-4 text-right text-text">{variant.totalQuantity ?? 0}</td>
                            </tr>
                            {isVariantExpanded &&
                              (variant.stores ?? []).map((store) => (
                                <tr key={store.storeId ?? store.storeName} className="border-b border-border/20 bg-surface2/80">
                                  <td className="py-2 pl-12 pr-4" />
                                  <td className="py-2 pr-4 text-muted">{store.storeName ?? "-"}</td>
                                  <td className="py-2 pr-4 text-right text-text">{store.quantity ?? store.totalQuantity ?? 0}</td>
                                </tr>
                              ))}
                          </Fragment>
                        );
                      })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </ReportTableSurface>
    </ReportShell>
  );
}
