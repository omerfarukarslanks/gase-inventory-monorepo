import { getCustomerBalance, getCustomers, type Customer, type CustomerBalance } from "@gase/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";

type StatusFilter = "all" | "true" | "false";

export function useCustomerList({ isActive }: { isActive: boolean }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [balance, setBalance] = useState<CustomerBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 350);

  const activeFilterLabel = useMemo(() => {
    if (statusFilter === "true") return "Aktif musteriler";
    if (statusFilter === "false") return "Pasif musteriler";
    return "Tum musteriler";
  }, [statusFilter]);

  const hasCustomerFilters = Boolean(search.trim() || statusFilter !== "all");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getCustomers({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
        isActive:
          statusFilter === "all"
            ? "all"
            : statusFilter === "true",
      });
      setCustomers(response.data ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Musteriler yuklenemedi.");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    if (!isActive) return;
    void fetchCustomers();
  }, [fetchCustomers, isActive]);

  const openCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setBalance(null);
    setBalanceLoading(true);
    try {
      const nextBalance = await getCustomerBalance(customer.id);
      setBalance(nextBalance);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Musteri bakiyesi getirilemedi.");
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    customers,
    loading,
    error,
    setError,
    selectedCustomer,
    setSelectedCustomer,
    balance,
    setBalance,
    balanceLoading,
    debouncedSearch,
    activeFilterLabel,
    hasCustomerFilters,
    fetchCustomers,
    openCustomer,
    resetFilters,
  };
}
