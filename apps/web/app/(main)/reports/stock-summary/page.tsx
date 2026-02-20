"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getReportStockSummary, type StockSummaryProduct } from "@/lib/reports";
import { formatPrice } from "@/lib/format";

export default function StockSummaryPage() {
  const [data, setData] = useState<StockSummaryProduct[]>([]);
  const [totalQuantity, setTotalQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportStockSummary({ limit: 50, search: search || undefined });
      setData(res.data ?? []);
      setTotalQuantity(res.totalQuantity ?? 0);
    } catch {
      setData([]);
      setError("Veriler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [search]);

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

  return (
    <div className="space-y-6">
      <div>
        <Link href="/reports" className="text-sm text-primary hover:underline">
          &larr; Raporlar
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-text">Stok Ozeti</h1>
        <p className="text-sm text-muted">Urun-varyant-magaza bazli stok durumu</p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold text-muted">Arama</label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              placeholder="Urun adi ile ara..."
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleFilter}
            className="h-10 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Filtrele
          </button>
        </div>
      </div>

      {/* Total */}
      {!loading && !error && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
          <p className="text-sm text-muted">Toplam Stok Miktari</p>
          <p className="text-2xl font-bold text-text">{totalQuantity.toLocaleString("tr-TR")}</p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <p className="py-8 text-center text-sm text-red-500">{error}</p>
        ) : data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">Gosterilecek veri bulunamadi.</p>
        ) : (
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
                                  {variant.variantCode && (
                                    <span className="ml-2 text-xs text-muted">({variant.variantCode})</span>
                                  )}
                                </td>
                                <td className="py-2 pr-4 text-right text-text">{variant.totalQuantity ?? 0}</td>
                              </tr>
                              {isVariantExpanded &&
                                (variant.stores ?? []).map((store) => (
                                  <tr
                                    key={store.storeId ?? store.storeName}
                                    className="border-b border-border/20 bg-surface2/80"
                                  >
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
        )}
      </div>
    </div>
  );
}
