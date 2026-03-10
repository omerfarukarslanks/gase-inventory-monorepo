import {
  getAttributeById,
  getAttributesPaginated,
  type Attribute,
  type AttributeDetail,
} from "@gase/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";

type StatusFilter = "all" | "true" | "false";

type UseAttributeListParams = {
  isActive: boolean;
};

export function useAttributeList({ isActive }: UseAttributeListParams) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAttribute, setSelectedAttribute] = useState<AttributeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);

  const activeFilterLabel = useMemo(() => {
    if (statusFilter === "true") return "Aktif ozellikler";
    if (statusFilter === "false") return "Pasif ozellikler";
    return "Tum ozellikler";
  }, [statusFilter]);

  const hasFilters = Boolean(search.trim() || statusFilter !== "all");

  const fetchAttributes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAttributesPaginated({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
        sortOrder: "DESC",
        sortBy: "createdAt",
        isActive: statusFilter === "all" ? "all" : statusFilter === "true",
      });
      setAttributes(response.data ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Ozellikler yuklenemedi.");
      setAttributes([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    if (!isActive) return;
    void fetchAttributes();
  }, [fetchAttributes, isActive]);

  const openAttribute = useCallback(async (attributeId: string) => {
    setDetailLoading(true);
    setError("");
    try {
      const detail = await getAttributeById(attributeId);
      setSelectedAttribute(detail);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Ozellik detayi getirilemedi.");
      setSelectedAttribute(null);
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
    attributes,
    loading,
    error,
    setError,
    selectedAttribute,
    setSelectedAttribute,
    detailLoading,
    activeFilterLabel,
    hasFilters,
    fetchAttributes,
    openAttribute,
    resetFilters,
  };
}
