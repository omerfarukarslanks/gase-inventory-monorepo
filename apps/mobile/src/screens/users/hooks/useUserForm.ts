import { createUser, getUser, updateUser, type Store, type User } from "@gase/core";
import { useCallback, useMemo, useRef, useState } from "react";
import { TextInput } from "react-native";
import { trackEvent } from "@/src/lib/analytics";

export type UserRole = "STAFF" | "MANAGER" | "ADMIN";

export type UserForm = {
  name: string;
  surname: string;
  role: UserRole;
  email: string;
  password: string;
  storeId: string;
};

export type UserFormErrors = {
  name: string;
  surname: string;
  email: string;
  password: string;
};

const noStoreValue = "__no_store__";

const emptyForm: UserForm = {
  name: "",
  surname: "",
  role: "STAFF",
  email: "",
  password: "",
  storeId: "",
};

const emptyFormErrors: UserFormErrors = {
  name: "",
  surname: "",
  email: "",
  password: "",
};

export const roleOptions = [
  { label: "STAFF", value: "STAFF" as const },
  { label: "MANAGER", value: "MANAGER" as const },
  { label: "ADMIN", value: "ADMIN" as const },
];

export { noStoreValue };

type UseUserFormParams = {
  stores: Store[];
  onAfterSubmit: (refreshedUser: User) => void;
  fetchUsersList: () => Promise<void>;
};

export function useUserForm({ stores, onAfterSubmit, fetchUsersList }: UseUserFormParams) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserIsActive, setEditingUserIsActive] = useState(true);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<UserFormErrors>(emptyFormErrors);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const surnameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const storeSelectionItems = useMemo(
    () => [
      {
        value: noStoreValue,
        label: "Magaza atama",
        description: "Atama yapmadan kaydi genel tenant kapsaminda tut.",
      },
      ...stores.map((store) => ({
        value: store.id,
        label: store.name,
        description: [store.code || null, store.storeType || null].filter(Boolean).join(" • "),
      })),
    ],
    [stores],
  );

  const selectedStoreLabel = useMemo(() => {
    if (!form.storeId) return "Atanmamis";
    return stores.find((store) => store.id === form.storeId)?.name ?? "Secili magaza bulunamadi";
  }, [form.storeId, stores]);

  const nameError = useMemo(() => {
    if (!form.name.trim()) return "Ad zorunlu.";
    return form.name.trim().length >= 2 ? "" : "Ad en az 2 karakter olmali.";
  }, [form.name]);

  const surnameError = useMemo(() => {
    if (!form.surname.trim()) return "Soyad zorunlu.";
    return form.surname.trim().length >= 2 ? "" : "Soyad en az 2 karakter olmali.";
  }, [form.surname]);

  const emailError = useMemo(() => {
    if (editingUserId) return "";
    if (!form.email.trim()) return "E-posta zorunlu.";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
      ? ""
      : "Gecerli bir e-posta girin.";
  }, [editingUserId, form.email]);

  const passwordError = useMemo(() => {
    if (editingUserId) return "";
    if (!form.password) return "Sifre zorunlu.";
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)
      ? ""
      : "Sifre en az 8 karakter, buyuk-kucuk harf ve rakam icermeli.";
  }, [editingUserId, form.password]);

  const resetEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingUserId(null);
    setEditingUserIsActive(true);
    setForm(emptyForm);
    setFormErrors(emptyFormErrors);
    setFormError("");
  }, []);

  const openCreateModal = useCallback(() => {
    setEditorOpen(true);
    setEditingUserId(null);
    setEditingUserIsActive(true);
    setForm(emptyForm);
    setFormErrors(emptyFormErrors);
    setFormError("");
  }, []);

  const openEditModal = useCallback((user: User) => {
    setEditorOpen(true);
    setEditingUserId(user.id);
    setEditingUserIsActive(Boolean(user.isActive));
    setForm({
      name: user.name ?? "",
      surname: user.surname ?? "",
      role: (user.role as UserRole) ?? "STAFF",
      email: user.email ?? "",
      password: "",
      storeId: user.userStores?.[0]?.store.id ?? "",
    });
    setFormErrors(emptyFormErrors);
    setFormError("");
  }, []);

  const handleFieldChange = useCallback(
    (field: keyof UserForm, value: UserForm[keyof UserForm]) => {
      setForm((current) => ({ ...current, [field]: value }));
      setFormErrors((current) => ({
        ...current,
        ...(field === "name" ? { name: "" } : {}),
        ...(field === "surname" ? { surname: "" } : {}),
        ...(field === "email" ? { email: "" } : {}),
        ...(field === "password" ? { password: "" } : {}),
      }));
      setFormError((current) => (current ? "" : current));
    },
    [],
  );

  const submitUser = async () => {
    const nextErrors: UserFormErrors = {
      name: nameError,
      surname: surnameError,
      email: emailError,
      password: passwordError,
    };
    setFormErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      trackEvent("validation_error", { screen: "users", field: "user_form" });
      setFormError("Alanlari duzeltip tekrar dene.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      if (editingUserId) {
        const updated = await updateUser(editingUserId, {
          name: form.name.trim(),
          surname: form.surname.trim(),
          role: form.role,
          storeIds: form.storeId ? [form.storeId] : [],
          isActive: editingUserIsActive,
        });
        const refreshed = await getUser(updated.id);
        onAfterSubmit(refreshed);
      } else {
        const created = await createUser({
          email: form.email.trim(),
          password: form.password,
          name: form.name.trim(),
          surname: form.surname.trim(),
          role: form.role,
          storeIds: form.storeId ? [form.storeId] : [],
        });
        const refreshed = await getUser(created.id);
        onAfterSubmit(refreshed);
      }

      resetEditor();
      await fetchUsersList();
    } catch (nextError) {
      setFormError(nextError instanceof Error ? nextError.message : "Kullanici kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserActive = async (selectedUser: User, onUpdate: (user: User) => void, onError: (msg: string) => void) => {
    setToggling(true);
    try {
      const updated = await updateUser(selectedUser.id, {
        name: selectedUser.name,
        surname: selectedUser.surname,
        role: selectedUser.role,
        storeIds: selectedUser.userStores?.map((item) => item.store.id) ?? [],
        isActive: !(selectedUser.isActive ?? true),
      });
      const refreshed = await getUser(updated.id);
      onUpdate(refreshed);
      await fetchUsersList();
    } catch (nextError) {
      onError(nextError instanceof Error ? nextError.message : "Kullanici durumu guncellenemedi.");
    } finally {
      setToggling(false);
    }
  };

  return {
    editorOpen,
    editingUserId,
    editingUserIsActive,
    setEditingUserIsActive,
    form,
    formErrors,
    formError,
    submitting,
    toggling,
    surnameRef,
    emailRef,
    passwordRef,
    storeSelectionItems,
    selectedStoreLabel,
    nameError,
    surnameError,
    emailError,
    passwordError,
    resetEditor,
    openCreateModal,
    openEditModal,
    handleFieldChange,
    submitUser,
    toggleUserActive,
  };
}
