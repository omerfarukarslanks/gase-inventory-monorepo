"use client";

import { useCallback, useEffect, useState } from "react";
import { useDebounceStr } from "@/hooks/useDebounce";
import {
  getStores,
  updateStore,
  type Store,
  type StoresListMeta,
} from "@/lib/stores";

type Options = {
  t: (key: string) => string;
};

export function useStoreList({ t }: Options) {
  /* ── List state ── */
  const [stores, setStores] = useState<Store[]>([]);
  const [meta, setMeta] = useState<StoresListMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | "all">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ── Toggle state ── */
  const [togglingStoreIds, setTogglingStoreIds] = useState<string[]>([]);

  const debouncedSearch = useDebounceStr(searchTerm, 500);

  /* ── Fetch ── */

  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError(t("common.sessionNotFound"));
        setStores([]);
        setMeta(null);
        return;
      }

      const res = await getStores({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
        isActive: statusFilter,
        token,
      });

      setStores(res.data);
      setMeta(res.meta);
    } catch {
      setError(t("stores.loadError"));
      setStores([]);
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
    void fetchStores();
  }, [fetchStores]);

  /* ── Pagination ── */

  const totalPages = meta?.totalPages ?? 1;

  const onChangePageSize = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  };

  /* ── Filters ── */

  const clearAdvancedFilters = () => {
    setStatusFilter("all");
  };

  /* ── Toggle active ── */

  const onToggleStoreActive = async (store: Store, next: boolean) => {
    setTogglingStoreIds((prev) => [...prev, store.id]);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError(t("common.sessionNotFound"));
        return;
      }

      await updateStore(
        store.id,
        {
          name: store.name,
          code: store.code || undefined,
          address: store.address || undefined,
          slug: store.slug || undefined,
          logo: store.logo || undefined,
          description: store.description || undefined,
          isActive: next,
        },
        token,
      );
      await fetchStores();
    } catch {
      setError(t("stores.toggleError"));
    } finally {
      setTogglingStoreIds((prev) => prev.filter((id) => id !== store.id));
    }
  };

  return {
    /* state */
    stores,
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
    /* toggle */
    togglingStoreIds,
    /* derived */
    totalPages,
    /* functions */
    fetchStores,
    onChangePageSize,
    clearAdvancedFilters,
    onToggleStoreActive,
  };
}
