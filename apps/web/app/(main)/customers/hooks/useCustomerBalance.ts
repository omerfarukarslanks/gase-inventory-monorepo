import { useCallback, useState } from "react";
import {
  getCustomerBalance,
  type Customer,
  type CustomerBalance,
} from "@/lib/customers";

type Options = {
  t: (key: string) => string;
};

export function useCustomerBalance({ t }: Options) {
  const [balanceDrawerOpen, setBalanceDrawerOpen] = useState(false);
  const [selectedBalanceCustomerId, setSelectedBalanceCustomerId] = useState<string | null>(null);
  const [selectedBalanceCustomerName, setSelectedBalanceCustomerName] = useState("");
  const [customerBalance, setCustomerBalance] = useState<CustomerBalance | null>(null);
  const [customerBalanceLoading, setCustomerBalanceLoading] = useState(false);
  const [customerBalanceError, setCustomerBalanceError] = useState("");

  const loadCustomerBalance = useCallback(async (customerId: string) => {
    setCustomerBalanceLoading(true);
    setCustomerBalanceError("");
    try {
      const balance = await getCustomerBalance(customerId);
      setCustomerBalance(balance);
    } catch {
      setCustomerBalance(null);
      setCustomerBalanceError(t("common.loadError"));
    } finally {
      setCustomerBalanceLoading(false);
    }
  }, [t]);

  const onOpenBalanceDrawer = async (customer: Customer) => {
    const fullName = [customer.name, customer.surname].filter(Boolean).join(" ").trim();
    setSelectedBalanceCustomerId(customer.id);
    setSelectedBalanceCustomerName(fullName || "Musteri");
    setCustomerBalance(null);
    setCustomerBalanceError("");
    setBalanceDrawerOpen(true);
    await loadCustomerBalance(customer.id);
  };

  const onCloseBalanceDrawer = () => {
    if (customerBalanceLoading) return;
    setBalanceDrawerOpen(false);
  };

  return {
    balanceDrawerOpen,
    selectedBalanceCustomerId,
    selectedBalanceCustomerName,
    customerBalance,
    customerBalanceLoading,
    customerBalanceError,
    loadCustomerBalance,
    onOpenBalanceDrawer,
    onCloseBalanceDrawer,
  };
}
