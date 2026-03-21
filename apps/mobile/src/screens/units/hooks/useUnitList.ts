import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getUnitById, getUnitsPaginated, type Unit } from "@gase/core";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";

type Options = {
  isActive?: boolean;
};

export function useUnitList({ isActive = true }: Options = {}) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "passive">("all");
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 350);
  const mountedRef = useRef(false);

  const activeFilterLabel = useMemo(() => {
    if (statusFilter === "active") return "Aktif";
    if (statusFilter === "passive") return "Pasif";
    return "Tüm durumlar";
  }, [statusFilter]);

  const hasFilters = search.trim().length > 0 || statusFilter !== "all";

  const isActiveParam = useMemo((): boolean | "all" => {
    if (statusFilter === "active") return true;
    if (statusFilter === "passive") return false;
    return "all";
  }, [statusFilter]);

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getUnitsPaginated({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
        isActive: isActiveParam,
        sortBy: "name",
        sortOrder: "ASC",
      });
      setUnits(res.data);
    } catch {
      setError("Birimler yüklenemedi.");
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, isActiveParam]);

  useEffect(() => {
    if (!isActive) return;
    mountedRef.current = true;
    void fetchUnits();
  }, [isActive, fetchUnits]);

  const openUnit = useCallback(async (id: string) => {
    setDetailLoading(true);
    setSelectedUnit(null);
    try {
      const detail = await getUnitById(id);
      setSelectedUnit(detail);
    } catch {
      setError("Birim detayı yüklenemedi.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const resetFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
  }, []);

  return {
    units,
    loading,
    error,
    setError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    selectedUnit,
    setSelectedUnit,
    detailLoading,
    activeFilterLabel,
    hasFilters,
    fetchUnits,
    openUnit,
    resetFilters,
  };
}
