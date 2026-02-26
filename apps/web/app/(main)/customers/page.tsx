"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
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
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon, PriceIcon, SearchIcon } from "@/components/ui/icons/TableIcons";
import { cn } from "@/lib/cn";
import { useDebounceStr } from "@/hooks/useDebounce";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getVisiblePages } from "@/lib/pagination";
import { STATUS_FILTER_OPTIONS, parseIsActiveFilter } from "@/components/products/types";
import { formatPrice } from "@/lib/format";

type CustomerForm = {
  name: string;
  surname: string;
  address: string;
  country: string;
  city: string;
  district: string;
  phoneNumber: string;
  email: string;
  gender: string;
  birthDate: string;
};

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const EMPTY_FORM: CustomerForm = {
  name: "",
  surname: "",
  address: "",
  country: "",
  city: "",
  district: "",
  phoneNumber: "",
  email: "",
  gender: "",
  birthDate: "",
};

function formatCount(value: number | string | null | undefined): string {
  if (value == null) return "-";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "-";
  return numeric.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
}

export default function CustomersPage() {
  const accessChecked = useAdminGuard();
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
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const fetchCustomers = useCallback(async () => {
    if (!accessChecked) return;
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
      setError("Musteriler yuklenemedi. Lutfen tekrar deneyin.");
      setCustomers([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [accessChecked, currentPage, pageSize, debouncedSearch, statusFilter]);

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
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const goPrev = () => {
    if (!canGoPrev || loading) return;
    setCurrentPage((prev) => prev - 1);
  };

  const goNext = () => {
    if (!canGoNext || loading) return;
    setCurrentPage((prev) => prev + 1);
  };

  const onChangePageSize = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (loading || page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  const pageItems = getVisiblePages(currentPage, totalPages);

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
      setFormError("Musteri detayi yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoadingCustomerDetail(false);
    }
  };

  const onSubmitCustomer = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

    if (form.email.trim() && !emailPattern.test(form.email.trim())) {
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
      setFormError(
        editingCustomerId
          ? "Musteri guncellenemedi. Lutfen tekrar deneyin."
          : "Musteri olusturulamadi. Lutfen tekrar deneyin.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const clearAdvancedFilters = () => {
    setStatusFilter("all");
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
      setError("Musteri durumu guncellenemedi. Lutfen tekrar deneyin.");
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
      setCustomerBalanceError("Cari bakiye bilgisi yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setCustomerBalanceLoading(false);
    }
  }, []);

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

  const balanceNumeric = Number(customerBalance?.balance ?? 0);
  const balanceToneClass =
    Number.isNaN(balanceNumeric) || balanceNumeric === 0
      ? "text-text"
      : balanceNumeric > 0
        ? "text-error"
        : "text-primary";
  const balanceStatusLabel =
    Number.isNaN(balanceNumeric) || balanceNumeric === 0
      ? "Bakiye Kapali"
      : balanceNumeric > 0
        ? "Musteri Borclu"
        : "Musteri Alacakli";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Musteriler</h1>
          <p className="text-sm text-muted">Musteri listesi ve yonetimi</p>
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
          <div className="relative w-full lg:w-64">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button
            label={showAdvancedFilters ? "Detayli Filtreyi Gizle" : "Detayli Filtre"}
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            variant="secondary"
            className="w-full px-2.5 py-2 lg:w-auto lg:px-3"
          />
          <Button
            label="Yeni Musteri"
            onClick={onOpenDrawer}
            variant="primarySoft"
            className="w-full px-2.5 py-2 lg:w-auto lg:px-3"
          />
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="grid gap-3 rounded-xl2 border border-border bg-surface p-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Durum</label>
            <SearchableDropdown
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter === "all" ? "all" : String(statusFilter)}
              onChange={(value) => setStatusFilter(parseIsActiveFilter(value))}
              placeholder="Tum Durumlar"
              showEmptyOption={false}
              allowClear={false}
              inputAriaLabel="Musteri durum filtresi"
              toggleAriaLabel="Musteri durum listesini ac"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <Button
              label="Filtreleri Temizle"
              onClick={clearAdvancedFilters}
              variant="secondary"
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
        {loading ? (
          <div className="p-6 text-sm text-muted">Musteriler yukleniyor...</div>
        ) : error ? (
          <div className="p-6">
            <p className="text-sm text-error">{error}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="border-b border-border bg-surface2/70">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">Isim</th>
                    <th className="px-4 py-3">Soyisim</th>
                    <th className="px-4 py-3">Telefon</th>
                    <th className="px-4 py-3">E-posta</th>
                    <th className="px-4 py-3">Sehir / Ilce</th>
                    <th className="px-4 py-3">Cinsiyet</th>
                    <th className="px-4 py-3">Dogum Tarihi</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="sticky right-0 z-20 bg-surface2/70 px-4 py-3 text-right">Islemler</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted">
                        Kayit bulunamadi.
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="group border-b border-border last:border-b-0 hover:bg-surface2/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-text">{customer.name}</td>
                        <td className="px-4 py-3 text-sm text-text2">{customer.surname}</td>
                        <td className="px-4 py-3 text-sm text-text2">{customer.phoneNumber ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-text2">{customer.email ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-text2">
                          {[customer.city, customer.district].filter(Boolean).join(" / ") || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-text2">{customer.gender ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-text2">
                          {customer.birthDate ? String(customer.birthDate).slice(0, 10) : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              customer.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                            }`}
                          >
                            {customer.isActive ? "Aktif" : "Pasif"}
                          </span>
                        </td>
                        <td className="sticky right-0 z-10 bg-surface px-4 py-3 text-right group-hover:bg-surface2/50">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => void onOpenBalanceDrawer(customer)}
                              disabled={togglingCustomerIds.includes(customer.id)}
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
                              aria-label="Musteri cari bakiyesi"
                              title="Cari Bakiye"
                            >
                              <PriceIcon />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditCustomer(customer.id)}
                              disabled={togglingCustomerIds.includes(customer.id)}
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
                              aria-label="Musteri duzenle"
                              title="Duzenle"
                            >
                              <EditIcon />
                            </button>
                            <ToggleSwitch
                              checked={Boolean(customer.isActive)}
                              onChange={(next) => onToggleCustomerActive(customer, next)}
                              disabled={togglingCustomerIds.includes(customer.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {meta && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted">
                <div className="flex items-center gap-4">
                  <span>Toplam: {meta.total}</span>
                  <span>
                    Sayfa: {currentPage}/{totalPages}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="customerPageSize" className="text-xs text-muted">
                    Satir:
                  </label>
                  <select
                    id="customerPageSize"
                    value={pageSize}
                    onChange={(e) => onChangePageSize(Number(e.target.value))}
                    className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>

                  <Button
                    label="Onceki"
                    onClick={goPrev}
                    disabled={!canGoPrev || loading}
                    variant="pagination"
                  />

                  {pageItems.map((item, idx) =>
                    item === -1 ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={`page-${item}`}
                        label={String(item)}
                        onClick={() => goToPage(item)}
                        disabled={loading}
                        variant={item === currentPage ? "paginationActive" : "pagination"}
                      />
                    ),
                  )}

                  <Button
                    label="Sonraki"
                    onClick={goNext}
                    disabled={!canGoNext || loading}
                    variant="pagination"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <Drawer
        open={drawerOpen}
        onClose={onCloseDrawer}
        side="right"
        title={editingCustomerId ? "Musteri Guncelle" : "Yeni Musteri"}
        description={editingCustomerId ? "Musteri bilgilerini guncelleyin" : "Isim ve soyisim zorunludur"}
        closeDisabled={submitting || loadingCustomerDetail}
        className={cn(isMobile && "!max-w-none")}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              label="Iptal"
              type="button"
              onClick={onCloseDrawer}
              disabled={submitting || loadingCustomerDetail}
              variant="secondary"
            />
            <Button
              label={submitting ? (editingCustomerId ? "Guncelleniyor..." : "Olusturuluyor...") : "Kaydet"}
              type="submit"
              form="customer-form"
              disabled={submitting || loadingCustomerDetail}
              variant="primarySolid"
            />
          </div>
        }
      >
        <form id="customer-form" onSubmit={onSubmitCustomer} className="space-y-4 p-5">
          {loadingCustomerDetail ? (
            <div className="text-sm text-muted">Musteri detayi yukleniyor...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InputField
                  label="Isim *"
                  type="text"
                  value={form.name}
                  onChange={(value) => onFormChange("name", value)}
                  placeholder="Ahmet"
                  error={nameError}
                />
                <InputField
                  label="Soyisim *"
                  type="text"
                  value={form.surname}
                  onChange={(value) => onFormChange("surname", value)}
                  placeholder="Yilmaz"
                  error={surnameError}
                />
              </div>

              <InputField
                label="Adres"
                type="text"
                value={form.address}
                onChange={(value) => onFormChange("address", value)}
                placeholder="Ataturk Cad. No:1"
              />

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <InputField
                  label="Ulke"
                  type="text"
                  value={form.country}
                  onChange={(value) => onFormChange("country", value)}
                  placeholder="Turkiye"
                />
                <InputField
                  label="Sehir"
                  type="text"
                  value={form.city}
                  onChange={(value) => onFormChange("city", value)}
                  placeholder="Istanbul"
                />
                <InputField
                  label="Ilce"
                  type="text"
                  value={form.district}
                  onChange={(value) => onFormChange("district", value)}
                  placeholder="Kadikoy"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InputField
                  label="Telefon"
                  type="text"
                  value={form.phoneNumber}
                  onChange={(value) => onFormChange("phoneNumber", value)}
                  placeholder="+905321234567"
                />
                <InputField
                  label="E-posta"
                  type="email"
                  value={form.email}
                  onChange={(value) => onFormChange("email", value)}
                  placeholder="ahmet@example.com"
                  error={emailError}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted">Cinsiyet</label>
                  <SearchableDropdown
                    options={GENDER_OPTIONS}
                    value={form.gender}
                    onChange={(value) => onFormChange("gender", value)}
                    placeholder="Cinsiyet secin"
                    emptyOptionLabel="Cinsiyet secin"
                    inputAriaLabel="Cinsiyet secimi"
                    clearAriaLabel="Cinsiyet secimini temizle"
                    toggleAriaLabel="Cinsiyet listesini ac"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted">Dogum Tarihi</label>
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => onFormChange("birthDate", e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {editingCustomerId && (
                <div className="flex items-center justify-between rounded-xl border border-border bg-surface2/40 px-3 py-2.5">
                  <span className="text-xs font-semibold text-muted">Aktif</span>
                  <ToggleSwitch
                    checked={editingCustomerIsActive}
                    onChange={setEditingCustomerIsActive}
                    disabled={submitting || loadingCustomerDetail}
                  />
                </div>
              )}

              {formError && <p className="text-sm text-error">{formError}</p>}
            </>
          )}
        </form>
      </Drawer>

      <Drawer
        open={balanceDrawerOpen}
        onClose={onCloseBalanceDrawer}
        side="right"
        title="Musteri Cari Bakiyesi"
        description={customerBalance?.customerName || selectedBalanceCustomerName}
        closeDisabled={customerBalanceLoading}
        className={cn(isMobile && "!max-w-none")}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              label={customerBalanceLoading ? "Yukleniyor..." : "Yenile"}
              type="button"
              onClick={() => {
                if (!selectedBalanceCustomerId) return;
                void loadCustomerBalance(selectedBalanceCustomerId);
              }}
              disabled={!selectedBalanceCustomerId}
              variant="secondary"
            />
            <Button
              label="Kapat"
              type="button"
              onClick={onCloseBalanceDrawer}
              disabled={customerBalanceLoading}
              variant="primarySolid"
            />
          </div>
        }
      >
        <div className="space-y-4 p-5">
          {customerBalanceLoading ? (
            <div className="text-sm text-muted">Cari bakiye bilgisi yukleniyor...</div>
          ) : customerBalanceError ? (
            <p className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
              {customerBalanceError}
            </p>
          ) : customerBalance ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface2/50 p-3">
                  <p className="text-xs font-semibold text-muted">Toplam Satis</p>
                  <p className="mt-1 text-lg font-semibold text-text">
                    {formatCount(customerBalance.totalSalesCount)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface2/50 p-3">
                  <p className="text-xs font-semibold text-muted">Toplam Satis Tutari</p>
                  <p className="mt-1 text-lg font-semibold text-text">
                    {formatPrice(customerBalance.totalSaleAmount)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface2/50 p-3">
                  <p className="text-xs font-semibold text-muted">Toplam Tahsilat</p>
                  <p className="mt-1 text-lg font-semibold text-text">
                    {formatPrice(customerBalance.totalPaidAmount)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface2/50 p-3">
                  <p className="text-xs font-semibold text-muted">Toplam Iade</p>
                  <p className="mt-1 text-lg font-semibold text-text">
                    {formatPrice(customerBalance.totalReturnAmount)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl2 border border-primary/30 bg-primary/10 p-4">
                <p className="text-xs font-semibold text-muted">Cari Durum</p>
                <p className={cn("mt-1 text-2xl font-bold", balanceToneClass)}>
                  {formatPrice(customerBalance.balance)}
                </p>
                <p className="mt-1 text-xs font-semibold text-muted">{balanceStatusLabel}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">Cari bakiye bilgisi bulunamadi.</p>
          )}
        </div>
      </Drawer>
    </div>
  );
}
