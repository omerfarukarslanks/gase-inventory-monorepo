"use client";

import { useMemo, useState } from "react";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import type { CreateCountSessionPayload, Warehouse } from "@/lib/warehouse";
import { useLang } from "@/context/LangContext";

type CountSessionCreateDrawerProps = {
  open: boolean;
  submitting: boolean;
  showStoreSelector: boolean;
  fixedStoreId?: string;
  storeOptions: Array<{ value: string; label: string }>;
  warehouses: Warehouse[];
  onClose: () => void;
  onSubmit: (payload: CreateCountSessionPayload) => Promise<void>;
};

export default function CountSessionCreateDrawer({
  open,
  submitting,
  showStoreSelector,
  fixedStoreId,
  storeOptions,
  warehouses,
  onClose,
  onSubmit,
}: CountSessionCreateDrawerProps) {
  const { t } = useLang();
  const [storeId, setStoreId] = useState(fixedStoreId || storeOptions[0]?.value || "");
  const [warehouseId, setWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  const resolvedStoreId = fixedStoreId || storeId || storeOptions[0]?.value || "";

  const availableWarehouses = useMemo(
    () => warehouses.filter((warehouse) => (!resolvedStoreId ? true : warehouse.storeId === resolvedStoreId)),
    [resolvedStoreId, warehouses],
  );

  const warehouseOptions = useMemo(
    () => availableWarehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name })),
    [availableWarehouses],
  );

  const resolvedWarehouseId =
    warehouseId && availableWarehouses.some((warehouse) => warehouse.id === warehouseId)
      ? warehouseId
      : (availableWarehouses[0]?.id ?? "");

  const submit = async () => {
    const targetStoreId = resolvedStoreId;
    if (!targetStoreId) {
      setFormError(t("warehouse.warehouses.storeRequired"));
      return;
    }
    if (!resolvedWarehouseId) {
      setFormError(t("warehouse.locations.warehouseRequired"));
      return;
    }

    setFormError("");
    await onSubmit({
      storeId: targetStoreId,
      warehouseId: resolvedWarehouseId,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={t("warehouse.countSessions.createTitle")}
      closeDisabled={submitting}
      mobileFullscreen
      className="!max-w-[560px]"
      footer={(
        <div className="flex items-center justify-end gap-2">
          <Button label={t("common.cancel")} onClick={onClose} disabled={submitting} variant="secondary" />
          <Button
            label={submitting ? t("common.saving") : t("common.save")}
            onClick={() => void submit()}
            disabled={submitting}
            loading={submitting}
            variant="primarySolid"
          />
        </div>
      )}
    >
      <div className="space-y-4 p-5">
        {showStoreSelector ? (
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("common.storeFilter")} *</label>
            <SearchableDropdown
              options={storeOptions}
              value={resolvedStoreId}
              onChange={(value) => {
                setStoreId(value);
                setWarehouseId("");
                setFormError("");
              }}
              placeholder={t("warehouse.common.storePlaceholder")}
              showEmptyOption={false}
              allowClear={false}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface2/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("common.storeFilter")}</p>
            <p className="mt-2 text-sm font-semibold text-text">
              {storeOptions.find((option) => option.value === fixedStoreId)?.label ?? t("shell.activeStore")}
            </p>
          </div>
        )}

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
          <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.common.note")}</label>
          <textarea
            className="min-h-28 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t("warehouse.countSessions.notePlaceholder")}
          />
        </div>

        {formError ? <p className="text-sm text-error">{formError}</p> : null}
      </div>
    </Drawer>
  );
}
