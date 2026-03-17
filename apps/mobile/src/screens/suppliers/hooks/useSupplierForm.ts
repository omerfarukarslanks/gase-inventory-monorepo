import { createSupplier, updateSupplier, isValidTckn, isValidTaxNumber, type Supplier } from "@gase/core";
import { useCallback, useMemo, useRef, useState } from "react";
import { TextInput } from "react-native";
import { trackEvent } from "@/src/lib/analytics";

export type SupplierForm = {
  name: string;
  surname: string;
  address: string;
  phoneNumber: string;
  email: string;
  taxIdType: string;
  taxIdValue: string;
};

const emptyForm: SupplierForm = {
  name: "",
  surname: "",
  address: "",
  phoneNumber: "",
  email: "",
  taxIdType: "tckn",
  taxIdValue: "",
};

type UseSupplierFormParams = {
  canCreate: boolean;
  canUpdate: boolean;
  fetchSuppliers: () => Promise<void>;
  selectedSupplier: Supplier | null;
  setSelectedSupplier: (supplier: Supplier | null) => void;
};

export function useSupplierForm({
  canCreate: _canCreate,
  canUpdate: _canUpdate,
  fetchSuppliers,
  selectedSupplier,
  setSelectedSupplier,
}: UseSupplierFormParams) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editingSupplierIsActive, setEditingSupplierIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [formAttempted, setFormAttempted] = useState(false);
  const [formError, setFormError] = useState("");

  const surnameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);

  const phoneDigits = useMemo(
    () => form.phoneNumber.replace(/\D/g, ""),
    [form.phoneNumber],
  );
  const emailValue = form.email.trim().toLowerCase();

  const nameError = useMemo(() => {
    if (!formAttempted && !form.name.trim()) return "";
    if (!form.name.trim()) return "Isim zorunlu.";
    return form.name.trim().length >= 2 ? "" : "Isim en az 2 karakter olmali.";
  }, [form.name, formAttempted]);

  const phoneError = useMemo(() => {
    if (!form.phoneNumber.trim()) return "";
    return phoneDigits.length >= 10 ? "" : "Telefon en az 10 haneli olmali.";
  }, [form.phoneNumber, phoneDigits.length]);

  const emailError = useMemo(() => {
    if (!emailValue) return "";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)
      ? ""
      : "Gecerli bir e-posta girin.";
  }, [emailValue]);

  const canSubmitForm = Boolean(form.name.trim().length >= 2 && !phoneError && !emailError);

  const openCreateModal = useCallback(() => {
    setEditorOpen(true);
    setEditingSupplierId(null);
    setEditingSupplierIsActive(true);
    setForm(emptyForm);
    setFormAttempted(false);
    setFormError("");
  }, []);

  const openEditModal = useCallback((supplier: Supplier) => {
    setEditorOpen(true);
    setEditingSupplierId(supplier.id);
    setEditingSupplierIsActive(supplier.isActive ?? true);
    setForm({
      name: supplier.name ?? "",
      surname: supplier.surname ?? "",
      address: supplier.address ?? "",
      phoneNumber: supplier.phoneNumber ?? "",
      email: supplier.email ?? "",
      taxIdType: supplier.tckn ? "tckn" : "taxNumber",
      taxIdValue: supplier.tckn ?? supplier.taxNumber ?? "",
    });
    setFormAttempted(false);
    setFormError("");
  }, []);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingSupplierId(null);
    setEditingSupplierIsActive(true);
    setForm(emptyForm);
    setFormAttempted(false);
    setFormError("");
  }, []);

  const submitSupplier = async () => {
    setFormAttempted(true);

    if (!canSubmitForm || nameError || phoneError || emailError) {
      trackEvent("validation_error", { screen: "suppliers", field: "supplier_form" });
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
        ? { tckn: form.taxIdValue.trim(), taxNumber: undefined }
        : { taxNumber: form.taxIdValue.trim(), tckn: undefined }
      : {};

    setSubmitting(true);
    setFormError("");
    try {
      if (editingSupplierId) {
        const updated = await updateSupplier(editingSupplierId, {
          name: form.name.trim(),
          surname: form.surname.trim() || undefined,
          address: form.address.trim() || undefined,
          phoneNumber: form.phoneNumber.trim() || undefined,
          email: emailValue || undefined,
          isActive: editingSupplierIsActive,
          ...taxIdPayload,
        });
        setSelectedSupplier(updated);
      } else {
        await createSupplier({
          name: form.name.trim(),
          surname: form.surname.trim() || undefined,
          address: form.address.trim() || undefined,
          phoneNumber: form.phoneNumber.trim() || undefined,
          email: emailValue || undefined,
          ...taxIdPayload,
        });
      }

      closeEditor();
      await fetchSuppliers();
    } catch (nextError) {
      setFormError(
        nextError instanceof Error ? nextError.message : "Tedarikci kaydedilemedi.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSupplierActive = async () => {
    if (!selectedSupplier) return;

    setToggling(true);
    try {
      const updated = await updateSupplier(selectedSupplier.id, {
        name: selectedSupplier.name,
        surname: selectedSupplier.surname ?? undefined,
        address: selectedSupplier.address ?? undefined,
        phoneNumber: selectedSupplier.phoneNumber ?? undefined,
        email: selectedSupplier.email ?? undefined,
        isActive: !(selectedSupplier.isActive ?? true),
      });
      setSelectedSupplier(updated);
      await fetchSuppliers();
    } catch (nextError) {
      setFormError(
        nextError instanceof Error ? nextError.message : "Tedarikci durumu guncellenemedi.",
      );
    } finally {
      setToggling(false);
    }
  };

  const handleFormChange = useCallback(
    (field: keyof SupplierForm, value: string) => {
      setForm((current) => ({ ...current, [field]: value }));
      if (formError) setFormError("");
    },
    [formError],
  );

  return {
    editorOpen,
    editingSupplierId,
    editingSupplierIsActive,
    setEditingSupplierIsActive,
    submitting,
    toggling,
    form,
    formAttempted,
    formError,
    nameError,
    phoneError,
    emailError,
    canSubmitForm,
    surnameRef,
    phoneRef,
    emailRef,
    addressRef,
    openCreateModal,
    openEditModal,
    closeEditor,
    submitSupplier,
    toggleSupplierActive,
    handleFormChange,
  };
}
