import { createCustomer } from "@gase/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TextInput } from "react-native";
import { trackEvent } from "@/src/lib/analytics";
import type { RequestEnvelope, CustomersRequest } from "@/src/lib/workflows";

const emptyForm = {
  name: "",
  surname: "",
  phoneNumber: "",
  email: "",
};

export function useCustomerForm({
  fetchCustomers,
  request,
}: {
  fetchCustomers: () => Promise<void>;
  request?: RequestEnvelope<CustomersRequest> | null;
}) {
  const handledRequestId = useRef<number | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formAttempted, setFormAttempted] = useState(false);
  const [composerError, setComposerError] = useState("");

  const surnameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  const phoneDigits = useMemo(
    () => form.phoneNumber.replace(/\D/g, ""),
    [form.phoneNumber],
  );
  const emailValue = form.email.trim().toLowerCase();

  const nameError = useMemo(() => {
    if (!formAttempted && !form.name.trim()) return "";
    return form.name.trim() ? "" : "Ad zorunlu.";
  }, [form.name, formAttempted]);

  const surnameError = useMemo(() => {
    if (!formAttempted && !form.surname.trim()) return "";
    return form.surname.trim() ? "" : "Soyad zorunlu.";
  }, [form.surname, formAttempted]);

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

  const formHasErrors = Boolean(nameError || surnameError || phoneError || emailError);
  const canSubmit = Boolean(
    form.name.trim() &&
      form.surname.trim() &&
      !phoneError &&
      !emailError,
  );

  const openComposerModal = useCallback(() => {
    setComposerOpen(true);
    setFormAttempted(false);
    setComposerError("");
    setForm(emptyForm);
  }, []);

  const closeComposerModal = useCallback(() => {
    setComposerOpen(false);
    setComposerError("");
    setFormAttempted(false);
    setForm(emptyForm);
  }, []);

  useEffect(() => {
    if (!request || handledRequestId.current === request.id) return;
    handledRequestId.current = request.id;

    if (request.payload.kind === "compose") {
      openComposerModal();
    }
  }, [openComposerModal, request]);

  const onCreateCustomer = async () => {
    setFormAttempted(true);

    if (formHasErrors || !canSubmit) {
      trackEvent("validation_error", { screen: "customers", field: "name_surname" });
      setComposerError("Zorunlu alanlari duzeltip tekrar dene.");
      return;
    }

    setSubmitting(true);
    setComposerError("");
    try {
      await createCustomer({
        name: form.name.trim(),
        surname: form.surname.trim(),
        phoneNumber: form.phoneNumber.trim() || undefined,
        email: emailValue || undefined,
      });
      closeComposerModal();
      await fetchCustomers();
    } catch (nextError) {
      setComposerError(nextError instanceof Error ? nextError.message : "Musteri olusturulamadi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldChange = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (composerError) setComposerError("");
  };

  return {
    composerOpen,
    submitting,
    form,
    formAttempted,
    composerError,
    nameError,
    surnameError,
    phoneError,
    emailError,
    formHasErrors,
    canSubmit,
    phoneDigits,
    emailValue,
    surnameRef,
    phoneRef,
    emailRef,
    openComposerModal,
    closeComposerModal,
    onCreateCustomer,
    handleFieldChange,
  };
}
