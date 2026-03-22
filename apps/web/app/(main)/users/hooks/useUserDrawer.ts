"use client";

import { useEffect, useState } from "react";
import {
  EMPTY_USER_FORM,
  EMPTY_USER_FORM_ERRORS,
  type UserForm,
  type UserFormErrors,
} from "@/components/users/types";
import { createUser, updateUser, type User } from "@/lib/users";
import { getRoles } from "@/lib/permissions";
import { isValidEmail } from "@gase/core";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

type Options = {
  t?: (key: string) => string;
  onSaved: () => Promise<void>;
  tenantStoreId?: string;
};

export function useUserDrawer({ onSaved, tenantStoreId }: Options) {
  const [mode, setMode] = useState<"edit" | "create">("create");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form, setForm] = useState<UserForm>(EMPTY_USER_FORM);
  const [formErrors, setFormErrors] = useState<UserFormErrors>(EMPTY_USER_FORM_ERRORS);
  const [saving, setSaving] = useState(false);

  const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    getRoles({ limit: 100 })
      .then((res) => {
        setRoleOptions(res.data.map((r) => ({ value: r.role, label: r.role })));
      })
      .catch(() => {
        setRoleOptions([]);
      });
  }, []);

  const resetForm = () => {
    setForm(EMPTY_USER_FORM);
    setFormErrors(EMPTY_USER_FORM_ERRORS);
  };

  const openCreate = () => {
    setMode("create");
    setSelectedUser(null);
    resetForm();
    if (tenantStoreId) {
      setForm((prev) => ({ ...prev, storeId: tenantStoreId }));
    }
    setIsDrawerOpen(true);
  };

  const openEdit = (user: User) => {
    setMode("edit");
    setSelectedUser(user);
    setForm({
      name: user.name,
      surname: user.surname,
      role: user.roleName,
      email: user.email,
      password: "",
      storeId: tenantStoreId ?? user.store?.id ?? "",
    });
    setFormErrors(EMPTY_USER_FORM_ERRORS);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (saving) return;
    setIsDrawerOpen(false);
    setFormErrors(EMPTY_USER_FORM_ERRORS);
  };

  const onFormChange = <K extends keyof UserForm>(field: K, value: UserForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (field === "name" && formErrors.name) {
      setFormErrors((prev) => ({ ...prev, name: "" }));
    }
    if (field === "surname" && formErrors.surname) {
      setFormErrors((prev) => ({ ...prev, surname: "" }));
    }
    if (field === "email" && formErrors.email) {
      setFormErrors((prev) => ({ ...prev, email: "" }));
    }
    if (field === "password" && formErrors.password) {
      setFormErrors((prev) => ({ ...prev, password: "" }));
    }
    if (field === "role" && formErrors.role) {
      setFormErrors((prev) => ({ ...prev, role: "" }));
    }
    if (field === "storeId" && formErrors.storeId) {
      setFormErrors((prev) => ({ ...prev, storeId: "" }));
    }
  };

  const validateForm = () => {
    const nextErrors: UserFormErrors = {
      name: "",
      surname: "",
      email: "",
      password: "",
      role: "",
      storeId: "",
    };

    if (!form.name.trim()) {
      nextErrors.name = "Ad zorunludur.";
    } else if (form.name.trim().length < 2) {
      nextErrors.name = "Ad en az 2 karakter olmalıdır.";
    }

    if (!form.surname.trim()) {
      nextErrors.surname = "Soyad zorunludur.";
    } else if (form.surname.trim().length < 2) {
      nextErrors.surname = "Soyad en az 2 karakter olmalıdır.";
    }

    if (!form.role) {
      nextErrors.role = "Rol seçimi zorunludur.";
    }

    if (!tenantStoreId && !form.storeId) {
      nextErrors.storeId = "Mağaza seçimi zorunludur.";
    }

    if (mode === "create") {
      if (!form.email.trim()) {
        nextErrors.email = "E-posta zorunludur.";
      } else if (!isValidEmail(form.email)) {
        nextErrors.email = "Geçerli bir e-posta giriniz.";
      }

      if (!form.password) {
        nextErrors.password = "Şifre zorunludur.";
      } else if (!passwordPattern.test(form.password)) {
        nextErrors.password = "Şifre en az 8 karakter olmalı, büyük-küçük harf ve rakam içermelidir.";
      }
    }

    setFormErrors(nextErrors);
    return Object.values(nextErrors).every((value) => !value);
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (mode === "create") {
        await createUser({
          email: form.email.trim(),
          password: form.password,
          name: form.name.trim(),
          surname: form.surname.trim(),
          role: form.role,
          storeIds: form.storeId ? [form.storeId] : [],
        });
      } else {
        if (!selectedUser) return;
        await updateUser(selectedUser.id, {
          name: form.name,
          surname: form.surname,
          role: form.role,
          storeIds: form.storeId ? [form.storeId] : [],
        });
      }

      setIsDrawerOpen(false);
      setFormErrors(EMPTY_USER_FORM_ERRORS);
      await onSaved();
    } catch {
      alert("İşlem başarısız oldu.");
    } finally {
      setSaving(false);
    }
  };

  return {
    /* state */
    mode,
    selectedUser,
    isDrawerOpen,
    form,
    formErrors,
    saving,
    /* derived */
    roleOptions,
    /* functions */
    openCreate,
    openEdit,
    closeDrawer,
    onFormChange,
    handleSave,
  };
}
