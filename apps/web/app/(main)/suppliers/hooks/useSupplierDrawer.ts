"use client";

import { type FormEvent, useState } from "react";
import { EMPTY_FORM, type SupplierForm } from "@/components/suppliers/types";
import {
  createSupplier,
  getSupplierById,
  updateSupplier,
} from "@/lib/suppliers";
import { isValidEmail } from "@gase/core";

type Options = {
  t: (key: string) => string;
  onSuccess: () => Promise<void>;
};

export function useSupplierDrawer({ t, onSuccess }: Options) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editingSupplierIsActive, setEditingSupplierIsActive] = useState(true);
  const [loadingSupplierDetail, setLoadingSupplierDetail] = useState(false);
  const [formError, setFormError] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [form, setForm] = useState<SupplierForm>(EMPTY_FORM);

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

    if (form.email.trim() && !isValidEmail(form.email)) {
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
      await onSuccess();
    } catch {
      setFormError(t("common.loadError"));
    } finally {
      setSubmitting(false);
    }
  };

  return {
    /* state */
    drawerOpen,
    submitting,
    editingSupplierId,
    editingSupplierIsActive,
    setEditingSupplierIsActive,
    loadingSupplierDetail,
    formError,
    nameError,
    emailError,
    form,
    /* handlers */
    onOpenDrawer,
    onCloseDrawer,
    onFormChange,
    onEditSupplier,
    onSubmitSupplier,
  };
}
