"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import TablePagination from "@/components/ui/TablePagination";
import {
  createCustomer,
  getCustomerById,
  getCustomerBalance,
  getCustomers,
  updateCustomer,
  type Customer,
  type CustomerBalance,
  type CustomersListMeta,
  type CustomerGender,
} from "@/lib/customers";
import { useDebounceStr } from "@/hooks/useDebounce";
import { usePermissions } from "@/hooks/usePermissions";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useLang } from "@/context/LangContext";
import CustomersFilters from "@/components/customers/CustomersFilters";
import CustomersTable from "@/components/customers/CustomersTable";
import CustomerDrawer from "@/components/customers/CustomerDrawer";
import CustomerBalanceDrawer from "@/components/customers/CustomerBalanceDrawer";
import { EMPTY_FORM, type CustomerForm } from "@/components/customers/types";
import { isValidEmail } from "@gase/core";

export default function CustomersPage() {
  const { t } = useLang();
  const { can } = usePermissions();
  const canCreate = can("CUSTOMER_CREATE");
  const canUpdate = can("CUSTOMER_UPDATE");
  const isMobile = !useMediaQuery();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<CustomersListMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | "all">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingCustomerIds, setTogglingCustomerIds] = useState<string[]>([]);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editingCustomerIsActive, setEditingCustomerIsActive] = useState(true);
  const [loadingCustomerDetail, setLoadingCustomerDetail] = useState(false);
  const [formError, setFormError] = useState("");
  const [nameError, setNameError] = useState("");
  const [surnameError, setSurnameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [balanceDrawerOpen, setBalanceDrawerOpen] = useState(false);
  const [selectedBalanceCustomerId, setSelectedBalanceCustomerId] = useState<string | null>(null);
  const [selectedBalanceCustomerName, setSelectedBalanceCustomerName] = useState("");
  const [customerBalance, setCustomerBalance] = useState<CustomerBalance | null>(null);
  const [customerBalanceLoading, setCustomerBalanceLoading] = useState(false);
  const [customerBalanceError, setCustomerBalanceError] = useState("");

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

  const totalPages = meta?.totalPages ?? 1;

  const onChangePageSize = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  };

  const onOpenDrawer = () => {
    setFormError("");
    setNameError("");
    setSurnameError("");
    setEmailError("");
    setForm(EMPTY_FORM);
    setEditingCustomerId(null);
    setEditingCustomerIsActive(true);
    setDrawerOpen(true);
  };

  const onCloseDrawer = () => {
    if (submitting || loadingCustomerDetail) return;
    setNameError("");
    setSurnameError("");
    setEmailError("");
    setDrawerOpen(false);
  };

  const onFormChange = (field: keyof CustomerForm, value: string) => {
    if (field === "name" && nameError) setNameError("");
    if (field === "surname" && surnameError) setSurnameError("");
    if (field === "email" && emailError) setEmailError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onEditCustomer = async (id: string) => {
    setFormError("");
    setNameError("");
    setSurnameError("");
    setEmailError("");
    setLoadingCustomerDetail(true);
    try {
      const detail = await getCustomerById(id);
      setForm({
        name: detail.name ?? "",
        surname: detail.surname ?? "",
        address: detail.address ?? "",
        country: detail.country ?? "",
        city: detail.city ?? "",
        district: detail.district ?? "",
        phoneNumber: detail.phoneNumber ?? "",
        email: detail.email ?? "",
        gender: detail.gender ?? "",
        birthDate: detail.birthDate ? String(detail.birthDate).slice(0, 10) : "",
      });
      setEditingCustomerId(detail.id);
      setEditingCustomerIsActive(detail.isActive ?? true);
      setDrawerOpen(true);
    } catch {
      setFormError(t("common.loadError"));
    } finally {
      setLoadingCustomerDetail(false);
    }
  };

  const onSubmitCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setNameError("");
    setSurnameError("");
    setEmailError("");

    if (!form.name.trim()) {
      setNameError("Isim alani zorunludur.");
      return;
    }

    if (!form.surname.trim()) {
      setSurnameError("Soyisim alani zorunludur.");
      return;
    }

    if (form.email.trim() && !isValidEmail(form.email)) {
      setEmailError("Gecerli bir e-posta girin.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingCustomerId) {
        await updateCustomer(editingCustomerId, {
          name: form.name.trim(),
          surname: form.surname.trim(),
          address: form.address.trim() || undefined,
          country: form.country.trim() || undefined,
          city: form.city.trim() || undefined,
          district: form.district.trim() || undefined,
          phoneNumber: form.phoneNumber.trim() || undefined,
          email: form.email.trim() || undefined,
          gender: (form.gender || undefined) as CustomerGender | undefined,
          birthDate: form.birthDate || undefined,
          isActive: editingCustomerIsActive,
        });
      } else {
        await createCustomer({
          name: form.name.trim(),
          surname: form.surname.trim(),
          address: form.address.trim() || undefined,
          country: form.country.trim() || undefined,
          city: form.city.trim() || undefined,
          district: form.district.trim() || undefined,
          phoneNumber: form.phoneNumber.trim() || undefined,
          email: form.email.trim() || undefined,
          gender: (form.gender || undefined) as CustomerGender | undefined,
          birthDate: form.birthDate || undefined,
        });
      }

      setDrawerOpen(false);
      setForm(EMPTY_FORM);
      setNameError("");
      setSurnameError("");
      setEmailError("");
      setEditingCustomerId(null);
      setEditingCustomerIsActive(true);
      await fetchCustomers();
    } catch {
      setFormError(t("common.loadError"));
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div className="space-y-4">
      <CustomersFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvancedFilters={() => setShowAdvancedFilters((prev) => !prev)}
        canCreate={canCreate}
        onCreate={onOpenDrawer}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onClearFilters={() => setStatusFilter("all")}
      />

      <CustomersTable
        loading={loading}
        error={error}
        customers={customers}
        togglingCustomerIds={togglingCustomerIds}
        canUpdate={canUpdate}
        onOpenBalanceDrawer={(customer) => void onOpenBalanceDrawer(customer)}
        onEditCustomer={(id) => void onEditCustomer(id)}
        onToggleCustomerActive={(customer, next) => void onToggleCustomerActive(customer, next)}
        footer={
          meta ? (
            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              total={meta.total}
              pageSize={pageSize}
              pageSizeId="customers-page-size"
              loading={loading}
              onPageChange={setCurrentPage}
              onPageSizeChange={onChangePageSize}
            />
          ) : null
        }
      />

      <CustomerDrawer
        open={drawerOpen}
        editingCustomerId={editingCustomerId}
        submitting={submitting}
        loadingCustomerDetail={loadingCustomerDetail}
        isMobile={isMobile}
        form={form}
        formError={formError}
        nameError={nameError}
        surnameError={surnameError}
        emailError={emailError}
        editingCustomerIsActive={editingCustomerIsActive}
        onClose={onCloseDrawer}
        onSubmit={onSubmitCustomer}
        onFormChange={onFormChange}
        onEditingCustomerIsActiveChange={setEditingCustomerIsActive}
      />

      <CustomerBalanceDrawer
        open={balanceDrawerOpen}
        onClose={onCloseBalanceDrawer}
        isMobile={isMobile}
        customerBalanceLoading={customerBalanceLoading}
        customerBalanceError={customerBalanceError}
        customerBalance={customerBalance}
        selectedBalanceCustomerId={selectedBalanceCustomerId}
        selectedBalanceCustomerName={selectedBalanceCustomerName}
        onRefresh={() => {
          if (!selectedBalanceCustomerId) return;
          void loadCustomerBalance(selectedBalanceCustomerId);
        }}
      />
    </div>
  );
}
