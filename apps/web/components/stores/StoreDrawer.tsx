"use client";

import type { FormEvent } from "react";
import Drawer, { DrawerFooter } from "@/components/ui/Drawer";
import InputField from "@/components/ui/InputField";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
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

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted">{t("stores.storeType")}</label>
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
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted">{t("stores.currency")}</label>
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
            </div>

            <InputField
              label={t("stores.address")}
              type="text"
              value={form.address}
              onChange={(value) => onFormChange("address", value)}
              placeholder={t("stores.addressPlaceholder")}
            />

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted">Kimlik No</label>
                <div className="flex overflow-hidden rounded-lg border border-border text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      onFormChange("taxIdType", "tckn");
                      onFormChange("taxIdValue", "");
                    }}
                    className={[
                      "px-2.5 py-1 transition",
                      form.taxIdType === "tckn" ? "bg-primary text-white" : "text-muted hover:bg-surface2",
                    ].join(" ")}
                  >
                    TCKN
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onFormChange("taxIdType", "taxNumber");
                      onFormChange("taxIdValue", "");
                    }}
                    className={[
                      "px-2.5 py-1 transition",
                      form.taxIdType === "taxNumber" ? "bg-primary text-white" : "text-muted hover:bg-surface2",
                    ].join(" ")}
                  >
                    Vergi No
                  </button>
                </div>
              </div>
              <InputField
                label=""
                type="text"
                value={form.taxIdValue}
                onChange={(v) => {
                  const digits = v.replace(/\D/g, "");
                  const max = form.taxIdType === "tckn" ? 11 : 10;
                  onFormChange("taxIdValue", digits.slice(0, max));
                }}
                placeholder={form.taxIdType === "tckn" ? "11 haneli TCKN" : "10 haneli Vergi No"}
                error={taxIdError}
              />
            </div>

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

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted">{t("stores.description")}</label>
              <textarea
                value={form.description}
                onChange={(event) => onFormChange("description", event.target.value)}
                className="min-h-[92px] w-full rounded-xl2 border border-border bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
                placeholder={t("stores.descPlaceholder")}
              />
            </div>

            {formError && <p className="text-sm text-error">{formError}</p>}
          </>
        )}
      </form>
    </Drawer>
  );
}
