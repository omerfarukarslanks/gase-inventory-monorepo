import { type FormEvent, useState } from "react";
import {
  createCustomer,
  getCustomerById,
  updateCustomer,
  type CustomerGender,
} from "@/lib/customers";
import { isValidEmail } from "@gase/core";
import { EMPTY_FORM, type CustomerForm } from "@/components/customers/types";

type Options = {
  onSuccess: () => Promise<void>;
  t: (key: string) => string;
};

export function useCustomerDrawer({ onSuccess, t }: Options) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editingCustomerIsActive, setEditingCustomerIsActive] = useState(true);
  const [loadingCustomerDetail, setLoadingCustomerDetail] = useState(false);
  const [formError, setFormError] = useState("");
  const [nameError, setNameError] = useState("");
  const [surnameError, setSurnameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);

  const onOpenDrawer = () => {
    setFormError("");
    setNameError("");
    setSurnameError("");
    setEmailError("");
    setForm(EMPTY_FORM);
    setEditingCustomerId(null);
    setEditingCustomerIsActive(true);
    setDrawerOpen(true);
  };

  const onCloseDrawer = () => {
    if (submitting || loadingCustomerDetail) return;
    setNameError("");
    setSurnameError("");
    setEmailError("");
    setDrawerOpen(false);
  };

  const onFormChange = (field: keyof CustomerForm, value: string) => {
    if (field === "name" && nameError) setNameError("");
    if (field === "surname" && surnameError) setSurnameError("");
    if (field === "email" && emailError) setEmailError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onEditCustomer = async (id: string) => {
    setFormError("");
    setNameError("");
    setSurnameError("");
    setEmailError("");
    setLoadingCustomerDetail(true);
    try {
      const detail = await getCustomerById(id);
      setForm({
        name: detail.name ?? "",
        surname: detail.surname ?? "",
        address: detail.address ?? "",
        country: detail.country ?? "",
        city: detail.city ?? "",
        district: detail.district ?? "",
        phoneNumber: detail.phoneNumber ?? "",
        email: detail.email ?? "",
        gender: detail.gender ?? "",
        birthDate: detail.birthDate ? String(detail.birthDate).slice(0, 10) : "",
      });
      setEditingCustomerId(detail.id);
      setEditingCustomerIsActive(detail.isActive ?? true);
      setDrawerOpen(true);
    } catch {
      setFormError(t("common.loadError"));
    } finally {
      setLoadingCustomerDetail(false);
    }
  };

  const onSubmitCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setNameError("");
    setSurnameError("");
    setEmailError("");

    if (!form.name.trim()) {
      setNameError("Isim alani zorunludur.");
      return;
    }

    if (!form.surname.trim()) {
      setSurnameError("Soyisim alani zorunludur.");
      return;
    }

    if (form.email.trim() && !isValidEmail(form.email)) {
      setEmailError("Gecerli bir e-posta girin.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingCustomerId) {
        await updateCustomer(editingCustomerId, {
          name: form.name.trim(),
          surname: form.surname.trim(),
          address: form.address.trim() || undefined,
          country: form.country.trim() || undefined,
          city: form.city.trim() || undefined,
          district: form.district.trim() || undefined,
          phoneNumber: form.phoneNumber.trim() || undefined,
          email: form.email.trim() || undefined,
          gender: (form.gender || undefined) as CustomerGender | undefined,
          birthDate: form.birthDate || undefined,
          isActive: editingCustomerIsActive,
        });
      } else {
        await createCustomer({
          name: form.name.trim(),
          surname: form.surname.trim(),
          address: form.address.trim() || undefined,
          country: form.country.trim() || undefined,
          city: form.city.trim() || undefined,
          district: form.district.trim() || undefined,
          phoneNumber: form.phoneNumber.trim() || undefined,
          email: form.email.trim() || undefined,
          gender: (form.gender || undefined) as CustomerGender | undefined,
          birthDate: form.birthDate || undefined,
        });
      }

      setDrawerOpen(false);
      setForm(EMPTY_FORM);
      setNameError("");
      setSurnameError("");
      setEmailError("");
      setEditingCustomerId(null);
      setEditingCustomerIsActive(true);
      await onSuccess();
    } catch {
      setFormError(t("common.loadError"));
    } finally {
      setSubmitting(false);
    }
  };

  return {
    drawerOpen,
    submitting,
    editingCustomerId,
    editingCustomerIsActive,
    setEditingCustomerIsActive,
    loadingCustomerDetail,
    formError,
    nameError,
    surnameError,
    emailError,
    form,
    onOpenDrawer,
    onCloseDrawer,
    onFormChange,
    onEditCustomer,
    onSubmitCustomer,
  };
}
