import { getStores, getUser, getUsers, type Store, type User } from "@gase/core";
import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";

export type StatusFilter = "all" | "true" | "false";

type UseUserListParams = {
  isActive: boolean;
};

export function useUserList({ isActive }: UseUserListParams) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 350);

  const fetchUsersList = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getUsers({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
        isActive: statusFilter === "all" ? "all" : statusFilter === "true",
        sortBy: "createdAt",
        sortOrder: "DESC",
      });
      setUsers(response.data ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Kullanicilar yuklenemedi.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  const fetchStoresList = useCallback(async () => {
    try {
      const response = await getStores({
        page: 1,
        limit: 50,
        isActive: true,
        sortBy: "name",
        sortOrder: "ASC",
      });
      setStores(response.data ?? []);
    } catch {
      setStores([]);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    void fetchUsersList();
  }, [fetchUsersList, isActive]);

  useEffect(() => {
    if (!isActive) return;
    void fetchStoresList();
  }, [fetchStoresList, isActive]);

  const openUser = useCallback(async (userId: string) => {
    setDetailLoading(true);
    setError("");
    try {
      const detail = await getUser(userId);
      setSelectedUser(detail);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Kullanici detayi getirilemedi.");
      setSelectedUser(null);
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
    users,
    stores,
    loading,
    error,
    setError,
    selectedUser,
    setSelectedUser,
    detailLoading,
    debouncedSearch,
    fetchUsersList,
    fetchStoresList,
    openUser,
    resetFilters,
  };
}
