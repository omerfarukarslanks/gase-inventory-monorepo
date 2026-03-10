import {
  getAllProductCategories,
  getProductCategoriesPaginated,
  getProductCategoryById,
  type ProductCategory,
} from "@gase/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";

type StatusFilter = "all" | "true" | "false";

type UseCategoryListParams = {
  isActive: boolean;
};

export function useCategoryList({ isActive }: UseCategoryListParams) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [allCategories, setAllCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);

  const activeFilterLabel = useMemo(() => {
    if (statusFilter === "true") return "Aktif kategoriler";
    if (statusFilter === "false") return "Pasif kategoriler";
    return "Tum kategoriler";
  }, [statusFilter]);

  const hasFilters = Boolean(search.trim() || statusFilter !== "all");

  const parentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allCategories.forEach((category) => {
      map.set(category.id, category.name);
    });
    return map;
  }, [allCategories]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getProductCategoriesPaginated({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
        isActive: statusFilter === "all" ? "all" : statusFilter === "true",
        sortBy: "createdAt",
        sortOrder: "DESC",
      });
      setCategories(response.data ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Kategoriler yuklenemedi.");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  const fetchAllCategories = useCallback(async () => {
    try {
      const response = await getAllProductCategories({
        isActive: "all",
        sortBy: "name",
        sortOrder: "ASC",
      });
      setAllCategories(response ?? []);
    } catch {
      setAllCategories([]);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    void fetchCategories();
  }, [fetchCategories, isActive]);

  useEffect(() => {
    if (!isActive) return;
    void fetchAllCategories();
  }, [fetchAllCategories, isActive]);

  const openCategory = useCallback(async (categoryId: string) => {
    setDetailLoading(true);
    setError("");
    try {
      const detail = await getProductCategoryById(categoryId);
      setSelectedCategory(detail);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Kategori detayi getirilemedi.",
      );
      setSelectedCategory(null);
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
    categories,
    allCategories,
    loading,
    error,
    setError,
    selectedCategory,
    setSelectedCategory,
    detailLoading,
    activeFilterLabel,
    hasFilters,
    parentNameMap,
    fetchCategories,
    fetchAllCategories,
    openCategory,
    resetFilters,
  };
}
