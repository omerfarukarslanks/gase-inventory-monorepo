"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon, PriceIcon } from "@/components/ui/icons/TableIcons";
import { formatPrice } from "@/lib/format";
import { useLang } from "@/context/LangContext";
import type { Product, ProductVariant } from "@/lib/products";

type ProductsMobileListProps = {
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
  canUpdate?: boolean;
  canPriceUpdate?: boolean;
  footer?: ReactNode;
};

function formatPercentOrAmount(percent: number | string | null | undefined, amount: number | string | null | undefined) {
  if (percent != null && String(percent) !== "") return `%${percent}`;
  if (amount != null && String(amount) !== "") return formatPrice(amount);
  return "-";
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

export default function ProductsMobileList({
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
  canUpdate = true,
  canPriceUpdate = true,
  footer,
}: ProductsMobileListProps) {
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
                {t("products.noData")}
              </div>
            ) : (
              products.map((product) => {
                const isExpanded = expandedProductIds.includes(product.id);
                const variants = productVariantsById[product.id] ?? [];
                const variantsLoading = productVariantsLoadingById[product.id];
                const variantsError = productVariantsErrorById[product.id];
                const isToggling = togglingProductIds.includes(product.id);

                return (
                  <article key={product.id} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-11 w-11 rounded-xl border border-border object-cover"
                          />
                        ) : (
                          <div className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-surface2 text-xs text-muted">
                            {product.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-semibold text-text">{product.name}</h2>
                          <p className="mt-1 truncate text-xs text-muted">{product.sku}</p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                          product.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                        }`}
                      >
                        {product.isActive ? t("common.active") : t("common.passive")}
                      </span>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 text-sm text-text2">
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("products.currencyLabel")}</dt>
                        <dd className="mt-1">{product.currency}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("products.variantCount")}</dt>
                        <dd className="mt-1">{product.variantCount ?? product.variants?.length ?? 0}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("products.salePrice")}</dt>
                        <dd className="mt-1 font-medium text-text">{formatPrice(product.lineTotal ?? product.unitPrice)}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("products.tax")}</dt>
                        <dd className="mt-1">{formatPercentOrAmount(product.taxPercent, product.taxAmount)}</dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                      <Button
                        label={isExpanded ? "Varyantlari Gizle" : "Varyantlar"}
                        onClick={() => onToggleExpand(product.id)}
                        disabled={isToggling}
                        variant="secondary"
                        className="min-w-[112px] flex-1"
                      />
                      {canPriceUpdate ? (
                        <IconButton
                          onClick={() => onProductPrice(product)}
                          disabled={isToggling}
                          aria-label={t("products.editPrice")}
                          title={t("products.editPrice")}
                          className="h-10 w-10 rounded-xl border border-border text-text2 hover:bg-surface2 hover:text-text"
                        >
                          <PriceIcon />
                        </IconButton>
                      ) : null}
                      {canUpdate ? (
                        <IconButton
                          onClick={() => onEdit(product.id)}
                          disabled={isToggling}
                          aria-label={t("products.edit")}
                          title={t("products.edit")}
                          className="h-10 w-10 rounded-xl border border-border text-text2 hover:bg-surface2 hover:text-text"
                        >
                          <EditIcon />
                        </IconButton>
                      ) : null}
                      {canUpdate ? (
                        <ToggleSwitch
                          checked={Boolean(product.isActive)}
                          onChange={(next) => onToggleActive(product, next)}
                          disabled={isToggling}
                        />
                      ) : null}
                    </div>

                    {isExpanded ? (
                      <div className="space-y-3 rounded-xl2 border border-border bg-surface2/30 p-3">
                        {variantsLoading ? (
                          <p className="text-sm text-muted">{t("products.variantsLoading")}</p>
                        ) : variantsError ? (
                          <p className="text-sm text-error">{variantsError}</p>
                        ) : variants.length === 0 ? (
                          <p className="text-sm text-muted">{t("products.noVariantsInFilter")}</p>
                        ) : (
                          variants.map((variant) => (
                            <div key={variant.id} className="rounded-xl border border-border bg-surface p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-text">
                                    {variant.name ?? t("products.noAttribute")}
                                  </p>
                                  <p className="mt-1 truncate text-xs text-muted">{variant.code ?? "-"}</p>
                                </div>
                                {canUpdate ? (
                                  <ToggleSwitch
                                    checked={Boolean(variant.isActive)}
                                    onChange={(next) => onToggleVariantActive(product.id, variant, next)}
                                    disabled={togglingVariantIds.includes(variant.id)}
                                  />
                                ) : null}
                              </div>
                              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-text2">
                                <div>
                                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("products.currencyLabel")}</dt>
                                  <dd className="mt-1">{variant.currency ?? product.currency}</dd>
                                </div>
                                <div>
                                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("products.salePrice")}</dt>
                                  <dd className="mt-1">{formatPrice(variant.lineTotal ?? variant.unitPrice)}</dd>
                                </div>
                              </dl>
                            </div>
                          ))
                        )}
                      </div>
                    ) : null}
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
