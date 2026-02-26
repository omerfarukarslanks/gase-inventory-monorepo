"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { Product, ProductVariant } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { EditIcon, PriceIcon } from "@/components/ui/icons/TableIcons";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { cn } from "@/lib/cn";

function formatPercentOrAmount(percent: number | string | null | undefined, amount: number | string | null | undefined) {
  if (percent != null && String(percent) !== "") return `%${percent}`;
  if (amount != null && String(amount) !== "") return formatPrice(amount);
  return "-";
}

/* ── Virtual variant list ── */

function VirtualVariantList({
  variants,
  fallbackCurrency,
  togglingVariantIds,
  onToggleVariantActive,
}: {
  variants: ProductVariant[];
  fallbackCurrency: string;
  togglingVariantIds: string[];
  onToggleVariantActive: (variant: ProductVariant, next: boolean) => void;
}) {
  const rowHeight = 64;
  const containerHeight = 240;
  const overscan = 4;
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = variants.length * rowHeight;
  const visibleCount = Math.ceil(containerHeight / rowHeight);

  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const end = Math.min(variants.length, start + visibleCount + overscan * 2);
    return { startIndex: start, endIndex: end };
  }, [scrollTop, rowHeight, overscan, visibleCount, variants.length]);

  const visibleItems = variants.slice(startIndex, endIndex);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="grid grid-cols-[minmax(180px,2fr)_100px_120px_120px_120px_92px] border-b border-border bg-surface2/70 px-3 py-2 text-left text-[11px] uppercase tracking-wide text-muted">
        <div>Varyant</div>
        <div className="text-right">Para Birimi</div>
        <div className="text-right">Satış</div>
        <div className="text-right">Vergi</div>
        <div className="text-right">İndirim</div>
        <div className="text-right">İşlemler</div>
      </div>
      <div
        className="h-[240px] overflow-y-auto"
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        <div className="relative" style={{ height: totalHeight }}>
          <div
            className="absolute left-0 right-0"
            style={{ transform: `translateY(${startIndex * rowHeight}px)` }}
          >
            {visibleItems.map((variant) => (
              <div
                key={variant.id}
                className="grid h-16 grid-cols-[minmax(180px,2fr)_100px_120px_120px_120px_92px] items-center border-b border-border px-3 text-sm text-text2 last:border-b-0 hover:bg-surface2/30"
              >
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-text">
                    {variant.name ?? "Ozellik yok"}
                  </div>
                  <div className="truncate text-[11px] text-muted">{variant.code ?? "-"}</div>
                </div>
                <div className="text-right">
                  <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {variant.currency ?? fallbackCurrency}
                  </span>
                </div>
                <div className="text-right text-xs text-text2">
                  {formatPrice(variant.lineTotal ?? variant.unitPrice)}
                </div>
                <div className="text-right text-xs text-text2">
                  {formatPercentOrAmount(variant.taxPercent, variant.taxAmount)}
                </div>
                <div className="text-right text-xs text-text2">
                  {formatPercentOrAmount(variant.discountPercent, variant.discountAmount)}
                </div>
                <div className="flex items-center justify-end gap-1 text-right">
                  <ToggleSwitch
                    checked={Boolean(variant.isActive)}
                    onChange={(next) => onToggleVariantActive(variant, next)}
                    disabled={togglingVariantIds.includes(variant.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main table ── */

type ProductTableProps = {
  products: Product[];
  loading: boolean;
  error: string;
  expandedProductIds: string[];
  productVariantsById: Record<string, ProductVariant[]>;
  productVariantsLoadingById: Record<string, boolean>;
  productVariantsErrorById: Record<string, string>;
  togglingProductIds: string[];
  togglingVariantIds: string[];
  onToggleExpand: (productId: string) => void;
  onEdit: (productId: string) => void;
  onToggleActive: (product: Product, next: boolean) => void;
  onToggleVariantActive: (productId: string, variant: ProductVariant, next: boolean) => void;
  onProductPrice: (product: Product) => void;
  footer?: ReactNode;
};

export default function ProductTable({
  products,
  loading,
  error,
  expandedProductIds,
  productVariantsById,
  productVariantsLoadingById,
  productVariantsErrorById,
  togglingProductIds,
  togglingVariantIds,
  onToggleExpand,
  onEdit,
  onToggleActive,
  onToggleVariantActive,
  onProductPrice,
  footer,
}: ProductTableProps) {
  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {loading ? (
        <div className="p-6 text-sm text-muted">Urunler yukleniyor...</div>
      ) : error ? (
        <div className="p-6">
          <p className="text-sm text-error">{error}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="border-b border-border bg-surface2/70">
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="w-10 px-2 py-3 text-center"></th>
                <th className="px-4 py-3">Urun Adi</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Para Birimi</th>
                <th className="px-4 py-3 text-right">Satis Fiyati</th>
                <th className="px-4 py-3 text-right">Alis Fiyati</th>
                <th className="px-4 py-3 text-right">Vergi</th>
                <th className="px-4 py-3 text-right">Indirim</th>
                <th className="px-4 py-3 text-center">Varyant</th>
                <th className="sticky right-0 z-20 w-[156px] bg-surface2/70 px-4 py-3 text-right shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.2)]">
                  Islemler
                </th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-sm text-muted">
                    Henuz urun bulunmuyor.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isExpanded = expandedProductIds.includes(product.id);
                  const tableVariants = productVariantsById[product.id] || [];
                  const loadingVariants = productVariantsLoadingById[product.id];
                  const variantsError = productVariantsErrorById[product.id];
                  return [
                    <tr
                      key={`${product.id}-row`}
                      className="group border-b border-border hover:bg-surface2/50 transition-colors"
                    >
                      <td className="px-2 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleExpand(product.id)}
                          className="inline-flex h-7 w-7 items-center cursor-pointer justify-center rounded-lg text-muted transition-colors hover:bg-surface2 hover:text-text"
                          aria-label={isExpanded ? "Varyantları gizle" : "Varyantları göster"}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={cn("transition-transform", isExpanded && "rotate-90")}
                          >
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-9 w-9 rounded-lg object-cover border border-border"
                            />
                          ) : (
                            <div className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface2 text-xs text-muted">
                              {product.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-medium text-text">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-text2">{product.sku}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {product.currency}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-text2">
                        {formatPrice(product.lineTotal ?? product.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-text2">
                        {formatPrice(product.purchasePrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-text2">
                        {formatPercentOrAmount(product.taxPercent, product.taxAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-text2">
                        {formatPercentOrAmount(product.discountPercent, product.discountAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex rounded-full bg-surface2 px-2 py-0.5 text-xs font-medium text-text2">
                          {product.variantCount ?? product.variants?.length ?? 0}
                        </span>
                      </td>
                      <td className="sticky right-0 z-10 w-[156px] bg-surface px-4 py-3 text-right shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.2)] group-hover:bg-surface2/50">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onProductPrice(product)}
                            disabled={togglingProductIds.includes(product.id)}
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors disabled:opacity-50"
                            aria-label="Urun fiyatini duzenle"
                            title="Fiyat Duzenle"
                          >
                            <PriceIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(product.id)}
                            disabled={togglingProductIds.includes(product.id)}
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
                            aria-label="Urunu duzenle"
                            title="Duzenle"
                          >
                            <EditIcon />
                          </button>
                          <ToggleSwitch
                            checked={Boolean(product.isActive)}
                            onChange={(next) => onToggleActive(product, next)}
                            disabled={togglingProductIds.includes(product.id)}
                          />
                        </div>
                      </td>
                    </tr>,
                    isExpanded ? (
                      <tr key={`${product.id}-expanded`} className="border-b border-border bg-surface/60">
                        <td colSpan={10} className="px-4 py-3">
                          {loadingVariants ? (
                            <div className="rounded-xl border border-border bg-surface2/40 p-3 text-sm text-muted">
                              Varyantlar yükleniyor...
                            </div>
                          ) : variantsError ? (
                            <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-sm text-error">
                              {variantsError}
                            </div>
                          ) : tableVariants.length === 0 ? (
                            <div className="rounded-xl border border-border bg-surface2/40 p-3 text-sm text-muted">
                              Secilen filtrede varyant bulunmuyor.
                            </div>
                          ) : (
                            <VirtualVariantList
                              variants={tableVariants}
                              fallbackCurrency={product.currency}
                              togglingVariantIds={togglingVariantIds}
                              onToggleVariantActive={(variant, next) =>
                                onToggleVariantActive(product.id, variant, next)
                              }
                            />
                          )}
                        </td>
                      </tr>
                    ) : null,
                  ];
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      {footer}
    </section>
  );
}
