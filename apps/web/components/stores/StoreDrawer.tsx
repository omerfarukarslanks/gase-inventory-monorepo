"use client";

import type { FormEvent } from "react";
import Drawer, { DrawerFooter } from "@/components/ui/Drawer";
import FormField from "@/components/ui/FormField";
import InputField from "@/components/ui/InputField";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import SegmentedControl from "@/components/ui/SegmentedControl";
import TextareaField from "@/components/ui/TextareaField";
import { CURRENCY_OPTIONS } from "@/components/products/types";
import { useLang } from "@/context/LangContext";
import type { Currency } from "@/lib/products";
import type { StoreType } from "@/lib/stores";
import type { StoreForm } from "@/components/stores/types";

type StoreDrawerProps = {
  open: boolean;
  editingStoreId: string | null;
  submitting: boolean;
  loadingStoreDetail: boolean;
  form: StoreForm;
  formError: string;
  nameError: string;
  taxIdError: string;
  storeTypeOptions: ReadonlyArray<{ value: StoreType; label: string }>;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFormChange: <K extends keyof StoreForm>(field: K, value: StoreForm[K]) => void;
  normalizeCurrency: (value: string) => Currency;
  normalizeStoreType: (value: string) => StoreType;
};

export default function StoreDrawer({
  open,
  editingStoreId,
  submitting,
  loadingStoreDetail,
  form,
  formError,
  nameError,
  taxIdError,
  storeTypeOptions,
  onClose,
  onSubmit,
  onFormChange,
  normalizeCurrency,
  normalizeStoreType,
}: StoreDrawerProps) {
  const { t } = useLang();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={editingStoreId ? t("stores.update") : t("stores.create")}
      description={editingStoreId ? t("stores.update") : t("stores.name")}
      closeDisabled={submitting || loadingStoreDetail}
      mobileFullscreen
      footer={
        <DrawerFooter
          cancelLabel={t("common.cancel")}
          onCancel={onClose}
          cancelDisabled={submitting || loadingStoreDetail}
          formId="create-store-form"
          saveLabel={editingStoreId ? t("stores.update") : t("stores.create")}
          saveDisabled={submitting || loadingStoreDetail}
          saving={submitting}
        />
      }
    >
      <form id="create-store-form" onSubmit={onSubmit} className="space-y-4 p-5">
        {loadingStoreDetail ? (
          <div className="text-sm text-muted">{t("stores.loadingDetail")}</div>
        ) : (
          <>
            <InputField
              label={t("stores.name")}
              type="text"
              value={form.name}
              onChange={(value) => onFormChange("name", value)}
              placeholder={t("stores.namePlaceholder")}
              error={nameError}
            />

            <InputField
              label={t("stores.code")}
              type="text"
              value={form.code}
              onChange={(value) => onFormChange("code", value)}
              placeholder={t("stores.codePlaceholder")}
            />

            <FormField label={t("stores.storeType")}>
              <SearchableDropdown
                options={[...storeTypeOptions]}
                value={form.storeType}
                onChange={(value) => onFormChange("storeType", normalizeStoreType(value))}
                placeholder={t("stores.storeTypePlaceholder")}
                showEmptyOption={false}
                allowClear={false}
                inputAriaLabel={t("stores.storeType")}
                toggleAriaLabel={t("stores.storeType")}
                disabled={Boolean(editingStoreId)}
              />
            </FormField>

            <FormField label={t("stores.currency")}>
              <SearchableDropdown
                options={CURRENCY_OPTIONS}
                value={form.currency}
                onChange={(value) => onFormChange("currency", normalizeCurrency(value))}
                placeholder={t("stores.currencyPlaceholder")}
                showEmptyOption={false}
                allowClear={false}
                inputAriaLabel={t("stores.currency")}
                toggleAriaLabel={t("stores.currency")}
                disabled={Boolean(editingStoreId)}
              />
            </FormField>

            <InputField
              label={t("stores.address")}
              type="text"
              value={form.address}
              onChange={(value) => onFormChange("address", value)}
              placeholder={t("stores.addressPlaceholder")}
            />

            <div className="grid grid-cols-3 gap-3">
              <InputField
                label={t("stores.country")}
                type="text"
                value={form.country}
                onChange={(value) => onFormChange("country", value)}
                placeholder={t("stores.countryPlaceholder")}
              />
              <InputField
                label={t("stores.city")}
                type="text"
                value={form.city}
                onChange={(value) => onFormChange("city", value)}
                placeholder={t("stores.cityPlaceholder")}
              />
              <InputField
                label={t("stores.district")}
                type="text"
                value={form.district}
                onChange={(value) => onFormChange("district", value)}
                placeholder={t("stores.districtPlaceholder")}
              />
            </div>

            <FormField label={t("stores.identityNumber")} error={taxIdError} className="space-y-2">
              <SegmentedControl
                ariaLabel={t("stores.identityTypeAria")}
                options={[
                  { value: "tckn", label: "TCKN" },
                  { value: "taxNo", label: "Vergi No" },
                ]}
                value={form.taxIdType}
                onChange={(value) => {
                  onFormChange("taxIdType", value as StoreForm["taxIdType"]);
                  onFormChange("taxIdValue", "");
                }}
                className="gap-2"
                buttonClassName="text-xs font-semibold"
              />
              <InputField
                label={undefined}
                type="text"
                value={form.taxIdValue}
                onChange={(v) => {
                  const digits = v.replace(/\D/g, "");
                  const max = form.taxIdType === "tckn" ? 11 : 10;
                  onFormChange("taxIdValue", digits.slice(0, max));
                }}
                placeholder={form.taxIdType === "tckn" ? t("stores.tcknPlaceholder") : t("stores.taxNumberPlaceholder")}
              />
            </FormField>

            <InputField
              label={t("stores.slug")}
              type="text"
              value={form.slug}
              onChange={(value) => onFormChange("slug", value)}
              placeholder={t("stores.slugPlaceholder")}
            />

            <InputField
              label={t("stores.logo")}
              type="text"
              value={form.logo}
              onChange={(value) => onFormChange("logo", value)}
              placeholder={t("stores.logoPlaceholder")}
            />

            <TextareaField
              label={t("stores.description")}
              value={form.description}
              onChange={(value) => onFormChange("description", value)}
              placeholder={t("stores.descPlaceholder")}
              rows={4}
              textareaClassName="min-h-[92px]"
            />

            {formError && <p className="text-sm text-error">{formError}</p>}
          </>
        )}
      </form>
    </Drawer>
  );
}
