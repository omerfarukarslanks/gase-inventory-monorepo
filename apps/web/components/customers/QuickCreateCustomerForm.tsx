"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { FieldError } from "@/components/ui/FieldError";
import { useLang } from "@/context/LangContext";
import type { CreateCustomerRequest, Customer, CustomerGender } from "@/lib/customers";

type QuickCustomerForm = {
  name: string;
  surname: string;
  address: string;
  country: string;
  city: string;
  district: string;
  phoneNumber: string;
  email: string;
  gender: string;
  birthDate: string;
};

const EMPTY_FORM: QuickCustomerForm = {
  name: "",
  surname: "",
  address: "",
  country: "",
  city: "",
  district: "",
  phoneNumber: "",
  email: "",
  gender: "",
  birthDate: "",
};

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

type QuickCreateCustomerFormProps = {
  drawerOpen: boolean;
  onSuccess: (customer: Customer) => void;
  onQuickCreateCustomer: (payload: CreateCustomerRequest) => Promise<Customer>;
};

export function QuickCreateCustomerForm({
  drawerOpen,
  onSuccess,
  onQuickCreateCustomer,
}: QuickCreateCustomerFormProps) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<QuickCustomerForm>(EMPTY_FORM);

  useEffect(() => {
    if (drawerOpen) return;
    setOpen(false);
    setError("");
    setForm(EMPTY_FORM);
  }, [drawerOpen]);

  const onChangeField = (field: keyof QuickCustomerForm, value: string) => {
    if (error) setError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onCancel = () => {
    if (submitting) return;
    setOpen(false);
    setError("");
    setForm(EMPTY_FORM);
  };

  const onSubmit = async () => {
    if (!form.name.trim() || !form.surname.trim()) {
      setError(t("customers.quickCreate.nameRequired"));
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const created = await onQuickCreateCustomer({
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

      onSuccess(created);
      setOpen(false);
      setError("");
      setForm(EMPTY_FORM);
    } catch {
      setError(t("customers.quickCreate.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          disabled={submitting}
          className="rounded-lg border border-border bg-surface2 px-2 py-1 text-[11px] font-semibold text-text2 transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-60"
        >
          {open ? t("customers.quickCreate.toggleClose") : t("customers.quickCreate.toggleOpen")}
        </button>
      </div>

      {open && (
        <div className="mt-3 rounded-xl border border-border bg-surface2/40 p-3">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">{t("customers.quickCreate.nameLabel")}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => onChangeField("name", e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">{t("customers.quickCreate.surnameLabel")}</label>
              <input
                type="text"
                value={form.surname}
                onChange={(e) => onChangeField("surname", e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">{t("customers.quickCreate.phoneLabel")}</label>
              <input
                type="text"
                value={form.phoneNumber}
                onChange={(e) => onChangeField("phoneNumber", e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">{t("customers.quickCreate.emailLabel")}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => onChangeField("email", e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">{t("customers.quickCreate.countryLabel")}</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => onChangeField("country", e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">{t("customers.quickCreate.cityLabel")}</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => onChangeField("city", e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">{t("customers.quickCreate.districtLabel")}</label>
              <input
                type="text"
                value={form.district}
                onChange={(e) => onChangeField("district", e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">{t("customers.quickCreate.genderLabel")}</label>
              <SearchableDropdown
                options={GENDER_OPTIONS}
                value={form.gender}
                onChange={(value) => onChangeField("gender", value)}
                placeholder={t("customers.quickCreate.genderPlaceholder")}
                emptyOptionLabel={t("customers.quickCreate.genderPlaceholder")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">{t("customers.quickCreate.birthDateLabel")}</label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => onChangeField("birthDate", e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-muted">{t("customers.quickCreate.addressLabel")}</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => onChangeField("address", e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <FieldError error={error} className="mt-2 text-xs text-error" />

          <div className="mt-3 flex items-center justify-end gap-2">
            <Button
              label={t("common.cancel")}
              variant="secondary"
              className="px-2 py-1 text-xs"
              onClick={onCancel}
              disabled={submitting}
            />
            <Button
              label={submitting ? t("customers.quickCreate.adding") : t("customers.quickCreate.submit")}
              variant="primarySolid"
              className="px-2 py-1 text-xs"
              onClick={onSubmit}
              disabled={submitting}
            />
          </div>
        </div>
      )}
    </div>
  );
}
