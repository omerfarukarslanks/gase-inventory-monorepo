"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { useLang } from "@/context/LangContext";
import type { InventoryProductStockItem } from "@/lib/inventory";

type StockMobileListProps = {
  products: InventoryProductStockItem[];
  loading: boolean;
  error: string;
  onStartTask: (product: InventoryProductStockItem) => void;
  footer?: ReactNode;
};

function formatNumber(value: number | null | undefined) {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return "0";
  return numeric.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

function LoadingCard() {
  return (
    <div className="space-y-3 rounded-xl2 border border-border bg-surface p-4">
      <div className="h-4 w-1/2 animate-pulse rounded bg-surface2" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-surface2" />
      <div className="h-3 w-1/3 animate-pulse rounded bg-surface2" />
    </div>
  );
}

export default function StockMobileList({
  products,
  loading,
  error,
  onStartTask,
  footer,
}: StockMobileListProps) {
  const { t } = useLang();

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {error ? (
        <div className="p-4">
          <p className="text-sm text-error">{error}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 p-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => <LoadingCard key={index} />)
            ) : products.length === 0 ? (
              <div className="rounded-xl2 border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                {t("stock.noData")}
              </div>
            ) : (
              products.map((product) => {
                const topVariants = (product.variants ?? []).slice(0, 3);
                const remainingCount = Math.max((product.variants ?? []).length - topVariants.length, 0);

                return (
                  <article key={product.productId} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-text">{product.productName}</h2>
                        <p className="mt-1 text-xs text-muted">
                          {(product.variants ?? []).length} varyant
                        </p>
                      </div>
                      <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                        {formatNumber(product.totalQuantity)}
                      </span>
                    </div>

                    <div className="space-y-2 rounded-xl border border-border bg-surface2/30 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Kritik Ozet</p>
                      {topVariants.length === 0 ? (
                        <p className="text-sm text-muted">Varyant bulunamadi.</p>
                      ) : (
                        topVariants.map((variant) => (
                          <div key={variant.productVariantId} className="flex items-center justify-between gap-3 text-sm">
                            <span className="truncate text-text2">{variant.variantName}</span>
                            <span className="font-medium text-text">{formatNumber(variant.totalQuantity)}</span>
                          </div>
                        ))
                      )}
                      {remainingCount > 0 ? (
                        <p className="text-xs text-muted">+{remainingCount} varyant daha</p>
                      ) : null}
                    </div>

                    <div className="border-t border-border pt-3">
                      <Button
                        label="Islem Baslat"
                        onClick={() => onStartTask(product)}
                        variant="primarySoft"
                        className="w-full"
                      />
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {footer}
        </>
      )}
    </section>
  );
}
