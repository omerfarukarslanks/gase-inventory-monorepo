"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getUnitsPaginated,
  updateUnit,
  type Unit,
  type UnitsPaginatedMeta,
} from "@gase/core";
import { useDebounceStr } from "@/hooks/useDebounce";

type Options = {
  t: (key: string) => string;
};

export function useUnitList({ t }: Options) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [meta, setMeta] = useState<UnitsPaginatedMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | "all">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const debouncedSearch = useDebounceStr(searchTerm, 300);
  const [togglingUnitIds, setTogglingUnitIds] = useState<string[]>([]);

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getUnitsPaginated({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
        sortOrder: "DESC",
        sortBy: "createdAt",
        isActive: statusFilter,
      });
      setUnits(res.data);
      setMeta(res.meta);
    } catch {
      setUnits([]);
      setMeta(null);
      setError(t("units.loadError"));
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, statusFilter, t]);

  useEffect(() => {
    void fetchUnits();
  }, [fetchUnits]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, pageSize]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const toggleUnitStatus = async (unit: Unit, next: boolean) => {
    if (unit.isDefault && !next) {
      setError(t("units.cannotDeactivateDefault"));
      return;
    }
    setTogglingUnitIds((prev) => [...prev, unit.id]);
    setUnits((prev) =>
      prev.map((item) => (item.id === unit.id ? { ...item, isActive: next } : item)),
    );
    try {
      await updateUnit(unit.id, { isActive: next });
      setSuccess(t("units.updateSuccess"));
      await fetchUnits();
    } catch {
      setError(t("units.toggleError"));
      setUnits((prev) =>
        prev.map((item) => (item.id === unit.id ? { ...item, isActive: unit.isActive } : item)),
      );
    } finally {
      setTogglingUnitIds((prev) => prev.filter((id) => id !== unit.id));
    }
  };

  const totalPages = meta?.totalPages ?? 1;

  const handlePageChange = (nextPage: number) => {
    if (loading || nextPage < 1 || nextPage > totalPages || nextPage === currentPage) return;
    setCurrentPage(nextPage);
  };

  const onChangePageSize = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  return {
    loading,
    error,
    success,
    units,
    meta,
    currentPage,
    pageSize,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    setSuccess,
    showAdvancedFilters,
    setShowAdvancedFilters,
    togglingUnitIds,
    totalPages,
    fetchUnits,
    toggleUnitStatus,
    handlePageChange,
    onChangePageSize,
  };
}
