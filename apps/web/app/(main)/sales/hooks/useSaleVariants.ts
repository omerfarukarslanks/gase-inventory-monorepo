"use client";
import { useCallback, useEffect, useState } from "react";
import { getTenantStockSummary } from "@/lib/inventory";
import { getPaginationValue, normalizeProducts } from "@/lib/normalize";
import { getProductPackages } from "@/lib/product-packages";
import type { VariantPreset, VariantStorePreset } from "@/components/sales/types";
import type { Currency } from "@/lib/products";
import { toNumberOrNull } from "@/lib/format";

type Options = {
  scopeReady: boolean;
  isWholesaleStoreType: boolean;
  t: (key: string) => string;
};

function toFiniteNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toCurrency(value: unknown): Currency {
  if (value === "TRY" || value === "USD" || value === "EUR") return value;
  return "TRY";
}

function resolvePackageItemStockText(item: unknown): string {
  if (!item || typeof item !== "object") return "-";
  const node = item as Record<string, unknown>;
  const variantNode =
    node.productVariant && typeof node.productVariant === "object"
      ? (node.productVariant as Record<string, unknown>)
      : null;

  const candidates: unknown[] = [
    node.stock,
    node.stockQuantity,
    node.availableStock,
    node.totalStock,
    node.currentStock,
    node.onHand,
    node.availableQuantity,
    node.totalQuantity,
    node.currentQuantity,
    variantNode?.stockQuantity,
    variantNode?.availableStock,
    variantNode?.totalStock,
    variantNode?.currentStock,
    variantNode?.availableQuantity,
    variantNode?.totalQuantity,
    variantNode?.currentQuantity,
    variantNode?.onHand,
  ];

  for (const candidate of candidates) {
    const numeric = toFiniteNumber(candidate);
    if (numeric != null) return String(numeric);
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }

  return "-";
}

export function useSaleVariants({ scopeReady, isWholesaleStoreType, t }: Options) {
  const [variantOptions, setVariantOptions] = useState<
    Array<{ value: string; label: string; secondaryLabel?: string }>
  >([]);
  const [variantPresetsById, setVariantPresetsById] = useState<Record<string, VariantPreset>>({});
  const [loadingVariants, setLoadingVariants] = useState(true);
  const [loadingMoreVariants, setLoadingMoreVariants] = useState(false);
  const [variantPage, setVariantPage] = useState(0);
  const [variantHasMore, setVariantHasMore] = useState(true);

  const fetchVariantPage = useCallback(
    async (nextPage: number, replace: boolean) => {
      if (replace) {
        setLoadingVariants(true);
      } else {
        setLoadingMoreVariants(true);
      }

      try {
        if (isWholesaleStoreType) {
          const res = await getProductPackages({
            page: nextPage,
            limit: 100,
            isActive: true,
          });
          const packages = res.data ?? [];

          const optionMap = new Map<string, { value: string; label: string; secondaryLabel?: string }>();
          const presetMap: Record<string, VariantPreset> = {};

          packages.forEach((pkg) => {
            const stockInfo = (pkg.items ?? [])
              .map((item) => {
                const variantName = item.productVariant?.name ?? "Varyant";
                const variantCode = item.productVariant?.code ?? "-";
                const stockText = resolvePackageItemStockText(item);
                return `${variantName} (${variantCode}) Stok: ${stockText}`;
              })
              .join(" • ");

            optionMap.set(pkg.id, {
              value: pkg.id,
              label: pkg.name,
              secondaryLabel: stockInfo || t("sales.variantNoInfo"),
            });

            if (!presetMap[pkg.id]) {
              presetMap[pkg.id] = {
                currency: toCurrency(pkg.defaultCurrency),
                unitPrice:
                  toFiniteNumber(pkg.defaultSalePrice) ??
                  toFiniteNumber(pkg.defaultLineTotal) ??
                  null,
                discountPercent: toFiniteNumber(pkg.defaultDiscountPercent),
                discountAmount: toFiniteNumber(pkg.defaultDiscountAmount),
                taxPercent: toFiniteNumber(pkg.defaultTaxPercent),
                taxAmount: toFiniteNumber(pkg.defaultTaxAmount),
                lineTotal: toFiniteNumber(pkg.defaultLineTotal),
                stores: [],
              };
            }
          });

          setVariantPresetsById((prev) =>
            replace ? presetMap : { ...prev, ...presetMap },
          );

          setVariantOptions((prev) => {
            const map = new Map<string, { value: string; label: string; secondaryLabel?: string }>();
            (replace ? [] : prev).forEach((item) => map.set(item.value, item));
            optionMap.forEach((item, key) => {
              if (!map.has(key)) map.set(key, item);
            });
            return Array.from(map.values());
          });

          const totalPages = res.meta?.totalPages ?? 1;
          setVariantHasMore(nextPage < totalPages);
          setVariantPage(nextPage);
        } else {
          const res = await getTenantStockSummary({ page: nextPage, limit: 100 });
          const nextProducts = normalizeProducts(res);
          const nextOptions = nextProducts.flatMap((product) =>
            (product.variants ?? []).map((variant) => ({
              value: variant.productVariantId,
              label: product.productName,
              secondaryLabel: `${variant.variantName} | Stok: ${variant.totalQuantity}`,
            })),
          );

          setVariantPresetsById((prev) => {
            const nextMap: Record<string, VariantPreset> = replace ? {} : { ...prev };
            nextProducts.forEach((product) => {
              (product.variants ?? []).forEach((variant) => {
                const storePresets: VariantStorePreset[] = (variant.stores ?? []).map((store) => ({
                  storeId: store.storeId,
                  currency:
                    store.currency === "TRY" || store.currency === "USD" || store.currency === "EUR"
                      ? store.currency
                      : "TRY",
                  unitPrice: store.unitPrice ?? store.salePrice ?? null,
                  discountPercent: store.discountPercent ?? null,
                  discountAmount: store.discountAmount ?? null,
                  taxPercent: store.taxPercent ?? null,
                  taxAmount: store.taxAmount ?? null,
                  lineTotal: store.lineTotal ?? null,
                }));

                const first = storePresets[0];
                nextMap[variant.productVariantId] = {
                  currency: first?.currency ?? "TRY",
                  unitPrice: first?.unitPrice ?? null,
                  discountPercent: first?.discountPercent ?? null,
                  discountAmount: first?.discountAmount ?? null,
                  taxPercent: first?.taxPercent ?? null,
                  taxAmount: first?.taxAmount ?? null,
                  lineTotal: first?.lineTotal ?? null,
                  stores: storePresets,
                };
              });
            });
            return nextMap;
          });

          setVariantOptions((prev) => {
            const map = new Map<string, { value: string; label: string; secondaryLabel?: string }>();
            (replace ? [] : prev).forEach((item) => map.set(item.value, item));
            nextOptions.forEach((item) => {
              if (item.value && !map.has(item.value)) map.set(item.value, item);
            });
            return Array.from(map.values());
          });

          const totalPages = getPaginationValue(res, "totalPages");
          if (totalPages > 0) {
            setVariantHasMore(nextPage < totalPages);
          } else {
            setVariantHasMore(nextOptions.length >= 100);
          }
          setVariantPage(nextPage);
        }
      } catch {
        if (replace) {
          setVariantOptions([]);
          setVariantPresetsById({});
        }
        setVariantHasMore(false);
      } finally {
        setLoadingVariants(false);
        setLoadingMoreVariants(false);
      }
    },
    [isWholesaleStoreType, t],
  );

  useEffect(() => {
    if (!scopeReady) return;
    void fetchVariantPage(1, true);
  }, [fetchVariantPage, scopeReady]);

  const loadMoreVariants = useCallback(() => {
    if (loadingVariants || loadingMoreVariants || !variantHasMore) return;
    void fetchVariantPage(variantPage + 1, false);
  }, [loadingVariants, loadingMoreVariants, variantHasMore, variantPage, fetchVariantPage]);

  return {
    variantOptions,
    variantPresetsById,
    loadingVariants,
    loadingMoreVariants,
    variantPage,
    variantHasMore,
    fetchVariantPage,
    loadMoreVariants,
  };
}

// Re-export toNumberOrNull usage suppression — keep import used
void toNumberOrNull;
