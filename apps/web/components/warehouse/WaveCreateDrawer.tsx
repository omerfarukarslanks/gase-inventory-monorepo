"use client";

import { useMemo, useState } from "react";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { useLang } from "@/context/LangContext";
import type { CreateWavePayload } from "@/lib/warehouse";

type WaveCreateDrawerProps = {
  open: boolean;
  submitting: boolean;
  warehouseOptions: Array<{ value: string; label: string }>;
  initialWarehouseId?: string;
  onClose: () => void;
  onSubmit: (payload: CreateWavePayload) => Promise<void>;
};

export default function WaveCreateDrawer({
  open,
  submitting,
  warehouseOptions,
  initialWarehouseId,
  onClose,
  onSubmit,
}: WaveCreateDrawerProps) {
  const { t } = useLang();
  const [warehouseId, setWarehouseId] = useState(initialWarehouseId ?? "");
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  const resolvedWarehouseId = useMemo(() => {
    if (warehouseId && warehouseOptions.some((option) => option.value === warehouseId)) return warehouseId;
    return initialWarehouseId && warehouseOptions.some((option) => option.value === initialWarehouseId)
      ? initialWarehouseId
      : (warehouseOptions[0]?.value ?? "");
  }, [initialWarehouseId, warehouseId, warehouseOptions]);

  const handleSubmit = async () => {
    if (!resolvedWarehouseId) {
      setFormError(t("warehouse.waves.warehouseRequired"));
      return;
    }
    if (!code.trim()) {
      setFormError(t("warehouse.waves.codeRequired"));
      return;
    }

    setFormError("");
    await onSubmit({
      warehouseId: resolvedWarehouseId,
      code: code.trim(),
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={t("warehouse.waves.createTitle")}
      closeDisabled={submitting}
      mobileFullscreen
      className="!max-w-[560px]"
      footer={(
        <div className="flex items-center justify-end gap-2">
          <Button label={t("common.cancel")} onClick={onClose} disabled={submitting} variant="secondary" />
          <Button
            label={submitting ? t("common.saving") : t("common.save")}
            onClick={() => void handleSubmit()}
            disabled={submitting}
            loading={submitting}
            variant="primarySolid"
          />
        </div>
      )}
    >
      <div className="space-y-4 p-5">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.common.warehouse")} *</label>
          <SearchableDropdown
            options={warehouseOptions}
            value={resolvedWarehouseId}
            onChange={(value) => {
              setWarehouseId(value);
              setFormError("");
            }}
            placeholder={t("warehouse.common.warehousePlaceholder")}
            showEmptyOption={false}
            allowClear={false}
            disabled={warehouseOptions.length === 0}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.waves.codeLabel")} *</label>
          <input
            type="text"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setFormError("");
            }}
            placeholder="WAVE-20260313-001"
            className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.common.note")}</label>
          <textarea
            className="min-h-28 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t("warehouse.waves.notesPlaceholder")}
          />
        </div>

        {formError ? <p className="text-sm text-error">{formError}</p> : null}
      </div>
    </Drawer>
  );
}
