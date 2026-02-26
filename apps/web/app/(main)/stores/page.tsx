"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  createStore,
  getStoreById,
  getStores,
  updateStore,
  type Store,
  type StoreType,
  type StoresListMeta,
} from "@/lib/stores";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import InputField from "@/components/ui/InputField";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import SearchInput from "@/components/ui/SearchInput";
import TablePagination from "@/components/ui/TablePagination";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import { cn } from "@/lib/cn";
import { useDebounceStr } from "@/hooks/useDebounce";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { Currency } from "@/lib/products";
import { CURRENCY_OPTIONS, STATUS_FILTER_OPTIONS, parseIsActiveFilter } from "@/components/products/types";

type StoreForm = {
  name: string;
  storeType: StoreType;
  currency: Currency;
  code: string;
  address: string;
  slug: string;
  logo: string;
  description: string;
};

const EMPTY_FORM: StoreForm = {
  name: "",
  storeType: "RETAIL",
  currency: "TRY",
  code: "",
  address: "",
  slug: "",
  logo: "",
  description: "",
};

export default function StoresPage() {
  const accessChecked = useAdminGuard();
  const isMobile = !useMediaQuery();

  const [stores, setStores] = useState<Store[]>([]);
  const [meta, setMeta] = useState<StoresListMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | "all">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingStoreIds, setTogglingStoreIds] = useState<string[]>([]);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editingStoreIsActive, setEditingStoreIsActive] = useState(true);
  const [loadingStoreDetail, setLoadingStoreDetail] = useState(false);
  const [formError, setFormError] = useState("");
  const [nameError, setNameError] = useState("");
  const [form, setForm] = useState<StoreForm>(EMPTY_FORM);
  const debouncedSearch = useDebounceStr(searchTerm, 500);
  const STORE_TYPE_OPTIONS = [
    { value: "RETAIL", label: "Perakende" },
    { value: "WHOLESALE", label: "Toptan" },
  ] as const;
  const normalizeCurrency = (value: string): Currency =>
    value === "USD" || value === "EUR" ? value : "TRY";
  const normalizeStoreType = (value: string): StoreType =>
    value === "WHOLESALE" ? "WHOLESALE" : "RETAIL";

  const fetchStores = useCallback(async () => {
    if (!accessChecked) return;
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Session not found. Please sign in again.");
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
      setError("Stores could not be loaded. Please try again.");
      setStores([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, statusFilter, accessChecked]);

  useEffect(() => {
    if (debouncedSearch !== "") {
      setCurrentPage(1);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const totalPages = meta?.totalPages ?? 1;

  const onChangePageSize = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  };

  const onOpenDrawer = () => {
    setFormError("");
    setNameError("");
    setForm(EMPTY_FORM);
    setEditingStoreId(null);
    setEditingStoreIsActive(true);
    setDrawerOpen(true);
  };

  const onCloseDrawer = () => {
    if (submitting || loadingStoreDetail) return;
    setNameError("");
    setDrawerOpen(false);
  };

  const onFormChange = <K extends keyof StoreForm>(field: K, value: StoreForm[K]) => {
    if (field === "name" && nameError) {
      setNameError("");
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onEditStore = async (id: string) => {
    setFormError("");
    setNameError("");
    setLoadingStoreDetail(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setFormError("Session not found. Please sign in again.");
        return;
      }

      const detail = await getStoreById(id, token);
      setForm({
        name: detail.name ?? "",
        storeType: normalizeStoreType(String(detail.storeType ?? "RETAIL")),
        currency: normalizeCurrency(String(detail.currency ?? "TRY")),
        code: detail.code ?? "",
        address: detail.address ?? "",
        slug: detail.slug ?? "",
        logo: detail.logo ?? "",
        description: detail.description ?? "",
      });
      setEditingStoreId(detail.id);
      setEditingStoreIsActive(detail.isActive);
      setDrawerOpen(true);
    } catch {
      setFormError("Store detail could not be loaded. Please try again.");
    } finally {
      setLoadingStoreDetail(false);
    }
  };

  const onSubmitStore = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setNameError("");

    if (!form.name.trim()) {
      setNameError("Name field is required.");
      return;
    }

    if (form.name.trim().length < 2) {
      setNameError("Name must be at least 2 characters.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setFormError("Session not found. Please sign in again.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingStoreId) {
        await updateStore(
          editingStoreId,
          {
            name: form.name.trim(),
            code: form.code.trim() || undefined,
            address: form.address.trim() || undefined,
            slug: form.slug.trim() || undefined,
            logo: form.logo.trim() || undefined,
            description: form.description.trim() || undefined,
            isActive: editingStoreIsActive,
          },
          token,
        );
      } else {
        await createStore(
          {
            name: form.name.trim(),
            storeType: form.storeType,
            currency: form.currency,
            code: form.code.trim() || undefined,
            address: form.address.trim() || undefined,
            slug: form.slug.trim() || undefined,
            logo: form.logo.trim() || undefined,
            description: form.description.trim() || undefined,
          },
          token,
        );
      }

      setDrawerOpen(false);
      setForm(EMPTY_FORM);
      setNameError("");
      setEditingStoreId(null);
      setEditingStoreIsActive(true);
      await fetchStores();
    } catch {
      setFormError(editingStoreId ? "Store could not be updated. Please try again." : "Store could not be created. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const clearAdvancedFilters = () => {
    setStatusFilter("all");
  };

  const onToggleStoreActive = async (store: Store, next: boolean) => {
    setTogglingStoreIds((prev) => [...prev, store.id]);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Session not found. Please sign in again.");
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
      setError("Store status could not be updated. Please try again.");
    } finally {
      setTogglingStoreIds((prev) => prev.filter((id) => id !== store.id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Stores</h1>
          <p className="text-sm text-muted">Store list from service</p>
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Ara..."
            containerClassName="w-full lg:w-64"
          />
          <Button
            label={showAdvancedFilters ? "Detaylı Filtreyi Gizle" : "Detaylı Filtre"}
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            variant="secondary"
            className="w-full px-2.5 py-2 lg:w-auto lg:px-3"
          />
          <Button
            label="New Store"
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
              inputAriaLabel="Magaza durum filtresi"
              toggleAriaLabel="Magaza durum listesini ac"
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
          <div className="p-6 text-sm text-muted">Loading stores...</div>
        ) : error ? (
          <div className="p-6">
            <p className="text-sm text-error">{error}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="border-b border-border bg-surface2/70">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Address</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="sticky right-0 z-20 bg-surface2/70 px-4 py-3 text-right">Islemler</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store) => (
                    <tr key={store.id} className="group border-b border-border last:border-b-0 hover:bg-surface2/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-text">{store.name}</td>
                      <td className="px-4 py-3 text-sm text-text2">{store.code}</td>
                      <td className="px-4 py-3 text-sm text-text2">{store.address ?? "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${store.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                            }`}
                        >
                          {store.isActive ? "Active" : "Passive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text2">{store.slug}</td>
                      <td className="sticky right-0 z-10 bg-surface px-4 py-3 text-right group-hover:bg-surface2/50">
                        <div className="inline-flex items-center gap-1">
                          <IconButton
                            onClick={() => onEditStore(store.id)}
                            disabled={togglingStoreIds.includes(store.id)}
                            aria-label="Edit store"
                            title="Duzenle"
                          >
                            <EditIcon />
                          </IconButton>
                          <ToggleSwitch
                            checked={store.isActive}
                            onChange={(next) => onToggleStoreActive(store, next)}
                            disabled={togglingStoreIds.includes(store.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && (
              <TablePagination
                page={currentPage}
                totalPages={totalPages}
                total={meta.total}
                pageSize={pageSize}
                pageSizeId="stores-page-size"
                loading={loading}
                onPageChange={setCurrentPage}
                onPageSizeChange={onChangePageSize}
              />
            )}
          </>
        )}
      </section>

      <Drawer
        open={drawerOpen}
        onClose={onCloseDrawer}
        side={"right"}
        title={editingStoreId ? "Update Store" : "Create Store"}
        description={editingStoreId ? "Update store information" : "Only name is required"}
        closeDisabled={submitting || loadingStoreDetail}
        className={cn(isMobile && "!max-w-none")}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              label="Cancel"
              type="button"
              onClick={onCloseDrawer}
              disabled={submitting || loadingStoreDetail}
              variant="secondary"
            />
            <Button
              label={submitting ? (editingStoreId ? "Updating..." : "Creating...") : editingStoreId ? "Update Store" : "Create Store"}
              type="submit"
              form="create-store-form"
              disabled={submitting || loadingStoreDetail}
              variant="primarySolid"
            />
          </div>
        }
      >
        <form id="create-store-form" onSubmit={onSubmitStore} className="space-y-4 p-5">
          {loadingStoreDetail ? (
            <div className="text-sm text-muted">Loading store detail...</div>
          ) : (
            <>
          <InputField
            label="Name *"
            type="text"
            value={form.name}
            onChange={(v) => onFormChange("name", v)}
            placeholder="Store name"
            error={nameError}
          />

          <InputField
            label="Code"
            type="text"
            value={form.code}
            onChange={(v) => onFormChange("code", v)}
            placeholder="BES-01"
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Store Type</label>
            <SearchableDropdown
              options={[...STORE_TYPE_OPTIONS]}
              value={form.storeType}
              onChange={(value) => onFormChange("storeType", normalizeStoreType(value))}
              placeholder="Store type seciniz"
              showEmptyOption={false}
              allowClear={false}
              inputAriaLabel="Magaza tipi"
              toggleAriaLabel="Magaza tipi listesini ac"
              disabled={Boolean(editingStoreId)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Currency</label>
            <SearchableDropdown
              options={CURRENCY_OPTIONS}
              value={form.currency}
              onChange={(value) => onFormChange("currency", normalizeCurrency(value))}
              placeholder="Currency seciniz"
              showEmptyOption={false}
              allowClear={false}
              inputAriaLabel="Magaza para birimi"
              toggleAriaLabel="Magaza para birimi listesini ac"
              disabled={Boolean(editingStoreId)}
            />
          </div>

          <InputField
            label="Address"
            type="text"
            value={form.address}
            onChange={(v) => onFormChange("address", v)}
            placeholder="Address"
          />

          <InputField
            label="Slug"
            type="text"
            value={form.slug}
            onChange={(v) => onFormChange("slug", v)}
            placeholder="store-slug"
          />

          <InputField
            label="Logo URL"
            type="text"
            value={form.logo}
            onChange={(v) => onFormChange("logo", v)}
            placeholder="https://example.com/logo.png"
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => onFormChange("description", e.target.value)}
              className="min-h-[92px] w-full rounded-xl2 border border-border bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
              placeholder="Short store description"
            />
          </div>

          {formError && <p className="text-sm text-error">{formError}</p>}
            </>
          )}
        </form>
      </Drawer>
    </div>
  );
}
