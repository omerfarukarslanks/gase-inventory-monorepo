"use client";

import { useCallback, useEffect, useState } from "react";
import TablePagination from "@/components/ui/TablePagination";
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
import { usePermissions } from "@/hooks/usePermissions";
import { useLang } from "@/context/LangContext";
import AttributesFilters from "@/components/attributes/AttributesFilters";
import AttributesTable from "@/components/attributes/AttributesTable";
import AttributeDrawer from "@/components/attributes/AttributeDrawer";
import { parseCommaSeparated, type DrawerStep, type EditableValue } from "@/components/attributes/types";

export default function AttributesPage() {
  const { t } = useLang();
  const { can } = usePermissions();
  const canCreate = can("PRODUCT_ATTRIBUTE_CREATE");
  const canUpdate = can("PRODUCT_ATTRIBUTE_UPDATE");

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
      setError(t("attributes.loadError"));
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, statusFilter, t]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, pageSize]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const toggleExpand = (id: string) => {
    setExpandedAttributeIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
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
        .map((value) => ({
          id: value.id,
          name: value.name ?? "",
          isActive: value.isActive,
          originalName: value.name ?? "",
          originalIsActive: value.isActive,
        }));
      setExistingValues(values);
    } catch {
      setFormError(t("attributes.loadError"));
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
      prev.map((item) => (item.id === attribute.id ? { ...item, isActive: next } : item)),
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

  const toggleAttributeValueStatus = async (value: AttributeValue, next: boolean) => {
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
    if (!workingAttribute) {
      setFormError("Ozellik kimligi bulunamadi. Lutfen tekrar deneyin.");
      return;
    }

    const preparedNewValues = parseCommaSeparated(newValuesInput).map((name) => ({ name }));
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
          existingValueUpdates.map((value) => updateAttributeValue(value.id, { name: value.name })),
        );
      }

      if (preparedNewValues.length > 0) {
        await createAttributeValues(workingAttribute.value, preparedNewValues);
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

  const totalPages = meta?.totalPages ?? 1;

  const handlePageChange = (nextPage: number) => {
    if (loading || nextPage < 1 || nextPage > totalPages || nextPage === currentPage) return;
    setCurrentPage(nextPage);
  };

  const onChangePageSize = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <AttributesFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvancedFilters={() => setShowAdvancedFilters((prev) => !prev)}
        canCreate={canCreate}
        onCreate={openCreateDrawer}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onClearFilters={() => setStatusFilter("all")}
      />

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

      <AttributesTable
        loading={loading}
        attributes={attributes}
        expandedAttributeIds={expandedAttributeIds}
        togglingAttributeIds={togglingAttributeIds}
        togglingValueIds={togglingValueIds}
        canUpdate={canUpdate}
        onToggleExpand={toggleExpand}
        onEditAttribute={openEditDrawer}
        onToggleAttributeStatus={toggleAttributeStatus}
        onToggleValueStatus={toggleAttributeValueStatus}
        footer={
          meta ? (
            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              total={meta.total}
              pageSize={pageSize}
              pageSizeId="attributes-page-size"
              loading={loading}
              onPageChange={handlePageChange}
              onPageSizeChange={onChangePageSize}
            />
          ) : null
        }
      />

      <AttributeDrawer
        open={drawerOpen}
        editingId={editingId}
        drawerStep={drawerStep}
        submitting={submitting}
        detailLoading={detailLoading}
        formName={formName}
        originalName={originalName}
        existingValues={existingValues}
        newValuesInput={newValuesInput}
        formError={formError}
        onClose={closeDrawer}
        onPrevStep={goPrevStep}
        onNextStep={goNextStep}
        onSave={handleSave}
        onFormNameChange={setFormName}
        onNewValuesInputChange={setNewValuesInput}
        onUpdateEditableValue={updateEditableValue}
      />
    </div>
  );
}
