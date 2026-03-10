"use client";

import { type FormEvent, useState } from "react";
import { EMPTY_FORM, type StoreForm } from "@/components/stores/types";
import type { Currency } from "@/lib/products";
import {
  createStore,
  getStoreById,
  updateStore,
  type StoreType,
} from "@/lib/stores";

type Options = {
  t: (key: string) => string;
  onSuccess: () => Promise<void>;
};

export function useStoreDrawer({ t, onSuccess }: Options) {
  /* ── Drawer state ── */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editingStoreIsActive, setEditingStoreIsActive] = useState(true);
  const [loadingStoreDetail, setLoadingStoreDetail] = useState(false);
  const [formError, setFormError] = useState("");
  const [nameError, setNameError] = useState("");
  const [form, setForm] = useState<StoreForm>(EMPTY_FORM);

  /* ── Normalizers ── */

  const normalizeCurrency = (value: string): Currency =>
    value === "USD" || value === "EUR" ? value : "TRY";

  const normalizeStoreType = (value: string): StoreType =>
    value === "WHOLESALE" ? "WHOLESALE" : "RETAIL";

  /* ── Open / close ── */

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

  /* ── Form change ── */

  const onFormChange = <K extends keyof StoreForm>(field: K, value: StoreForm[K]) => {
    if (field === "name" && nameError) {
      setNameError("");
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /* ── Edit (load existing store) ── */

  const onEditStore = async (id: string) => {
    setFormError("");
    setNameError("");
    setLoadingStoreDetail(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setFormError(t("common.sessionNotFound"));
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
      setFormError(t("stores.detailLoadError"));
    } finally {
      setLoadingStoreDetail(false);
    }
  };

  /* ── Submit (create / update) ── */

  const onSubmitStore = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setNameError("");

    if (!form.name.trim()) {
      setNameError(t("stores.nameRequired"));
      return;
    }

    if (form.name.trim().length < 2) {
      setNameError(t("stores.nameMinLength"));
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setFormError(t("common.sessionNotFound"));
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
      await onSuccess();
    } catch {
      setFormError(editingStoreId ? t("stores.updateError") : t("stores.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  return {
    /* state */
    drawerOpen,
    submitting,
    editingStoreId,
    editingStoreIsActive,
    loadingStoreDetail,
    formError,
    nameError,
    form,
    /* normalizers */
    normalizeCurrency,
    normalizeStoreType,
    /* functions */
    onOpenDrawer,
    onCloseDrawer,
    onFormChange,
    onEditStore,
    onSubmitStore,
  };
}
