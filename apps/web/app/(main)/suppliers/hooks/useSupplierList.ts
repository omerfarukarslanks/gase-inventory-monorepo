"use client";

import { useCallback, useEffect, useState } from "react";
import { useDebounceStr } from "@/hooks/useDebounce";
import {
  getSuppliers,
  updateSupplier,
  type Supplier,
  type SuppliersListMeta,
} from "@/lib/suppliers";

type Options = {
  t: (key: string) => string;
};

export function useSupplierList({ t }: Options) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [meta, setMeta] = useState<SuppliersListMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | "all">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingSupplierIds, setTogglingSupplierIds] = useState<string[]>([]);

  const debouncedSearch = useDebounceStr(searchTerm, 500);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getSuppliers({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
        isActive: statusFilter,
      });
      setSuppliers(res.data);
      setMeta(res.meta);
    } catch {
      setError(t("common.loadError"));
      setSuppliers([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, pageSize, statusFilter, t]);

  useEffect(() => {
    if (debouncedSearch !== "") {
      setCurrentPage(1);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    void fetchSuppliers();
  }, [fetchSuppliers]);

  const totalPages = meta?.totalPages ?? 1;

  const onChangePageSize = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  };

  const clearAdvancedFilters = () => {
    setStatusFilter("all");
  };

  const onToggleSupplierActive = async (supplier: Supplier, next: boolean) => {
    setTogglingSupplierIds((prev) => [...prev, supplier.id]);

    try {
      await updateSupplier(supplier.id, {
        name: supplier.name,
        surname: supplier.surname ?? undefined,
        address: supplier.address ?? undefined,
        phoneNumber: supplier.phoneNumber ?? undefined,
        email: supplier.email ?? undefined,
        isActive: next,
      });
      await fetchSuppliers();
    } catch {
      setError(t("common.loadError"));
    } finally {
      setTogglingSupplierIds((prev) => prev.filter((id) => id !== supplier.id));
    }
  };

  return {
    /* state */
    suppliers,
    meta,
    currentPage,
    setCurrentPage,
    pageSize,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    showAdvancedFilters,
    setShowAdvancedFilters,
    loading,
    error,
    togglingSupplierIds,
    /* derived */
    totalPages,
    /* handlers */
    fetchSuppliers,
    onChangePageSize,
    clearAdvancedFilters,
    onToggleSupplierActive,
  };
}
