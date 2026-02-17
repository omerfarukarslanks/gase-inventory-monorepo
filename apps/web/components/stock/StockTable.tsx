"use client";

import { Fragment, useState, useMemo } from "react";
import type {
  InventoryProductStockItem,
  InventoryVariantStockItem,
  InventoryStoreStockItem,
} from "@/lib/inventory";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import { cn } from "@/lib/cn";

function formatNumber(value: number | null | undefined) {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return "0";
  return numeric.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

function TransferIcon() {
  return (
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
    >
      <path d="M17 3h4v4" />
      <path d="M3 21 21 3" />
      <path d="M7 3H3v4" />
      <path d="M21 21l-6-6" />
    </svg>
  );
}

/* ── Variant action params ── */

export type VariantActionParams = {
  productVariantId: string;
  productName: string;
  variantName: string;
  stores: InventoryStoreStockItem[];
};

/* ── Virtual variant rows ── */

function VirtualVariantRows({
  variants,
  productName,
  getVariantStores,
  onAdjust,
  onTransfer,
}: {
  variants: InventoryVariantStockItem[];
  productName: string;
  getVariantStores: (variant: InventoryVariantStockItem) => InventoryStoreStockItem[];
  onAdjust: (params: VariantActionParams) => void;
  onTransfer: (params: VariantActionParams) => void;
}) {
  const rowHeight = 44;
  const containerHeight = 280;
  const overscan = 4;
  const [scrollTop, setScrollTop] = useState(0);

  if (variants.length === 0) {
    return (
      <div className="px-3 py-4 text-sm text-muted">Bu urun icin varyant bulunamadi.</div>
    );
  }

  const totalHeight = variants.length * rowHeight;
  const visibleCount = Math.ceil(containerHeight / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(variants.length, startIndex + visibleCount + overscan * 2);
  const visibleVariants = variants.slice(startIndex, endIndex);

  const makeParams = (variant: InventoryVariantStockItem): VariantActionParams => ({
    productVariantId: variant.productVariantId,
    productName,
    variantName: variant.variantName,
    stores: getVariantStores(variant),
  });

  return (
    <div
      className="h-[280px] overflow-y-auto"
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div className="relative" style={{ height: totalHeight }}>
        <div
          className="absolute inset-x-0"
          style={{ transform: `translateY(${startIndex * rowHeight}px)` }}
        >
          {visibleVariants.map((variant) => (
            <div
              key={variant.productVariantId}
              className="grid h-11 grid-cols-[1.5fr_1fr_0.8fr_1fr] items-center border-b border-border px-3 text-sm last:border-b-0 hover:bg-surface2/40"
            >
              <div className="truncate text-text">{variant.variantName}</div>
              <div className="truncate text-text2">{variant.variantCode ?? "-"}</div>
              <div className="text-right text-text">{formatNumber(variant.totalQuantity)}</div>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onAdjust(makeParams(variant))}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-[11px] text-text2 hover:border-primary/40 hover:text-primary"
                  title="Stok Duzeltme"
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => onTransfer(makeParams(variant))}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-[11px] text-text2 hover:border-primary/40 hover:text-primary"
                  title="Transfer"
                >
                  <TransferIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main table ── */

type StockTableProps = {
  products: InventoryProductStockItem[];
  loading: boolean;
  error: string;
  getVariantStores: (variant: InventoryVariantStockItem) => InventoryStoreStockItem[];
  onAdjust: (params: VariantActionParams) => void;
  onTransfer: (params: VariantActionParams) => void;
};

export default function StockTable({
  products,
  loading,
  error,
  getVariantStores,
  onAdjust,
  onTransfer,
}: StockTableProps) {
  const [expandedProductIds, setExpandedProductIds] = useState<string[]>([]);

  const toggleProduct = (productId: string) => {
    setExpandedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {loading ? (
        <div className="p-6 text-sm text-muted">Stok ozeti yukleniyor...</div>
      ) : error ? (
        <div className="p-6 text-sm text-error">{error}</div>
      ) : products.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted">
          Gosterilecek stok verisi bulunamadi.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead className="border-b border-border bg-surface2/70">
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="w-10 px-2 py-3"></th>
                <th className="px-4 py-3">Urun</th>
                <th className="px-4 py-3 text-right">Miktar</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const expanded = expandedProductIds.includes(product.productId);
                return (
                  <Fragment key={product.productId}>
                    <tr className="border-b border-border hover:bg-surface2/40">
                      <td className="px-2 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleProduct(product.productId)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface2 hover:text-text"
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
                            className={cn(
                              "transition-transform",
                              expanded && "rotate-90",
                            )}
                          >
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-text">
                        {product.productName}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-text">
                        {formatNumber(product.totalQuantity)}
                      </td>
                    </tr>

                    {expanded && (
                      <tr className="border-b border-border bg-surface/70">
                        <td></td>
                        <td colSpan={2} className="px-4 py-3">
                          <div className="overflow-hidden rounded-xl border border-border bg-surface2/30">
                            <div className="grid grid-cols-[1.5fr_1fr_0.8fr_1fr] border-b border-border bg-surface2/60 px-3 py-2 text-[11px] uppercase tracking-wide text-muted">
                              <div>Varyant</div>
                              <div>Kod</div>
                              <div className="text-right">Miktar</div>
                              <div className="text-right">Islem</div>
                            </div>
                            <VirtualVariantRows
                              variants={product.variants ?? []}
                              productName={product.productName}
                              getVariantStores={getVariantStores}
                              onAdjust={onAdjust}
                              onTransfer={onTransfer}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
