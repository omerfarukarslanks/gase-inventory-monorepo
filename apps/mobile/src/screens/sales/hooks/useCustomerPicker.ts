import { getCustomers, type Customer } from "@gase/core";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import type { SalesRecentCustomer } from "@/src/lib/salesRecents";

type UseCustomerPickerOptions = {
  onSelect: (customer: Customer | SalesRecentCustomer) => void;
  recentCustomers: SalesRecentCustomer[];
};

export function useCustomerPicker({ onSelect, recentCustomers }: UseCustomerPickerOptions) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Customer[]>([]);

  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    getCustomers({ page: 1, limit: 30, search: debouncedSearch || undefined })
      .then((response) => {
        if (active) setOptions(response.data ?? []);
      })
      .catch(() => {
        if (active) setOptions([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, debouncedSearch]);

  const select = (customer: Customer | SalesRecentCustomer) => {
    onSelect(customer);
    setOpen(false);
  };

  return { open, setOpen, search, setSearch, loading, options, select, recentCustomers };
}
