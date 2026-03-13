"use client";

import type { FormEvent } from "react";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { WAREHOUSE_LOCATION_TYPE_OPTIONS, type WarehouseLocationType } from "@/lib/warehouse";
import { useLang } from "@/context/LangContext";

export type LocationFormState = {
  warehouseId: string;
  code: string;
  name: string;
  type: WarehouseLocationType;
  isActive: boolean;
};

type LocationDrawerProps = {
  open: boolean;
  editingLocationId: string | null;
  submitting: boolean;
  form: LocationFormState;
  formError: string;
  warehouseOptions: Array<{ value: string; label: string }>;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFormChange: (field: keyof LocationFormState, value: string | boolean) => void;
};

const INPUT_CLASSNAME =
  "h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";

export default function LocationDrawer({
  open,
  editingLocationId,
  submitting,
  form,
  formError,
  warehouseOptions,
  onClose,
  onSubmit,
  onFormChange,
}: LocationDrawerProps) {
  const { t } = useLang();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={editingLocationId ? t("warehouse.locations.editTitle") : t("warehouse.locations.createTitle")}
      closeDisabled={submitting}
      mobileFullscreen
      className="!max-w-[560px]"
      footer={(
        <div className="flex items-center justify-end gap-2">
          <Button label={t("common.cancel")} onClick={onClose} disabled={submitting} variant="secondary" />
          <Button
            label={submitting ? t("common.saving") : t("common.save")}
            type="submit"
            form="location-form"
            disabled={submitting}
            loading={submitting}
            variant="primarySolid"
          />
        </div>
      )}
    >
      <form id="location-form" onSubmit={onSubmit} className="space-y-4 p-5">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.common.warehouse")} *</label>
          <SearchableDropdown
            options={warehouseOptions}
            value={form.warehouseId}
            onChange={(value) => onFormChange("warehouseId", value)}
            placeholder={t("warehouse.common.warehousePlaceholder")}
            showEmptyOption={false}
            allowClear={false}
            inputAriaLabel={t("warehouse.common.warehouse")}
            toggleAriaLabel={t("warehouse.common.warehouse")}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.common.code")} *</label>
            <input
              className={INPUT_CLASSNAME}
              value={form.code}
              onChange={(event) => onFormChange("code", event.target.value)}
              placeholder={t("warehouse.locations.codePlaceholder")}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.common.type")} *</label>
            <SearchableDropdown
              options={WAREHOUSE_LOCATION_TYPE_OPTIONS}
              value={form.type}
              onChange={(value) => onFormChange("type", value)}
              placeholder={t("warehouse.locations.typeSelectPlaceholder")}
              showEmptyOption={false}
              allowClear={false}
              inputAriaLabel={t("warehouse.common.type")}
              toggleAriaLabel={t("warehouse.common.type")}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.common.location")} *</label>
          <input
            className={INPUT_CLASSNAME}
            value={form.name}
            onChange={(event) => onFormChange("name", event.target.value)}
            placeholder={t("warehouse.locations.namePlaceholder")}
          />
        </div>

        {formError ? <p className="text-sm text-error">{formError}</p> : null}
      </form>
    </Drawer>
  );
}
