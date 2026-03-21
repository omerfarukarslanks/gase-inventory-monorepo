"use client";

import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";
import InputField from "@/components/ui/InputField";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { FieldError } from "@/components/ui/FieldError";
import { useLang } from "@/context/LangContext";
import type { Unit } from "@gase/core";

type UnitForm = {
  name: string;
  abbreviation: string;
  isActive: boolean;
};

type UnitDrawerProps = {
  open: boolean;
  editingId: string | null;
  editingUnit: Unit | null;
  form: UnitForm;
  submitting: boolean;
  detailLoading: boolean;
  formError: string;
  nameError: string;
  abbreviationError: string;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (field: keyof UnitForm, value: string | boolean) => void;
};

export default function UnitDrawer({
  open,
  editingId,
  editingUnit,
  form,
  submitting,
  detailLoading,
  formError,
  nameError,
  abbreviationError,
  onClose,
  onSave,
  onFormChange,
}: UnitDrawerProps) {
  const { t } = useLang();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={editingId ? t("units.editTitle") : t("units.createTitle")}
      closeDisabled={submitting}
      mobileFullscreen
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            label={t("common.cancel")}
            onClick={onClose}
            disabled={submitting}
            variant="secondary"
          />
          <Button
            label={t("common.save")}
            onClick={onSave}
            loading={submitting}
            disabled={submitting || detailLoading}
            variant="primarySolid"
          />
        </div>
      }
    >
      <div className="space-y-4">
        <InputField
          label={`${t("units.name")} *`}
          type="text"
          value={form.name}
          onChange={(v) => onFormChange("name", v)}
          placeholder="Kilogram"
          error={nameError}
          disabled={detailLoading}
        />

        <InputField
          label={`${t("units.abbreviation")} *`}
          type="text"
          value={form.abbreviation}
          onChange={(v) => onFormChange("abbreviation", v)}
          placeholder={t("units.abbreviationPlaceholder")}
          error={abbreviationError}
          disabled={detailLoading}
        />

        {editingId && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface2/40 px-3 py-2.5">
            <div>
              <p className="text-xs font-semibold text-muted">{t("common.status")}</p>
              {editingUnit?.isDefault && (
                <p className="text-xs text-muted">{t("units.cannotDeactivateDefault")}</p>
              )}
            </div>
            <ToggleSwitch
              checked={form.isActive}
              onChange={(v) => onFormChange("isActive", v)}
              disabled={submitting || editingUnit?.isDefault === true}
            />
          </div>
        )}

        {formError && (
          <FieldError error={formError} />
        )}
      </div>
    </Drawer>
  );
}
