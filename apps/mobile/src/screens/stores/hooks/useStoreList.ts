import { getStores, getStoreById, type Store } from "@gase/core";
import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";

export type StatusFilter = "all" | "true" | "false";

type UseStoreListParams = {
  isActive: boolean;
};

export function useStoreList({ isActive }: UseStoreListParams) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getStores({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
        isActive: statusFilter === "all" ? "all" : statusFilter === "true",
      });
      setStores(response.data ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Magazalar yuklenemedi.");
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    if (!isActive) return;
    void fetchStores();
  }, [fetchStores, isActive]);

  const openStore = useCallback(async (storeId: string) => {
    setDetailLoading(true);
    setError("");
    try {
      const detail = await getStoreById(storeId);
      setSelectedStore(detail);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Magaza detayi getirilemedi.");
      setSelectedStore(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    stores,
    loading,
    error,
    setError,
    selectedStore,
    setSelectedStore,
    detailLoading,
    debouncedSearch,
    fetchStores,
    openStore,
    resetFilters,
  };
}
