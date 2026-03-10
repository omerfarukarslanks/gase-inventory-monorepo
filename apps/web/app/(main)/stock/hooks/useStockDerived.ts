"use client";
import { useMemo } from "react";
import type { Store } from "@/lib/stores";
import type { Currency } from "@/lib/products";
import type {
  InventoryProductStockItem,
  InventoryStoreStockItem,
} from "@/lib/inventory";
import type { AdjustTarget } from "@/components/stock/AdjustDrawer";

type Options = {
  stores: Store[];
  adjustTarget: AdjustTarget | null;
  variantStoresById: Record<string, InventoryStoreStockItem[]>;
  products: InventoryProductStockItem[];
  debouncedSearch: string;
};

export function useStockDerived({
  stores,
  adjustTarget,
  variantStoresById,
  products,
  debouncedSearch,
}: Options) {
  const storeOptions = useMemo(
    () => stores.map((s) => ({ value: s.id, label: s.name })),
    [stores],
  );

  const adjustFormVariant = useMemo(
    () =>
      adjustTarget
        ? [
            {
              id: adjustTarget.productVariantId,
              name: adjustTarget.variantName,
              code: adjustTarget.variantName,
            },
          ]
        : [],
    [adjustTarget],
  );

  const adjustFormCurrency = useMemo((): Currency => {
    if (!adjustTarget) return "TRY";
    const storesForVariant = variantStoresById[adjustTarget.productVariantId] ?? [];
    const currency = storesForVariant[0]?.currency;
    if (currency === "TRY" || currency === "USD" || currency === "EUR") return currency;
    return "TRY";
  }, [adjustTarget, variantStoresById]);

  const filteredProducts = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) => {
      if (product.productName.toLowerCase().includes(q)) return true;
      return (product.variants ?? []).some((variant) => {
        if (variant.variantName.toLowerCase().includes(q)) return true;
        if ((variant.variantCode ?? "").toLowerCase().includes(q)) return true;
        return (variantStoresById[variant.productVariantId] ?? variant.stores ?? []).some(
          (store) => store.storeName.toLowerCase().includes(q),
        );
      });
    });
  }, [products, debouncedSearch, variantStoresById]);

  return {
    storeOptions,
    adjustFormVariant,
    adjustFormCurrency,
    filteredProducts,
  };
}
