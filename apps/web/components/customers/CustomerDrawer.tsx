"use client";

import type { FormEvent } from "react";
import Drawer, { DrawerFooter } from "@/components/ui/Drawer";
import InputField from "@/components/ui/InputField";
import PhoneInput from "@/components/ui/PhoneInput";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { useLang } from "@/context/LangContext";
import { GENDER_OPTIONS, type CustomerForm } from "@/components/customers/types";

type CustomerDrawerProps = {
  open: boolean;
  editingCustomerId: string | null;
  submitting: boolean;
  loadingCustomerDetail: boolean;
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
      mobileFullscreen
      footer={
        <DrawerFooter
          cancelLabel={t("common.cancel")}
          onCancel={onClose}
          cancelDisabled={submitting || loadingCustomerDetail}
          formId="customer-form"
          saveLabel={t("common.save")}
          saveDisabled={submitting || loadingCustomerDetail}
          saving={submitting}
        />
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
                label={t("customers.surname")}
                type="text"
                value={form.surname}
                onChange={(value) => onFormChange("surname", value)}
                placeholder={t("customers.surnamePlaceholder")}
                error={surnameError}
              />
            </div>

            <InputField
              label={t("customers.address")}
              type="text"
              value={form.address}
              onChange={(value) => onFormChange("address", value)}
              placeholder={t("customers.addressPlaceholder")}
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <InputField
                label={t("customers.country")}
                type="text"
                value={form.country}
                onChange={(value) => onFormChange("country", value)}
                placeholder={t("customers.countryPlaceholder")}
              />
              <InputField
                label={t("customers.city")}
                type="text"
                value={form.city}
                onChange={(value) => onFormChange("city", value)}
                placeholder={t("customers.cityPlaceholder")}
              />
              <InputField
                label={t("customers.district")}
                type="text"
                value={form.district}
                onChange={(value) => onFormChange("district", value)}
                placeholder={t("customers.districtPlaceholder")}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">{t("customers.colPhone")}</label>
                <PhoneInput
                  countryCode={form.phoneCountry}
                  localNumber={form.phoneNumber}
                  onCountryChange={(code) => onFormChange("phoneCountry", code)}
                  onNumberChange={(value) => onFormChange("phoneNumber", value)}
                />
              </div>
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
                <label className="text-xs font-semibold text-muted">{t("customers.gender")}</label>
                <SearchableDropdown
                  options={GENDER_OPTIONS}
                  value={form.gender}
                  onChange={(value) => onFormChange("gender", value)}
                  placeholder={t("customers.genderPlaceholder")}
                  emptyOptionLabel={t("customers.genderPlaceholder")}
                  inputAriaLabel={t("customers.genderSelectAria")}
                  clearAriaLabel={t("customers.genderClearAria")}
                  toggleAriaLabel={t("customers.genderToggleAria")}
                  showSearchInput={false}
                  menuPlacement="top"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">{t("customers.birthDate")}</label>
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
