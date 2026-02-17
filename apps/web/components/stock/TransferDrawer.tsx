"use client";

import type { ReactNode } from "react";
import type { InventoryStoreStockItem } from "@/lib/inventory";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { cn } from "@/lib/cn";

function formatNumber(value: number | null | undefined) {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return "0";
  return numeric.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted">{label}</label>
      {children}
    </div>
  );
}

export type TransferTarget = {
  productVariantId: string;
  productName: string;
  variantName: string;
  stores: InventoryStoreStockItem[];
};

export type TransferFormState = {
  fromStoreId: string;
  toStoreId: string;
  quantity: string;
  reason: string;
  note: string;
};

type TransferDrawerProps = {
  open: boolean;
  loading: boolean;
  submitting: boolean;
  formError: string;
  target: TransferTarget | null;
  form: TransferFormState;
  allStoreOptions: { value: string; label: string }[];
  isMobile: boolean;
  onClose: () => void;
  onFormChange: (patch: Partial<TransferFormState>) => void;
  onSubmit: () => void;
};

export default function TransferDrawer({
  open,
  loading,
  submitting,
  formError,
  target,
  form,
  allStoreOptions,
  isMobile,
  onClose,
  onFormChange,
  onSubmit,
}: TransferDrawerProps) {
  const fromStoreOptions = (target?.stores ?? []).map((s) => ({
    value: s.storeId,
    label: s.storeName,
  }));

  const toStoreOptions = allStoreOptions.filter(
    (s) => s.value !== form.fromStoreId,
  );

  const selectedFromStore =
    target?.stores.find((s) => s.storeId === form.fromStoreId) ?? null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title="Stok Transfer"
      description={
        target ? `${target.productName} / ${target.variantName}` : ""
      }
      closeDisabled={submitting}
      className={cn(isMobile ? "!max-w-none" : "!max-w-[560px]")}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            label="Iptal"
            type="button"
            onClick={onClose}
            disabled={submitting}
            variant="secondary"
          />
          <Button
            label="Transferi Kaydet"
            type="button"
            onClick={onSubmit}
            loading={submitting}
            variant="primarySolid"
          />
        </div>
      }
    >
      <div className="space-y-3 p-5">
        {loading ? (
          <p className="text-sm text-muted">Transfer bilgileri yukleniyor...</p>
        ) : (
          <>
            <Field label="Hangi Magazadan *">
              <SearchableDropdown
                options={fromStoreOptions}
                value={form.fromStoreId}
                onChange={(value) => onFormChange({ fromStoreId: value })}
                placeholder="Kaynak magaza secin"
                showEmptyOption={false}
              />
            </Field>

            <Field label="Hangi Magazaya *">
              <SearchableDropdown
                options={toStoreOptions}
                value={form.toStoreId}
                onChange={(value) => onFormChange({ toStoreId: value })}
                placeholder="Hedef magaza secin"
                showEmptyOption={false}
              />
            </Field>

            {selectedFromStore && (
              <div className="rounded-xl border border-border bg-surface2/20 px-3 py-2 text-xs text-muted">
                Kaynak magaza stok:{" "}
                <span className="font-semibold text-text">
                  {formatNumber(selectedFromStore.quantity)}
                </span>
              </div>
            )}

            <Field label="Adet *">
              <input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => onFormChange({ quantity: e.target.value })}
                className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </Field>

            <Field label="Sebep">
              <input
                type="text"
                value={form.reason}
                onChange={(e) => onFormChange({ reason: e.target.value })}
                placeholder="Transfer sebebi"
                className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </Field>

            <Field label="Not">
              <textarea
                value={form.note}
                onChange={(e) => onFormChange({ note: e.target.value })}
                placeholder="Aciklama"
                className="min-h-[90px] w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </Field>
          </>
        )}

        {formError && <p className="text-sm text-error">{formError}</p>}
      </div>
    </Drawer>
  );
}
