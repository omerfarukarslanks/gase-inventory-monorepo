"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  createSupplier,
  getSupplierById,
  getSuppliers,
  updateSupplier,
  type Supplier,
  type SuppliersListMeta,
} from "@/lib/suppliers";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon, SearchIcon } from "@/components/ui/icons/TableIcons";
import { cn } from "@/lib/cn";
import { useDebounceStr } from "@/hooks/useDebounce";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getVisiblePages } from "@/lib/pagination";
import { STATUS_FILTER_OPTIONS, parseIsActiveFilter } from "@/components/products/types";

type SupplierForm = {
  name: string;
  surname: string;
  address: string;
  phoneNumber: string;
  email: string;
};

const EMPTY_FORM: SupplierForm = {
  name: "",
  surname: "",
  address: "",
  phoneNumber: "",
  email: "",
};

export default function SuppliersPage() {
  const accessChecked = useAdminGuard();
  const isMobile = !useMediaQuery();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [meta, setMeta] = useState<SuppliersListMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | "all">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingSupplierIds, setTogglingSupplierIds] = useState<string[]>([]);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editingSupplierIsActive, setEditingSupplierIsActive] = useState(true);
  const [loadingSupplierDetail, setLoadingSupplierDetail] = useState(false);
  const [formError, setFormError] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [form, setForm] = useState<SupplierForm>(EMPTY_FORM);

  const debouncedSearch = useDebounceStr(searchTerm, 500);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const fetchSuppliers = useCallback(async () => {
    if (!accessChecked) return;
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
      setError("Tedarikciler yuklenemedi. Lutfen tekrar deneyin.");
      setSuppliers([]);
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
    fetchSuppliers();
  }, [fetchSuppliers]);

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
    setEmailError("");
    setForm(EMPTY_FORM);
    setEditingSupplierId(null);
    setEditingSupplierIsActive(true);
    setDrawerOpen(true);
  };

  const onCloseDrawer = () => {
    if (submitting || loadingSupplierDetail) return;
    setNameError("");
    setEmailError("");
    setDrawerOpen(false);
  };

  const onFormChange = (field: keyof SupplierForm, value: string) => {
    if (field === "name" && nameError) {
      setNameError("");
    }
    if (field === "email" && emailError) {
      setEmailError("");
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onEditSupplier = async (id: string) => {
    setFormError("");
    setNameError("");
    setEmailError("");
    setLoadingSupplierDetail(true);
    try {
      const detail = await getSupplierById(id);
      setForm({
        name: detail.name ?? "",
        surname: detail.surname ?? "",
        address: detail.address ?? "",
        phoneNumber: detail.phoneNumber ?? "",
        email: detail.email ?? "",
      });
      setEditingSupplierId(detail.id);
      setEditingSupplierIsActive(detail.isActive ?? true);
      setDrawerOpen(true);
    } catch {
      setFormError("Tedarikci detayi yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoadingSupplierDetail(false);
    }
  };

  const onSubmitSupplier = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setNameError("");
    setEmailError("");

    if (!form.name.trim()) {
      setNameError("Isim alani zorunludur.");
      return;
    }

    if (form.name.trim().length < 2) {
      setNameError("Isim en az 2 karakter olmalidir.");
      return;
    }

    if (form.email.trim() && !emailPattern.test(form.email.trim())) {
      setEmailError("Gecerli bir e-posta girin.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingSupplierId) {
        await updateSupplier(editingSupplierId, {
          name: form.name.trim(),
          surname: form.surname.trim() || undefined,
          address: form.address.trim() || undefined,
          phoneNumber: form.phoneNumber.trim() || undefined,
          email: form.email.trim() || undefined,
          isActive: editingSupplierIsActive,
        });
      } else {
        await createSupplier({
          name: form.name.trim(),
          surname: form.surname.trim() || undefined,
          address: form.address.trim() || undefined,
          phoneNumber: form.phoneNumber.trim() || undefined,
          email: form.email.trim() || undefined,
        });
      }

      setDrawerOpen(false);
      setForm(EMPTY_FORM);
      setNameError("");
      setEmailError("");
      setEditingSupplierId(null);
      setEditingSupplierIsActive(true);
      await fetchSuppliers();
    } catch {
      setFormError(
        editingSupplierId
          ? "Tedarikci guncellenemedi. Lutfen tekrar deneyin."
          : "Tedarikci olusturulamadi. Lutfen tekrar deneyin.",
      );
    } finally {
      setSubmitting(false);
    }
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
      setError("Tedarikci durumu guncellenemedi. Lutfen tekrar deneyin.");
    } finally {
      setTogglingSupplierIds((prev) => prev.filter((id) => id !== supplier.id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Tedarikciler</h1>
          <p className="text-sm text-muted">Tedarikci listesi ve yonetimi</p>
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
            label="Yeni Tedarikci"
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
              inputAriaLabel="Tedarikci durum filtresi"
              toggleAriaLabel="Tedarikci durum listesini ac"
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
          <div className="p-6 text-sm text-muted">Tedarikciler yukleniyor...</div>
        ) : error ? (
          <div className="p-6">
            <p className="text-sm text-error">{error}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px]">
                <thead className="border-b border-border bg-surface2/70">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">Isim</th>
                    <th className="px-4 py-3">Soyisim</th>
                    <th className="px-4 py-3">Telefon</th>
                    <th className="px-4 py-3">E-posta</th>
                    <th className="px-4 py-3">Adres</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3 text-right">Islemler</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted">
                        Kayit bulunamadi.
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((supplier) => (
                      <tr
                        key={supplier.id}
                        className="group border-b border-border last:border-b-0 hover:bg-surface2/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-text">{supplier.name}</td>
                        <td className="px-4 py-3 text-sm text-text2">{supplier.surname ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-text2">{supplier.phoneNumber ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-text2">{supplier.email ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-text2">{supplier.address ?? "-"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              supplier.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                            }`}
                          >
                            {supplier.isActive ? "Aktif" : "Pasif"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditSupplier(supplier.id)}
                              disabled={togglingSupplierIds.includes(supplier.id)}
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
                              aria-label="Tedarikci duzenle"
                              title="Duzenle"
                            >
                              <EditIcon />
                            </button>
                            <ToggleSwitch
                              checked={Boolean(supplier.isActive)}
                              onChange={(next) => onToggleSupplierActive(supplier, next)}
                              disabled={togglingSupplierIds.includes(supplier.id)}
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
                  <label htmlFor="supplierPageSize" className="text-xs text-muted">
                    Satir:
                  </label>
                  <select
                    id="supplierPageSize"
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
        title={editingSupplierId ? "Tedarikci Guncelle" : "Yeni Tedarikci"}
        description={editingSupplierId ? "Tedarikci bilgilerini guncelleyin" : "Sadece isim alani zorunludur"}
        closeDisabled={submitting || loadingSupplierDetail}
        className={cn(isMobile && "!max-w-none")}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              label="Iptal"
              type="button"
              onClick={onCloseDrawer}
              disabled={submitting || loadingSupplierDetail}
              variant="secondary"
            />
            <Button
              label={submitting ? (editingSupplierId ? "Guncelleniyor..." : "Olusturuluyor...") : "Kaydet"}
              type="submit"
              form="supplier-form"
              disabled={submitting || loadingSupplierDetail}
              variant="primarySolid"
            />
          </div>
        }
      >
        <form id="supplier-form" onSubmit={onSubmitSupplier} className="space-y-4 p-5">
          {loadingSupplierDetail ? (
            <div className="text-sm text-muted">Tedarikci detayi yukleniyor...</div>
          ) : (
            <>
              <InputField
                label="Isim *"
                type="text"
                value={form.name}
                onChange={(value) => onFormChange("name", value)}
                placeholder="Tekstil A.S."
                error={nameError}
              />

              <InputField
                label="Soyisim"
                type="text"
                value={form.surname}
                onChange={(value) => onFormChange("surname", value)}
                placeholder="Yilmaz"
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Adres</label>
                <textarea
                  value={form.address}
                  onChange={(e) => onFormChange("address", e.target.value)}
                  className="min-h-[92px] w-full rounded-xl2 border border-border bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
                  placeholder="Bagcilar, Istanbul"
                />
              </div>

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
                placeholder="info@tekstil.com"
                error={emailError}
              />

              {editingSupplierId && (
                <div className="flex items-center justify-between rounded-xl border border-border bg-surface2/40 px-3 py-2.5">
                  <span className="text-xs font-semibold text-muted">Aktif</span>
                  <ToggleSwitch
                    checked={editingSupplierIsActive}
                    onChange={setEditingSupplierIsActive}
                    disabled={submitting || loadingSupplierDetail}
                  />
                </div>
              )}

              {formError && <p className="text-sm text-error">{formError}</p>}
            </>
          )}
        </form>
      </Drawer>
    </div>
  );
}
