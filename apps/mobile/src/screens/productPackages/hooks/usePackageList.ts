import {
  getProductPackages,
  type ProductPackage,
} from "@gase/core";
import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { trackEvent } from "@/src/lib/analytics";

export type StatusFilter = "all" | "true" | "false";

export const statusOptions = [
  { label: "Tum", value: "all" as const },
  { label: "Aktif", value: "true" as const },
  { label: "Pasif", value: "false" as const },
];

type UsePackageListParams = {
  isActive: boolean;
};

export function usePackageList({ isActive }: UsePackageListParams) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [packages, setPackages] = useState<ProductPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const debouncedSearch = useDebouncedValue(search, 350);

  const activeFilterLabel =
    statusFilter === "true"
      ? "Aktif paketler"
      : statusFilter === "false"
        ? "Pasif paketler"
        : "Tum paketler";

  const hasFilters = Boolean(search.trim() || statusFilter !== "all");

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getProductPackages({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
        isActive: statusFilter === "all" ? "all" : statusFilter === "true",
        sortBy: "createdAt",
        sortOrder: "DESC",
      });
      setPackages(response.data ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Paketler yuklenemedi.");
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    if (!isActive) return;
    void fetchPackages();
  }, [fetchPackages, isActive]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  const resetFiltersWithTracking = () => {
    trackEvent("empty_state_action_clicked", {
      screen: "product_packages",
      target: "reset_filters",
    });
    resetFilters();
  };

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    packages,
    loading,
    error,
    setError,
    activeFilterLabel,
    hasFilters,
    fetchPackages,
    resetFilters,
    resetFiltersWithTracking,
  };
}
