"use client";

import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";
import InputField from "@/components/ui/InputField";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { FieldError } from "@/components/ui/FieldError";
import { useLang } from "@/context/LangContext";
import type { ProductVariant } from "@/lib/products";

type VariantDetailForm = {
  unitId: string;
  barcode: string;
};

type VariantDetailDrawerProps = {
  open: boolean;
  editingVariant: ProductVariant | null;
  form: VariantDetailForm;
  submitting: boolean;
  formError: string;
  unitOptions: { value: string; label: string }[];
  onClose: () => void;
  onSave: () => void;
  onFormChange: (field: keyof VariantDetailForm, value: string) => void;
};

export default function VariantDetailDrawer({
  open,
  editingVariant,
  form,
  submitting,
  formError,
  unitOptions,
  onClose,
  onSave,
  onFormChange,
}: VariantDetailDrawerProps) {
  const { t } = useLang();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={editingVariant?.name ? `Varyant: ${editingVariant.name}` : "Varyant Düzenle"}
      description="Birim ve barkod bilgilerini güncelleyin"
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
            disabled={submitting}
            variant="primarySolid"
          />
        </div>
      }
    >
      <div className="space-y-4">
        {editingVariant && (
          <div className="rounded-xl border border-border bg-surface2/50 px-3 py-2.5">
            <p className="text-xs font-semibold text-muted">Varyant Kodu</p>
            <p className="text-sm text-text">{editingVariant.code ?? "-"}</p>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted">{t("units.title")}</label>
          <SearchableDropdown
            options={unitOptions}
            value={form.unitId}
            onChange={(v) => onFormChange("unitId", v)}
            placeholder={t("units.selectUnit")}
            emptyOptionLabel={t("units.noUnit")}
          />
        </div>

        <InputField
          label="Barkod"
          type="text"
          value={form.barcode}
          onChange={(v) => onFormChange("barcode", v)}
          placeholder="8680000000001"
        />

        {formError && <FieldError error={formError} />}
      </div>
    </Drawer>
  );
}
