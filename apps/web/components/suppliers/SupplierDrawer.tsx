"use client";

import type { FormEvent } from "react";
import Drawer, { DrawerFooter } from "@/components/ui/Drawer";
import InputField from "@/components/ui/InputField";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { cn } from "@/lib/cn";
import { useLang } from "@/context/LangContext";
import type { SupplierForm } from "@/components/suppliers/types";

type SupplierDrawerProps = {
  open: boolean;
  editingSupplierId: string | null;
  submitting: boolean;
  loadingSupplierDetail: boolean;
  isMobile: boolean;
  form: SupplierForm;
  formError: string;
  nameError: string;
  emailError: string;
  editingSupplierIsActive: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFormChange: (field: keyof SupplierForm, value: string) => void;
  onEditingSupplierIsActiveChange: (value: boolean) => void;
};

export default function SupplierDrawer({
  open,
  editingSupplierId,
  submitting,
  loadingSupplierDetail,
  isMobile,
  form,
  formError,
  nameError,
  emailError,
  editingSupplierIsActive,
  onClose,
  onSubmit,
  onFormChange,
  onEditingSupplierIsActiveChange,
}: SupplierDrawerProps) {
  const { t } = useLang();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={editingSupplierId ? t("suppliers.update") : t("suppliers.new")}
      description={editingSupplierId ? t("suppliers.update") : t("suppliers.new")}
      closeDisabled={submitting || loadingSupplierDetail}
      className={cn(isMobile && "!max-w-none")}
      footer={
        <DrawerFooter
          cancelLabel={t("common.cancel")}
          onCancel={onClose}
          cancelDisabled={submitting || loadingSupplierDetail}
          formId="supplier-form"
          saveLabel={t("common.save")}
          saveDisabled={submitting || loadingSupplierDetail}
          saving={submitting}
        />
      }
    >
      <form id="supplier-form" onSubmit={onSubmit} className="space-y-4 p-5">
        {loadingSupplierDetail ? (
          <div className="text-sm text-muted">{t("suppliers.loadingDetail")}</div>
        ) : (
          <>
            <InputField
              label={`${t("suppliers.name")} *`}
              type="text"
              value={form.name}
              onChange={(value) => onFormChange("name", value)}
              placeholder={t("suppliers.namePlaceholder")}
              error={nameError}
            />

            <InputField
              label={t("suppliers.surname")}
              type="text"
              value={form.surname}
              onChange={(value) => onFormChange("surname", value)}
              placeholder={t("suppliers.surnamePlaceholder")}
            />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted">{t("suppliers.address")}</label>
              <textarea
                value={form.address}
                onChange={(event) => onFormChange("address", event.target.value)}
                className="min-h-[92px] w-full rounded-xl2 border border-border bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
                placeholder={t("suppliers.addressPlaceholder")}
              />
            </div>

            <InputField
              label={t("suppliers.phone")}
              type="text"
              value={form.phoneNumber}
              onChange={(value) => onFormChange("phoneNumber", value)}
              placeholder={t("suppliers.phonePlaceholder")}
            />

            <InputField
              label={t("suppliers.email")}
              type="email"
              value={form.email}
              onChange={(value) => onFormChange("email", value)}
              placeholder={t("suppliers.emailPlaceholder")}
              error={emailError}
            />

            {editingSupplierId && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-surface2/40 px-3 py-2.5">
                <span className="text-xs font-semibold text-muted">{t("suppliers.active")}</span>
                <ToggleSwitch
                  checked={editingSupplierIsActive}
                  onChange={onEditingSupplierIsActiveChange}
                  disabled={submitting || loadingSupplierDetail}
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
