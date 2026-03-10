import { useCallback, useEffect, useState } from "react";
import {
  getCustomers,
  updateCustomer,
  type Customer,
  type CustomersListMeta,
} from "@/lib/customers";
import { useDebounceStr } from "@/hooks/useDebounce";

type Options = {
  t: (key: string) => string;
};

export function useCustomerList({ t }: Options) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<CustomersListMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | "all">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingCustomerIds, setTogglingCustomerIds] = useState<string[]>([]);

  const debouncedSearch = useDebounceStr(searchTerm, 500);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getCustomers({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
        isActive: statusFilter,
      });
      setCustomers(res.data);
      setMeta(res.meta);
    } catch {
      setError(t("common.loadError"));
      setCustomers([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, statusFilter, t]);

  useEffect(() => {
    if (debouncedSearch !== "") {
      setCurrentPage(1);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const onChangePageSize = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  };

  const onToggleCustomerActive = async (customer: Customer, next: boolean) => {
    setTogglingCustomerIds((prev) => [...prev, customer.id]);
    try {
      await updateCustomer(customer.id, {
        name: customer.name,
        surname: customer.surname,
        address: customer.address ?? undefined,
        country: customer.country ?? undefined,
        city: customer.city ?? undefined,
        district: customer.district ?? undefined,
        phoneNumber: customer.phoneNumber ?? undefined,
        email: customer.email ?? undefined,
        gender: customer.gender ?? undefined,
        birthDate: customer.birthDate ? String(customer.birthDate).slice(0, 10) : undefined,
        isActive: next,
      });
      await fetchCustomers();
    } catch {
      setError(t("common.loadError"));
    } finally {
      setTogglingCustomerIds((prev) => prev.filter((id) => id !== customer.id));
    }
  };

  return {
    customers,
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
    togglingCustomerIds,
    fetchCustomers,
    onChangePageSize,
    onToggleCustomerActive,
  };
}
