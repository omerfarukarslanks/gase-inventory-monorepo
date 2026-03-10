import { getProducts, type Product } from "@gase/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";

type StatusFilter = "all" | "true" | "false";

export const statusOptions = [
  { label: "Tum", value: "all" as const },
  { label: "Aktif", value: "true" as const },
  { label: "Pasif", value: "false" as const },
];

export function useProductList({ isActive }: { isActive: boolean }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const debouncedSearch = useDebouncedValue(search, 350);

  const activeFilterLabel = useMemo(() => {
    if (statusFilter === "true") return "Aktif urunler";
    if (statusFilter === "false") return "Pasif urunler";
    return "Tum urunler";
  }, [statusFilter]);

  const hasFilters = Boolean(search.trim() || statusFilter !== "all");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getProducts({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
        isActive: statusFilter === "all" ? "all" : statusFilter === "true",
      });
      setProducts(response.data ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Urunler yuklenemedi.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    if (!isActive) return;
    void fetchProducts();
  }, [fetchProducts, isActive]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    products,
    loading,
    error,
    debouncedSearch,
    activeFilterLabel,
    hasFilters,
    fetchProducts,
    resetFilters,
  };
}
