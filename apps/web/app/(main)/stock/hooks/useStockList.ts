"use client";
import { useCallback, useEffect, useState } from "react";
import {
  getTenantStockSummary,
  getVariantStockByStore,
  type InventoryProductStockItem,
  type InventoryStoreStockItem,
  type InventoryVariantStockItem,
} from "@/lib/inventory";
import { useDebounceStr } from "@/hooks/useDebounce";
import { usePagination } from "@/hooks/usePagination";
import { normalizeStoreItems, normalizeProducts, getPaginationValue } from "@/lib/normalize";

type Options = {
  scopeReady: boolean;
  isStoreScopedUser: boolean;
  scopedStoreId: string;
  t: (key: string) => string;
};

export function useStockList({ scopeReady, isStoreScopedUser, scopedStoreId, t }: Options) {
  const [products, setProducts] = useState<InventoryProductStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [storeFilterIds, setStoreFilterIds] = useState<string[]>([]);
  const debouncedSearch = useDebounceStr(searchTerm, 400);

  const pagination = usePagination(10);
  const { page, limit, applyMeta, resetPage } = pagination;

  const [variantStoresById, setVariantStoresById] = useState<Record<string, InventoryStoreStockItem[]>>({});
  const [variantStoresLoadingById, setVariantStoresLoadingById] = useState<Record<string, boolean>>({});

  const applyStoreScope = useCallback(
    (items: InventoryStoreStockItem[]) => {
      if (!isStoreScopedUser) return items;
      return items.filter((item) => item.storeId === scopedStoreId);
    },
    [isStoreScopedUser, scopedStoreId],
  );

  const fetchTenantSummary = useCallback(async () => {
    if (!scopeReady) return;
    setLoading(true);
    setError("");
    try {
      const effectiveStoreIds =
        !isStoreScopedUser && storeFilterIds.length > 0
          ? storeFilterIds
          : undefined;

      const res = await getTenantStockSummary({
        page,
        limit,
        storeIds: effectiveStoreIds,
        search: debouncedSearch || undefined,
      });
      setProducts(normalizeProducts(res));
      applyMeta({
        total: getPaginationValue(res, "total"),
        totalPages: getPaginationValue(res, "totalPages"),
      });
    } catch {
      setProducts([]);
      setError(t("stock.loadError"));
    } finally {
      setLoading(false);
    }
  }, [page, limit, storeFilterIds, debouncedSearch, isStoreScopedUser, scopeReady, applyMeta, t]);

  const fetchVariantStores = useCallback(
    async (variantId: string) => {
      if (!variantId || variantStoresLoadingById[variantId]) return;
      setVariantStoresLoadingById((prev) => ({ ...prev, [variantId]: true }));
      try {
        const res = await getVariantStockByStore(variantId);
        const scopedItems = applyStoreScope(normalizeStoreItems(res));
        setVariantStoresById((prev) => ({
          ...prev,
          [variantId]: scopedItems,
        }));
      } catch {
        setVariantStoresById((prev) => ({ ...prev, [variantId]: [] }));
      } finally {
        setVariantStoresLoadingById((prev) => ({ ...prev, [variantId]: false }));
      }
    },
    [variantStoresLoadingById, applyStoreScope],
  );

  const getVariantStores = useCallback(
    (variant: InventoryVariantStockItem) => {
      const cached = variantStoresById[variant.productVariantId];
      if (cached && cached.length > 0) return cached;
      return variant.stores ?? [];
    },
    [variantStoresById],
  );

  const resolveVariantStores = async (
    variantId: string,
    fallback: InventoryStoreStockItem[],
  ): Promise<InventoryStoreStockItem[]> => {
    if (fallback.length > 0) return fallback;
    try {
      const res = await getVariantStockByStore(variantId);
      const normalized = applyStoreScope(normalizeStoreItems(res));
      setVariantStoresById((prev) => ({ ...prev, [variantId]: normalized }));
      return normalized;
    } catch {
      return [];
    }
  };

  useEffect(() => {
    fetchTenantSummary();
  }, [fetchTenantSummary]);

  useEffect(() => {
    resetPage();
  }, [storeFilterIds, debouncedSearch, resetPage]);

  return {
    products,
    loading,
    error,
    setError,
    success,
    setSuccess,
    page,
    setPage: pagination.setPage,
    limit,
    setLimit: pagination.onPageSizeChange,
    totalPages: pagination.totalPages,
    total: pagination.total,
    onPageChange: pagination.onPageChange,
    onPageSizeChange: pagination.onPageSizeChange,
    searchTerm,
    setSearchTerm,
    storeFilterIds,
    setStoreFilterIds,
    debouncedSearch,
    variantStoresById,
    variantStoresLoadingById,
    fetchTenantSummary,
    fetchVariantStores,
    getVariantStores,
    resolveVariantStores,
    applyStoreScope,
    refetch: fetchTenantSummary,
  };
}
