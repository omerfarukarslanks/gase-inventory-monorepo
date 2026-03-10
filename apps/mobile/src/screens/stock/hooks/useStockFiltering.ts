import { type InventoryProductStockItem, type InventoryVariantStockItem } from "@gase/core";
import { useMemo } from "react";

const LOW_STOCK_THRESHOLD = 50;

export type CriticalQueueItem = {
  product: InventoryProductStockItem;
  variant: InventoryVariantStockItem;
};

type UseStockFilteringParams = {
  products: InventoryProductStockItem[];
  priorityFilter: "all" | "low";
};

export function useStockFiltering({ products, priorityFilter }: UseStockFilteringParams) {
  const filteredProducts = useMemo(() => {
    if (priorityFilter === "all") return products;
    return products.filter((product) =>
      (product.variants ?? []).some(
        (variant) => Number(variant.totalQuantity ?? 0) <= LOW_STOCK_THRESHOLD,
      ),
    );
  }, [priorityFilter, products]);

  const visibleVariantCount = useMemo(
    () => filteredProducts.reduce((sum, product) => sum + (product.variants?.length ?? 0), 0),
    [filteredProducts],
  );

  const criticalQueue = useMemo<CriticalQueueItem[]>(
    () =>
      filteredProducts
        .flatMap((product) =>
          (product.variants ?? []).map((variant) => ({
            product,
            variant,
          })),
        )
        .filter((item) => Number(item.variant.totalQuantity ?? 0) <= LOW_STOCK_THRESHOLD)
        .sort(
          (left, right) =>
            Number(left.variant.totalQuantity ?? 0) - Number(right.variant.totalQuantity ?? 0),
        ),
    [filteredProducts],
  );

  const criticalQueuePreview = useMemo(() => criticalQueue.slice(0, 5), [criticalQueue]);

  return {
    filteredProducts,
    visibleVariantCount,
    criticalQueue,
    criticalQueuePreview,
    LOW_STOCK_THRESHOLD,
  };
}
