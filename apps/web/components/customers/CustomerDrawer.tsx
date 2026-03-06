"use client";

import type { FormEvent } from "react";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { cn } from "@/lib/cn";
import { useLang } from "@/context/LangContext";
import { GENDER_OPTIONS, type CustomerForm } from "@/components/customers/types";

type CustomerDrawerProps = {
  open: boolean;
  editingCustomerId: string | null;
  submitting: boolean;
  loadingCustomerDetail: boolean;
  isMobile: boolean;
  form: CustomerForm;
  formError: string;
  nameError: string;
  surnameError: string;
  emailError: string;
  editingCustomerIsActive: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFormChange: (field: keyof CustomerForm, value: string) => void;
  onEditingCustomerIsActiveChange: (value: boolean) => void;
};

export default function CustomerDrawer({
  open,
  editingCustomerId,
  submitting,
  loadingCustomerDetail,
  isMobile,
  form,
  formError,
  nameError,
  surnameError,
  emailError,
  editingCustomerIsActive,
  onClose,
  onSubmit,
  onFormChange,
  onEditingCustomerIsActiveChange,
}: CustomerDrawerProps) {
  const { t } = useLang();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={editingCustomerId ? t("customers.update") : t("customers.new")}
      description={editingCustomerId ? t("customers.update") : t("customers.new")}
      closeDisabled={submitting || loadingCustomerDetail}
      className={cn(isMobile && "!max-w-none")}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            label={t("common.cancel")}
            type="button"
            onClick={onClose}
            disabled={submitting || loadingCustomerDetail}
            variant="secondary"
          />
          <Button
            label={submitting ? (editingCustomerId ? t("common.updating") : t("common.creating")) : t("common.save")}
            type="submit"
            form="customer-form"
            disabled={submitting || loadingCustomerDetail}
            variant="primarySolid"
          />
        </div>
      }
    >
      <form id="customer-form" onSubmit={onSubmit} className="space-y-4 p-5">
        {loadingCustomerDetail ? (
          <div className="text-sm text-muted">{t("common.loading")}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InputField
                label={`${t("customers.colName")} *`}
                type="text"
                value={form.name}
                onChange={(value) => onFormChange("name", value)}
                placeholder="Ahmet"
                error={nameError}
              />
              <InputField
                label="Soyisim *"
                type="text"
                value={form.surname}
                onChange={(value) => onFormChange("surname", value)}
                placeholder="Yilmaz"
                error={surnameError}
              />
            </div>

            <InputField
              label="Adres"
              type="text"
              value={form.address}
              onChange={(value) => onFormChange("address", value)}
              placeholder="Ataturk Cad. No:1"
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <InputField
                label="Ulke"
                type="text"
                value={form.country}
                onChange={(value) => onFormChange("country", value)}
                placeholder="Turkiye"
              />
              <InputField
                label="Sehir"
                type="text"
                value={form.city}
                onChange={(value) => onFormChange("city", value)}
                placeholder="Istanbul"
              />
              <InputField
                label="Ilce"
                type="text"
                value={form.district}
                onChange={(value) => onFormChange("district", value)}
                placeholder="Kadikoy"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InputField
                label={t("customers.colPhone")}
                type="text"
                value={form.phoneNumber}
                onChange={(value) => onFormChange("phoneNumber", value)}
                placeholder="+905321234567"
              />
              <InputField
                label={t("customers.colEmail")}
                type="email"
                value={form.email}
                onChange={(value) => onFormChange("email", value)}
                placeholder="ahmet@example.com"
                error={emailError}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Cinsiyet</label>
                <SearchableDropdown
                  options={GENDER_OPTIONS}
                  value={form.gender}
                  onChange={(value) => onFormChange("gender", value)}
                  placeholder="Cinsiyet secin"
                  emptyOptionLabel="Cinsiyet secin"
                  inputAriaLabel="Cinsiyet secimi"
                  clearAriaLabel="Cinsiyet secimini temizle"
                  toggleAriaLabel="Cinsiyet listesini ac"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Dogum Tarihi</label>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(event) => onFormChange("birthDate", event.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {editingCustomerId && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-surface2/40 px-3 py-2.5">
                <span className="text-xs font-semibold text-muted">{t("common.active")}</span>
                <ToggleSwitch
                  checked={editingCustomerIsActive}
                  onChange={onEditingCustomerIsActiveChange}
                  disabled={submitting || loadingCustomerDetail}
                />
              </div>
            )}

            {formError && <p className="text-sm text-error">{formError}</p>}
          </>
        )}
      </form>
    </Drawer>
  );
}
