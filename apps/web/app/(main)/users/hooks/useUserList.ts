"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebounceStr } from "@/hooks/useDebounce";
import { useStores } from "@/hooks/useStores";
import { getUsers, updateUser, type Meta, type User } from "@/lib/users";

type Options = {
  t?: (key: string) => string;
  isTenantOnly?: boolean;
};

export function useUserList({ isTenantOnly }: Options = {}) {
  const allStores = useStores();
  const stores = isTenantOnly ? allStores : [];

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | "all">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC" | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [togglingUserIds, setTogglingUserIds] = useState<string[]>([]);

  const debouncedSearch = useDebounceStr(searchTerm, 500);

  const storeFilterOptions =  useMemo(
    () => stores.filter((store) => store.isActive).map((store) => ({ value: store.id, label: store.name })),
    [stores],
  );

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers({
        page: currentPage,
        limit,
        search: debouncedSearch,
        storeId: storeFilter || undefined,
        isActive: statusFilter,
        sortBy,
        sortOrder,
      });
      setUsers(res.data);
      setMeta(res.meta);
    } catch {
      setUsers([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, limit, sortBy, sortOrder, statusFilter, storeFilter]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (debouncedSearch !== "") {
      setCurrentPage(1);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [storeFilter, statusFilter]);

  const onToggleUserActive = async (user: User, next: boolean) => {
    setTogglingUserIds((prev) => [...prev, user.id]);
    try {
      await updateUser(user.id, {
        name: user.name,
        surname: user.surname,
        role: user.roleName,
        storeIds: user.store ? [user.store.id] : [],
        isActive: next,
      });
      await fetchUsers();
    } catch {
      alert("Kullanıcı durumu güncellenemedi.");
    } finally {
      setTogglingUserIds((prev) => prev.filter((id) => id !== user.id));
    }
  };

  const clearAdvancedFilters = () => {
    setStoreFilter("");
    setStatusFilter("all");
    setSortBy(undefined);
    setSortOrder(undefined);
  };

  const onSortByChange = (value: string) => {
    if (!value) {
      setSortBy(undefined);
      setSortOrder(undefined);
      return;
    }
    setSortBy(value);
    setSortOrder((prev) => prev ?? "ASC");
  };

  const onSortOrderChange = (value: string) => {
    if (value === "ASC" || value === "DESC") {
      setSortOrder(value);
      return;
    }
    setSortOrder(undefined);
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
      return;
    }
    setSortBy(key);
    setSortOrder("ASC");
  };

  const totalPages = meta ? meta.totalPages : 1;

  const handlePageChange = (newPage: number) => {
    if (loading || newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
  };

  const onChangePageSize = (newPageSize: number) => {
    setLimit(newPageSize);
    setCurrentPage(1);
  };

  return {
    /* state */
    users,
    meta,
    currentPage,
    limit,
    searchTerm,
    setSearchTerm,
    storeFilter,
    setStoreFilter,
    statusFilter,
    setStatusFilter,
    showAdvancedFilters,
    setShowAdvancedFilters,
    sortBy,
    sortOrder,
    loading,
    togglingUserIds,
    /* derived */
    totalPages,
    storeFilterOptions,
    /* functions */
    fetchUsers,
    onToggleUserActive,
    clearAdvancedFilters,
    onSortByChange,
    onSortOrderChange,
    handleSort,
    handlePageChange,
    onChangePageSize,
    setSortBy,
    setSortOrder,
  };
}
