"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  createStore,
  deleteStore,
  getStoreById,
  getStores,
  updateStore,
  type Store,
  type StoresListMeta,
} from "@/lib/stores";
import Drawer, { type DrawerSide } from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import InputField from "@/components/ui/InputField";
import { cn } from "@/lib/cn";

type StoreForm = {
  name: string;
  code: string;
  address: string;
  slug: string;
  logo: string;
  description: string;
};

const EMPTY_FORM: StoreForm = {
  name: "",
  code: "",
  address: "",
  slug: "",
  logo: "",
  description: "",
};

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [meta, setMeta] = useState<StoresListMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [cursor] = useState(() => new Date().toISOString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSide, setDrawerSide] = useState<DrawerSide>("right");
  const [submitting, setSubmitting] = useState(false);
  const [deletingStoreId, setDeletingStoreId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editingStoreIsActive, setEditingStoreIsActive] = useState(true);
  const [loadingStoreDetail, setLoadingStoreDetail] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<StoreForm>(EMPTY_FORM);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(!e.matches);
    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const fetchStores = useCallback(async () => {
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

      const offset = (currentPage - 1) * pageSize;
      const res = await getStores({
        offset,
        limit: pageSize,
        cursor,
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
  }, [currentPage, cursor, pageSize]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / pageSize)) : 1;
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

  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, -1, totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
  };

  const pageItems = getVisiblePages();

  const onOpenDrawer = () => {
    setFormError("");
    setForm(EMPTY_FORM);
    setEditingStoreId(null);
    setEditingStoreIsActive(true);
    setDrawerOpen(true);
  };

  const onCloseDrawer = () => {
    if (submitting || loadingStoreDetail) return;
    setDrawerOpen(false);
  };

  const onFormChange = (field: keyof StoreForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onEditStore = async (id: string) => {
    setFormError("");
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

    if (!form.name.trim()) {
      setFormError("Name field is required.");
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
      setEditingStoreId(null);
      setEditingStoreIsActive(true);
      await fetchStores();
    } catch {
      setFormError(editingStoreId ? "Store could not be updated. Please try again." : "Store could not be created. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const onDeleteStore = async () => {
    if (!deleteTarget) return;
    setError("");
    setDeletingStoreId(deleteTarget.id);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Session not found. Please sign in again.");
        return;
      }

      await deleteStore(deleteTarget.id, token);
      await fetchStores();
      setDeleteTarget(null);
    } catch {
      setError("Store could not be deleted. Please try again.");
    } finally {
      setDeletingStoreId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Stores</h1>
          <p className="text-sm text-muted">Store list from service</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={drawerSide}
            onChange={(e) => setDrawerSide(e.target.value as DrawerSide)}
            className="hidden rounded-xl2 border border-border bg-surface px-3 py-2 text-sm text-text outline-none md:block"
          >
            <option value="right">Drawer: Right</option>
            <option value="left">Drawer: Left</option>
            <option value="top">Drawer: Top</option>
            <option value="bottom">Drawer: Bottom</option>
          </select>

          <Button
            label="New Store"
            onClick={onOpenDrawer}
            className="rounded-xl2 border border-primary/30 bg-primary/10 px-2.5 py-2 text-sm font-semibold text-primary hover:bg-primary/15 md:px-3"
          />

          <Button
            label="Refresh"
            onClick={fetchStores}
            className="rounded-xl2 border border-border bg-surface px-2.5 py-2 text-sm text-text hover:bg-surface2 md:px-3"
          />
        </div>
      </div>

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
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store) => (
                    <tr key={store.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3 text-sm font-medium text-text">{store.name}</td>
                      <td className="px-4 py-3 text-sm text-text2">{store.code}</td>
                      <td className="px-4 py-3 text-sm text-text2">{store.address ?? "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            store.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                          }`}
                        >
                          {store.isActive ? "Active" : "Passive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text2">{store.slug}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            label="Edit"
                            onClick={() => onEditStore(store.id)}
                            disabled={deletingStoreId === store.id}
                            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text hover:bg-surface2"
                          />
                          <Button
                            label={deletingStoreId === store.id ? "Deleting..." : "Delete"}
                            onClick={() => setDeleteTarget({ id: store.id, name: store.name })}
                            disabled={deletingStoreId === store.id}
                            className="rounded-lg border border-error/40 bg-error/10 px-2 py-1 text-xs text-text hover:bg-error/20"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted">
                <div className="flex items-center gap-4">
                  <span>Total: {meta.total}</span>
                  <span>
                    Page: {currentPage}/{totalPages}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="pageSize" className="text-xs text-muted">
                    Rows:
                  </label>
                  <select
                    id="pageSize"
                    value={pageSize}
                    onChange={(e) => onChangePageSize(Number(e.target.value))}
                    className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>

                  <Button
                    label="Previous"
                    onClick={goPrev}
                    disabled={!canGoPrev || loading}
                    className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text disabled:cursor-not-allowed disabled:opacity-50 hover:bg-surface2"
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
                        className={`rounded-lg border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50 ${
                          item === currentPage
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-surface text-text hover:bg-surface2"
                        }`}
                      />
                    ),
                  )}

                  <Button
                    label="Next"
                    onClick={goNext}
                    disabled={!canGoNext || loading}
                    className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text disabled:cursor-not-allowed disabled:opacity-50 hover:bg-surface2"
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
        side={isMobile ? "right" : drawerSide}
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
              className="rounded-xl2 border border-border px-3 py-2 text-sm text-text disabled:cursor-not-allowed disabled:opacity-60 hover:bg-surface2"
            />
            <Button
              label={submitting ? (editingStoreId ? "Updating..." : "Creating...") : editingStoreId ? "Update Store" : "Create Store"}
              type="submit"
              form="create-store-form"
              disabled={submitting || loadingStoreDetail}
              className="rounded-xl2 border border-primary/20 bg-primary px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 hover:bg-primary/90"
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
          />

          <InputField
            label="Code"
            type="text"
            value={form.code}
            onChange={(v) => onFormChange("code", v)}
            placeholder="BES-01"
          />

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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Silme Onayı"
        description={deleteTarget ? `"${deleteTarget.name}" mağazasını silmek istediğinize emin misiniz?` : "Silmek istediğinize emin misiniz?"}
        confirmLabel="Evet"
        cancelLabel="Hayır"
        loading={Boolean(deleteTarget && deletingStoreId === deleteTarget.id)}
        onConfirm={onDeleteStore}
        onClose={() => {
          if (deletingStoreId) return;
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
