"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import SuppliersFilters from "@/components/suppliers/SuppliersFilters";
import SupplierDrawer from "@/components/suppliers/SupplierDrawer";
import SuppliersTable from "@/components/suppliers/SuppliersTable";
import { EMPTY_FORM, type SupplierForm } from "@/components/suppliers/types";
import TablePagination from "@/components/ui/TablePagination";
import { useDebounceStr } from "@/hooks/useDebounce";
import { usePermissions } from "@/hooks/usePermissions";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useLang } from "@/context/LangContext";
import {
  createSupplier,
  getSupplierById,
  getSuppliers,
  updateSupplier,
  type Supplier,
  type SuppliersListMeta,
} from "@/lib/suppliers";

export default function SuppliersPage() {
  const { t } = useLang();
  const { can } = usePermissions();
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
  const canCreate = can("SUPPLIER_CREATE");
  const canUpdate = can("SUPPLIER_UPDATE");

  const fetchSuppliers = useCallback(async () => {
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
      setError(t("common.loadError"));
      setSuppliers([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, pageSize, statusFilter, t]);

  useEffect(() => {
    if (debouncedSearch !== "") {
      setCurrentPage(1);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    void fetchSuppliers();
  }, [fetchSuppliers]);

  const totalPages = meta?.totalPages ?? 1;

  const onChangePageSize = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  };

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
      setFormError(t("suppliers.loadingDetail"));
    } finally {
      setLoadingSupplierDetail(false);
    }
  };

  const onSubmitSupplier = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      setFormError(t("common.loadError"));
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
      setError(t("common.loadError"));
    } finally {
      setTogglingSupplierIds((prev) => prev.filter((id) => id !== supplier.id));
    }
  };

  return (
    <div className="space-y-4">
      <SuppliersFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvancedFilters={() => setShowAdvancedFilters((prev) => !prev)}
        canCreate={canCreate}
        onCreate={onOpenDrawer}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onClearFilters={clearAdvancedFilters}
      />

      <SuppliersTable
        loading={loading}
        error={error}
        suppliers={suppliers}
        canUpdate={canUpdate}
        togglingSupplierIds={togglingSupplierIds}
        onEditSupplier={(id) => void onEditSupplier(id)}
        onToggleSupplierActive={(supplier, next) => void onToggleSupplierActive(supplier, next)}
        footer={
          meta ? (
            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              total={meta.total}
              pageSize={pageSize}
              pageSizeId="suppliers-page-size"
              loading={loading}
              onPageChange={setCurrentPage}
              onPageSizeChange={onChangePageSize}
            />
          ) : null
        }
      />

      <SupplierDrawer
        open={drawerOpen}
        editingSupplierId={editingSupplierId}
        submitting={submitting}
        loadingSupplierDetail={loadingSupplierDetail}
        isMobile={isMobile}
        form={form}
        formError={formError}
        nameError={nameError}
        emailError={emailError}
        editingSupplierIsActive={editingSupplierIsActive}
        onClose={onCloseDrawer}
        onSubmit={onSubmitSupplier}
        onFormChange={onFormChange}
        onEditingSupplierIsActiveChange={setEditingSupplierIsActive}
      />
    </div>
  );
}
