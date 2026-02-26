"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon, SearchIcon } from "@/components/ui/icons/TableIcons";
import {
  createAttribute,
  createAttributeValues,
  getAttributeById,
  getAttributesPaginated,
  updateAttribute,
  updateAttributeValue,
  type Attribute,
  type AttributesPaginatedMeta,
  type AttributeValue,
} from "@/lib/attributes";
import { useDebounceStr } from "@/hooks/useDebounce";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { formatDate } from "@/lib/format";
import { getVisiblePages } from "@/lib/pagination";
import { STATUS_FILTER_OPTIONS, parseIsActiveFilter } from "@/components/products/types";

type DrawerStep = 1 | 2;

type EditableValue = {
  id: string;
  name: string;
  isActive: boolean;
  originalName: string;
  originalIsActive: boolean;
};

function parseCommaSeparated(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AttributesPage() {
  const accessChecked = useAdminGuard();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [meta, setMeta] = useState<AttributesPaginatedMeta | null>(null);
  const [expandedAttributeIds, setExpandedAttributeIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | "all">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const debouncedSearch = useDebounceStr(searchTerm, 300);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState<DrawerStep>(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [workingAttribute, setWorkingAttribute] = useState<Attribute | null>(null);
  const [formName, setFormName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [existingValues, setExistingValues] = useState<EditableValue[]>([]);
  const [newValuesInput, setNewValuesInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [togglingAttributeIds, setTogglingAttributeIds] = useState<string[]>([]);
  const [togglingValueIds, setTogglingValueIds] = useState<string[]>([]);

  const fetchAttributes = useCallback(async () => {
    if (!accessChecked) return;
    setLoading(true);
    setError("");
    try {
      const res = await getAttributesPaginated({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
        sortOrder: "DESC",
        sortBy: "createdAt",
        isActive: statusFilter,
      });
      setAttributes(res.data);
      setMeta(res.meta);
      setExpandedAttributeIds([]);
    } catch {
      setAttributes([]);
      setMeta(null);
      setError("Ozellikler yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [accessChecked, currentPage, pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, pageSize]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const toggleExpand = (id: string) => {
    setExpandedAttributeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const openCreateDrawer = () => {
    setEditingId(null);
    setWorkingAttribute(null);
    setDrawerStep(1);
    setFormName("");
    setOriginalName("");
    setExistingValues([]);
    setNewValuesInput("");
    setFormError("");
    setDrawerOpen(true);
  };

  const openEditDrawer = async (attribute: Attribute) => {
    setEditingId(attribute.id);
    setWorkingAttribute(attribute);
    setDrawerStep(1);
    setFormName(attribute.name);
    setOriginalName(attribute.name);
    setExistingValues([]);
    setNewValuesInput("");
    setFormError("");
    setDrawerOpen(true);
    setDetailLoading(true);

    try {
      const detail = await getAttributeById(attribute.id);
      const values = [...detail.values]
        .sort((a, b) => Number(a.value) - Number(b.value))
        .map((v) => ({
          id: v.id,
          name: v.name ?? "",
          isActive: v.isActive,
          originalName: v.name ?? "",
          originalIsActive: v.isActive,
        }));
      setExistingValues(values);
    } catch {
      setFormError("Ozellik detaylari alinamadi.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDrawer = () => {
    if (submitting) return;
    setDrawerOpen(false);
  };

  const goNextStep = async () => {
    setFormError("");
    if (!formName.trim()) {
      setFormError("Ozellik adi zorunludur.");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      const nextName = formName.trim();

      if (editingId && workingAttribute) {
        if (nextName !== originalName.trim()) {
          await updateAttribute(editingId, { name: nextName });
          setOriginalName(nextName);
          setSuccess("Ozellik bilgisi guncellendi.");
          await fetchAttributes();
        }
      } else {
        const created = await createAttribute({ name: nextName });
        setEditingId(created.id);
        setWorkingAttribute(created);
        setOriginalName(created.name ?? nextName);
        setSuccess("Ozellik olusturuldu. Deger girisine devam edin.");
        await fetchAttributes();
      }

      setDrawerStep(2);
    } catch {
      setFormError("Ozellik kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const goPrevStep = () => {
    setFormError("");
    setDrawerStep(1);
  };

  const toggleAttributeStatus = async (attribute: Attribute, next: boolean) => {
    setTogglingAttributeIds((prev) => [...prev, attribute.id]);
    setAttributes((prev) =>
      prev.map((item) =>
        item.id === attribute.id ? { ...item, isActive: next } : item,
      ),
    );
    try {
      await updateAttribute(attribute.id, { isActive: next });
      setSuccess("Ozellik durumu guncellendi.");
      await fetchAttributes();
    } catch {
      setError("Ozellik durumu guncellenemedi.");
      setAttributes((prev) =>
        prev.map((item) =>
          item.id === attribute.id ? { ...item, isActive: attribute.isActive } : item,
        ),
      );
    } finally {
      setTogglingAttributeIds((prev) => prev.filter((id) => id !== attribute.id));
    }
  };

  const toggleAttributeValueStatus = async (
    value: AttributeValue,
    next: boolean,
  ) => {
    setTogglingValueIds((prev) => [...prev, value.id]);
    try {
      await updateAttributeValue(value.id, { isActive: next });
      setSuccess("Deger durumu guncellendi.");
      await fetchAttributes();
    } catch {
      setError("Deger durumu guncellenemedi.");
    } finally {
      setTogglingValueIds((prev) => prev.filter((id) => id !== value.id));
    }
  };

  const handleSave = async () => {
    setFormError("");
    const attr = workingAttribute;
    if (!attr) {
      setFormError("Ozellik kimligi bulunamadi. Lutfen tekrar deneyin.");
      return;
    }

    const preparedNewValues = parseCommaSeparated(newValuesInput)
      .map((name) => ({ name }));

    const existingValueUpdates = existingValues
      .filter((item) => item.name.trim() !== item.originalName)
      .map((item) => ({ id: item.id, name: item.name.trim() }));

    if (existingValueUpdates.some((item) => !item.name)) {
      setFormError("Deger adi bos birakilamaz.");
      return;
    }

    if (preparedNewValues.length === 0 && existingValueUpdates.length === 0) {
      setSuccess("Degisiklik yok.");
      setDrawerOpen(false);
      return;
    }

    setSubmitting(true);

    try {
      if (existingValueUpdates.length > 0) {
        await Promise.all(
          existingValueUpdates.map((v) =>
            updateAttributeValue(v.id, { name: v.name }),
          ),
        );
      }

      if (preparedNewValues.length > 0) {
        await createAttributeValues(attr.value, preparedNewValues);
      }

      setDrawerOpen(false);
      setSuccess("Degerler kaydedildi.");
      await fetchAttributes();
    } catch {
      setFormError("Kaydetme islemi basarisiz oldu.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateEditableValue = (id: string, patch: Partial<EditableValue>) => {
    setExistingValues((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };


  const valuesForRow = (attribute: Attribute): AttributeValue[] =>
    [...(attribute.values ?? [])].sort((a, b) => Number(a.value) - Number(b.value));

  const totalPages = meta?.totalPages ?? 1;
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePageChange = (nextPage: number) => {
    if (loading || nextPage < 1 || nextPage > totalPages || nextPage === currentPage) return;
    setCurrentPage(nextPage);
  };

  const onChangePageSize = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const pageItems = getVisiblePages(currentPage, totalPages);

  if (!accessChecked) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Ozellik Yonetimi</h1>
          <p className="text-sm text-muted">Varyant ozelliklerini ve degerlerini yonetin</p>
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
          <div className="relative w-full lg:w-80">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Ozellik ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button
            label={showAdvancedFilters ? "Detayli Filtreyi Gizle" : "Detayli Filtre"}
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            variant="secondary"
            className="w-full px-3 py-2 lg:w-auto"
          />
          <Button
            label="Yeni Ozellik"
            onClick={openCreateDrawer}
            variant="primarySolid"
            className="w-full px-3 py-2 lg:w-auto"
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
              inputAriaLabel="Ozellik durum filtresi"
              toggleAriaLabel="Ozellik durum listesini ac"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <Button
              label="Filtreleri Temizle"
              onClick={() => setStatusFilter("all")}
              variant="secondary"
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      )}

      {/* Alerts */}
      {success && (
        <div className="animate-fi rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          {success}
        </div>
      )}
      {error && (
        <div className="animate-fi rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Table */}
      <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
        {loading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-muted">
            <svg className="h-4 w-4 animate-sp" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Ozellikler yukleniyor...
          </div>
        ) : attributes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted/40">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.29 7 12 12 20.71 7" />
              <line x1="12" y1="22" x2="12" y2="12" />
            </svg>
            <p className="text-sm font-medium text-muted">Gosterilecek ozellik bulunamadi</p>
            <p className="text-xs text-muted/70">Yeni bir ozellik ekleyerek baslayabilirsiniz</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="border-b border-border bg-surface2/70">
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Ozellik</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 text-center">Deger Sayisi</th>
                  <th className="px-4 py-3">Guncelleme</th>
                  <th className="sticky right-0 z-20 bg-surface2/70 px-4 py-3 text-right">Islemler</th>
                </tr>
              </thead>
              <tbody>
                {attributes.map((attribute) => {
                  const isExpanded = expandedAttributeIds.includes(attribute.id);
                  const values = valuesForRow(attribute);

                  return (
                    <Fragment key={attribute.id}>
                      <tr className="group border-b border-border last:border-b-0 hover:bg-surface2/40 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-text">
                          <button
                            type="button"
                            onClick={() => toggleExpand(attribute.id)}
                            className="inline-flex items-center cursor-pointer gap-2 rounded-lg px-1 py-1 text-left hover:bg-surface2"
                            aria-expanded={isExpanded}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`text-muted transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                            >
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                            <span>{attribute.name}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              attribute.isActive
                                ? "bg-primary/15 text-primary"
                                : "bg-error/15 text-error"
                            }`}
                          >
                            {attribute.isActive ? "Aktif" : "Pasif"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-text2">
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-surface2 px-2 text-xs font-medium">
                            {attribute.values?.length ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-text2">{formatDate(attribute.updatedAt)}</td>
                        <td className="sticky right-0 z-10 bg-surface px-4 py-3 text-right group-hover:bg-surface2/40">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditDrawer(attribute)}
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-primary/10 hover:text-primary transition-colors"
                              aria-label="Ozellik duzenle"
                              title="Duzenle"
                            >
                              <EditIcon />
                            </button>
                            <ToggleSwitch
                              checked={attribute.isActive}
                              onChange={(next) => toggleAttributeStatus(attribute, next)}
                              disabled={togglingAttributeIds.includes(attribute.id)}
                            />
                          </div>
                        </td>
                      </tr>

                      {/* Expanded child values */}
                      {isExpanded && (
                        <tr className="border-b border-border bg-surface/60">
                          <td colSpan={5} className="px-5 py-4">
                            {values.length === 0 ? (
                              <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-muted">
                                Bu ozellige ait deger bulunamadi.
                              </div>
                            ) : (
                              <div className="overflow-hidden rounded-xl border border-border bg-surface">
                                <table className="w-full min-w-[500px]">
                                  <thead className="border-b border-border bg-surface2/70">
                                    <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
                                      <th className="px-3 py-2">Deger Adi</th>
                                      <th className="px-3 py-2">Durum</th>
                                      <th className="sticky right-0 z-20 bg-surface2/70 px-3 py-2 text-right">Islemler</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {values.map((value) => (
                                      <tr key={value.id} className="group border-b border-border last:border-b-0 hover:bg-surface2/30 transition-colors">
                                        <td className="px-3 py-2 text-sm text-text">{value.name}</td>
                                        <td className="px-3 py-2">
                                          <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                              value.isActive
                                                ? "bg-primary/15 text-primary"
                                                : "bg-error/15 text-error"
                                            }`}
                                          >
                                            {value.isActive ? "Aktif" : "Pasif"}
                                          </span>
                                        </td>
                                        <td className="sticky right-0 z-10 bg-surface px-3 py-2 text-right group-hover:bg-surface2/30">
                                          <ToggleSwitch
                                            checked={value.isActive}
                                            onChange={(next) =>
                                              toggleAttributeValueStatus(value, next)
                                            }
                                            disabled={togglingValueIds.includes(value.id)}
                                          />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {meta && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted">
            <div className="flex items-center gap-4">
              <span>Toplam: {meta.total}</span>
              <span>
                Sayfa: {currentPage}/{totalPages}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="attributesPageSize" className="text-xs text-muted">
                Satir:
              </label>
              <select
                id="attributesPageSize"
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
                onClick={() => handlePageChange(currentPage - 1)}
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
                    onClick={() => handlePageChange(item)}
                    disabled={loading}
                    variant={item === currentPage ? "paginationActive" : "pagination"}
                  />
                ),
              )}

              <Button
                label="Sonraki"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!canGoNext || loading}
                variant="pagination"
              />
            </div>
          </div>
        )}
      </section>

      {/* Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        side="right"
        title={editingId ? "Ozellik Duzenle" : "Yeni Ozellik"}
        description={`Adim ${drawerStep}/2`}
        closeDisabled={submitting}
        className="!max-w-[640px]"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button label="Iptal" onClick={closeDrawer} disabled={submitting} variant="secondary" />
            {drawerStep === 2 && (
              <Button label="Geri" onClick={goPrevStep} disabled={submitting} variant="secondary" />
            )}
            {drawerStep === 1 ? (
              <Button
                label="Devam"
                onClick={goNextStep}
                disabled={submitting || detailLoading}
                loading={submitting}
                variant="primarySolid"
              />
            ) : (
              <Button
                label="Kaydet"
                onClick={handleSave}
                loading={submitting}
                variant="primarySolid"
              />
            )}
          </div>
        }
      >
        <div className="space-y-5 p-5">
          {/* Step indicator */}
          <div className="flex gap-2">
            <div className="h-1 flex-1 rounded-full bg-primary" />
            <div className={`h-1 flex-1 rounded-full transition-colors ${drawerStep === 2 ? "bg-primary" : "bg-border"}`} />
          </div>

          {/* Step 1 - Attribute Name */}
          {drawerStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-text">Ozellik Bilgisi</h3>
                <p className="text-xs text-muted">Ozellik adini girin</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted">Ozellik Adi *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Orn: Renk, Beden, Malzeme"
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !submitting) goNextStep();
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 2 - Attribute Values */}
          {drawerStep === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-text">Ozellik Degerleri</h3>
                <p className="text-xs text-muted">
                  <span className="font-medium text-text">{originalName}</span> icin degerlerini yonetin
                </p>
              </div>

              {detailLoading ? (
                <div className="flex items-center gap-2 py-4 text-sm text-muted">
                  <svg className="h-4 w-4 animate-sp" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Degerler yukleniyor...
                </div>
              ) : (
                <>
                  {/* Existing values */}
                  {editingId && existingValues.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted">Mevcut Degerler</label>
                      <div className="space-y-2">
                        {existingValues.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 rounded-xl border border-border bg-surface2/30 p-2"
                          >
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateEditableValue(item.id, { name: e.target.value })}
                              placeholder="Deger adi"
                              className="h-9 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                item.isActive
                                  ? "bg-primary/15 text-primary"
                                  : "bg-error/15 text-error"
                              }`}
                            >
                              {item.isActive ? "Aktif" : "Pasif"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {editingId && existingValues.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted">
                      Kayitli deger bulunamadi
                    </div>
                  )}

                  {/* New values */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted">Yeni Degerler</label>
                    <input
                      type="text"
                      value={newValuesInput}
                      onChange={(e) => setNewValuesInput(e.target.value)}
                      placeholder="Virgul ile ayirin: Kirmizi, Mavi, Yesil"
                      className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    {newValuesInput.trim() && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {parseCommaSeparated(newValuesInput).map((name, i) => (
                          <span
                            key={`${name}-${i}`}
                            className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Form error */}
          {formError && (
            <div className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">
              {formError}
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
