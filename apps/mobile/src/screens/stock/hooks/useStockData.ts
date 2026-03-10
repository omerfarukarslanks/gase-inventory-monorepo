import {
  getAllSuppliers,
  getStores,
  getTenantStockSummary,
  getVariantStockByStore,
  normalizeProducts,
  normalizeStoreItems,
  type InventoryProductStockItem,
  type InventoryStoreStockItem,
  type InventoryVariantStockItem,
  type Store,
  type Supplier,
} from "@gase/core";
import { useCallback, useEffect, useState } from "react";

type UseStockDataParams = {
  isActive: boolean;
  debouncedSearch: string;
  scopedStoreIds: string[] | undefined;
};

export function useStockData({ isActive, debouncedSearch, scopedStoreIds }: UseStockDataParams) {
  const [products, setProducts] = useState<InventoryProductStockItem[]>([]);
  const [variantStores, setVariantStores] = useState<Record<string, InventoryStoreStockItem[]>>({});
  const [stores, setStores] = useState<Store[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReferenceData = useCallback(async () => {
    try {
      const [storesResponse, suppliersResponse] = await Promise.all([
        getStores({ page: 1, limit: 100 }),
        getAllSuppliers({ isActive: true }),
      ]);
      setStores(storesResponse.data ?? []);
      setSuppliers(suppliersResponse);
    } catch {
      setStores([]);
      setSuppliers([]);
    }
  }, []);

  const fetchStock = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getTenantStockSummary({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
        storeIds: scopedStoreIds,
      });
      const normalized = normalizeProducts(response);
      setProducts(normalized);
      const nextVariantStores: Record<string, InventoryStoreStockItem[]> = {};
      normalized.forEach((product) => {
        product.variants?.forEach((variant) => {
          nextVariantStores[variant.productVariantId] = variant.stores ?? [];
        });
      });
      setVariantStores(nextVariantStores);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Stok ozetleri yuklenemedi.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, scopedStoreIds]);

  const resolveVariantStores = useCallback(async (variant: InventoryVariantStockItem) => {
    const existing = variantStores[variant.productVariantId] ?? [];
    if (existing.length) return existing;

    const response = await getVariantStockByStore(variant.productVariantId);
    const normalized = normalizeStoreItems(response);
    setVariantStores((current) => ({
      ...current,
      [variant.productVariantId]: normalized,
    }));
    return normalized;
  }, [variantStores]);

  useEffect(() => {
    if (!isActive) return;
    void loadReferenceData();
  }, [isActive, loadReferenceData]);

  useEffect(() => {
    if (!isActive) return;
    void fetchStock();
  }, [fetchStock, isActive]);

  return {
    products,
    variantStores,
    stores,
    suppliers,
    loading,
    error,
    setError,
    fetchStock,
    resolveVariantStores,
  };
}
