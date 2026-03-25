import { createStore, updateStore, isValidTckn, isValidTaxNumber, type Currency, type Store, type StoreType } from "@gase/core";
import { useCallback, useMemo, useRef, useState } from "react";
import { TextInput } from "react-native";
import { trackEvent } from "@/src/lib/analytics";

export type StoreForm = {
  name: string;
  storeType: StoreType;
  currency: Currency;
  code: string;
  address: string;
  slug: string;
  logo: string;
  description: string;
  taxIdType: string;
  taxIdValue: string;
};

const emptyForm: StoreForm = {
  name: "",
  storeType: "RETAIL",
  currency: "TRY",
  code: "",
  address: "",
  slug: "",
  logo: "",
  description: "",
  taxIdType: "tckn",
  taxIdValue: "",
};

type UseStoreFormParams = {
  fetchStores: () => Promise<void>;
  setSelectedStore: (store: Store | null) => void;
};

export function useStoreForm({ fetchStores, setSelectedStore }: UseStoreFormParams) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editingStoreIsActive, setEditingStoreIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<StoreForm>(emptyForm);
  const [formAttempted, setFormAttempted] = useState(false);
  const [formError, setFormError] = useState("");

  const codeRef = useRef<TextInput>(null);
  const slugRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const logoRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  const nameError = useMemo(() => {
    if (!formAttempted && !form.name.trim()) return "";
    if (!form.name.trim()) return "Magaza adi zorunlu.";
    return form.name.trim().length >= 2 ? "" : "Magaza adi en az 2 karakter olmali.";
  }, [form.name, formAttempted]);

  const canSubmitForm = Boolean(form.name.trim().length >= 2);

  const openCreateModal = useCallback(() => {
    setEditorOpen(true);
    setEditingStoreId(null);
    setEditingStoreIsActive(true);
    setForm(emptyForm);
    setFormAttempted(false);
    setFormError("");
  }, []);

  const openEditModal = useCallback((store: Store) => {
    setEditorOpen(true);
    setEditingStoreId(store.id);
    setEditingStoreIsActive(store.isActive);
    setForm({
      name: store.name ?? "",
      storeType: (store.storeType ?? "RETAIL") as StoreType,
      currency: (store.currency ?? "TRY") as Currency,
      code: store.code ?? "",
      address: store.address ?? "",
      slug: store.slug ?? "",
      logo: store.logo ?? "",
      description: store.description ?? "",
      taxIdType: store.tckn ? "tckn" : "taxNo",
      taxIdValue: store.tckn ?? store.taxNo ?? "",
    });
    setFormAttempted(false);
    setFormError("");
  }, []);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingStoreId(null);
    setEditingStoreIsActive(true);
    setForm(emptyForm);
    setFormAttempted(false);
    setFormError("");
  }, []);

  const submitStore = async () => {
    setFormAttempted(true);

    if (!canSubmitForm || nameError) {
      trackEvent("validation_error", { screen: "stores", field: "store_form" });
      setFormError("Alanlari duzeltip tekrar dene.");
      return;
    }

    if (form.taxIdValue.trim()) {
      const valid =
        form.taxIdType === "tckn"
          ? isValidTckn(form.taxIdValue.trim())
          : isValidTaxNumber(form.taxIdValue.trim());
      if (!valid) {
        setFormError(form.taxIdType === "tckn" ? "TCKN 11 haneli olmali." : "Vergi No 10 haneli olmali.");
        return;
      }
    }

    const taxIdPayload = form.taxIdValue.trim()
      ? form.taxIdType === "tckn"
        ? { tckn: form.taxIdValue.trim(), taxNo: null }
        : { taxNo: form.taxIdValue.trim(), tckn: null }
      : { tckn: null, taxNo: null };

    setSubmitting(true);
    setFormError("");
    try {
      if (editingStoreId) {
        const updated = await updateStore(editingStoreId, {
          name: form.name.trim(),
          code: form.code.trim() || undefined,
          address: form.address.trim() || undefined,
          slug: form.slug.trim() || undefined,
          logo: form.logo.trim() || undefined,
          description: form.description.trim() || undefined,
          isActive: editingStoreIsActive,
          ...taxIdPayload,
        });
        setSelectedStore(updated);
      } else {
        await createStore({
          name: form.name.trim(),
          storeType: form.storeType,
          currency: form.currency,
          code: form.code.trim() || undefined,
          address: form.address.trim() || undefined,
          slug: form.slug.trim() || undefined,
          logo: form.logo.trim() || undefined,
          description: form.description.trim() || undefined,
          ...(form.taxIdValue.trim()
            ? form.taxIdType === "tckn"
              ? { tckn: form.taxIdValue.trim() }
              : { taxNo: form.taxIdValue.trim() }
            : {}),
        });
      }

      closeEditor();
      await fetchStores();
    } catch (nextError) {
      setFormError(nextError instanceof Error ? nextError.message : "Magaza kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = useCallback(
    (field: keyof StoreForm, value: StoreForm[keyof StoreForm]) => {
      setForm((current) => ({ ...current, [field]: value }));
      if (formError) setFormError("");
    },
    [formError],
  );

  return {
    editorOpen,
    editingStoreId,
    editingStoreIsActive,
    setEditingStoreIsActive,
    submitting,
    form,
    formAttempted,
    formError,
    nameError,
    canSubmitForm,
    codeRef,
    slugRef,
    addressRef,
    logoRef,
    descriptionRef,
    openCreateModal,
    openEditModal,
    closeEditor,
    submitStore,
    handleFormChange,
  };
}
