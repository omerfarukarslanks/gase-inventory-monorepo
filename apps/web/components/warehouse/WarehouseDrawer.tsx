"use client";

import type { FormEvent } from "react";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { useLang } from "@/context/LangContext";

export type WarehouseFormState = {
  storeId: string;
  name: string;
  address: string;
  isActive: boolean;
};

type WarehouseDrawerProps = {
  open: boolean;
  editingWarehouseId: string | null;
  submitting: boolean;
  form: WarehouseFormState;
  formError: string;
  storeOptions: Array<{ value: string; label: string }>;
  showStoreSelector: boolean;
  fixedStoreId?: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFormChange: (field: keyof WarehouseFormState, value: string | boolean) => void;
};

const INPUT_CLASSNAME =
  "h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";

export default function WarehouseDrawer({
  open,
  editingWarehouseId,
  submitting,
  form,
  formError,
  storeOptions,
  showStoreSelector,
  fixedStoreId,
  onClose,
  onSubmit,
  onFormChange,
}: WarehouseDrawerProps) {
  const { t } = useLang();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={editingWarehouseId ? t("warehouse.warehouses.editTitle") : t("warehouse.warehouses.createTitle")}
      description={showStoreSelector ? undefined : t("warehouse.warehouses.storeContextDescription")}
      closeDisabled={submitting}
      mobileFullscreen
      className="!max-w-[560px]"
      footer={(
        <div className="flex items-center justify-end gap-2">
          <Button label={t("common.cancel")} onClick={onClose} disabled={submitting} variant="secondary" />
          <Button
            label={submitting ? t("common.saving") : t("common.save")}
            type="submit"
            form="warehouse-form"
            disabled={submitting}
            loading={submitting}
            variant="primarySolid"
          />
        </div>
      )}
    >
      <form id="warehouse-form" onSubmit={onSubmit} className="space-y-4 p-5">
        {showStoreSelector ? (
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("common.storeFilter")} *</label>
            <SearchableDropdown
              options={storeOptions}
              value={form.storeId}
              onChange={(value) => onFormChange("storeId", value)}
              placeholder={t("warehouse.common.storePlaceholder")}
              showEmptyOption={false}
              allowClear={false}
              inputAriaLabel={t("common.storeFilter")}
              toggleAriaLabel={t("common.storeFilter")}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface2/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("common.storeFilter")}</p>
            <p className="mt-2 text-sm font-semibold text-text">
              {storeOptions.find((option) => option.value === (fixedStoreId || form.storeId))?.label ?? t("shell.activeStore")}
            </p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.warehouses.nameLabel")} *</label>
          <input
            className={INPUT_CLASSNAME}
            value={form.name}
            onChange={(event) => onFormChange("name", event.target.value)}
            placeholder={t("warehouse.warehouses.namePlaceholder")}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.common.address")}</label>
          <textarea
            className="min-h-28 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            value={form.address}
            onChange={(event) => onFormChange("address", event.target.value)}
            placeholder={t("warehouse.warehouses.addressPlaceholder")}
          />
        </div>

        {formError ? <p className="text-sm text-error">{formError}</p> : null}
      </form>
    </Drawer>
  );
}
