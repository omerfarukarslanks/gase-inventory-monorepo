import { getSuppliers, getSupplierById, type Supplier } from "@gase/core";
import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";

export type StatusFilter = "all" | "true" | "false";

type UseSupplierListParams = {
  isActive: boolean;
};

export function useSupplierList({ isActive }: UseSupplierListParams) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getSuppliers({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
        isActive: statusFilter === "all" ? "all" : statusFilter === "true",
        sortBy: "createdAt",
        sortOrder: "DESC",
      });
      setSuppliers(response.data ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Tedarikciler yuklenemedi.");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    if (!isActive) return;
    void fetchSuppliers();
  }, [fetchSuppliers, isActive]);

  const openSupplier = useCallback(async (supplierId: string) => {
    setDetailLoading(true);
    setError("");
    try {
      const detail = await getSupplierById(supplierId);
      setSelectedSupplier(detail);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Tedarikci detayi getirilemedi.",
      );
      setSelectedSupplier(null);
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
    suppliers,
    loading,
    error,
    setError,
    selectedSupplier,
    setSelectedSupplier,
    detailLoading,
    debouncedSearch,
    fetchSuppliers,
    openSupplier,
    resetFilters,
  };
}
