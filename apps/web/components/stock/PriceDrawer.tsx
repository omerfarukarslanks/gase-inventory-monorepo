"use client";

import { type ReactNode, useEffect, useState } from "react";
import type { InventoryStoreStockItem } from "@/lib/inventory";
import type { Currency } from "@/lib/products";
import { updateStorePrice, type StorePricePayload } from "@/lib/store-prices";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import SearchableMultiSelectDropdown from "@/components/ui/SearchableMultiSelectDropdown";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { cn } from "@/lib/cn";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted">{label}</label>
      {children}
    </div>
  );
}

const CURRENCY_OPTIONS = [
  { value: "TRY", label: "TRY" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
];

export type PriceTarget = {
  productVariantId: string;
  productName: string;
  variantName: string;
  stores: InventoryStoreStockItem[];
};

export type PriceFormState = {
  storeIds: string[];
  applyToAllStores: boolean;
  unitPrice: string;
  currency: Currency;
  discountPercent: string;
  discountAmount: string;
  taxPercent: string;
  taxAmount: string;
  lineTotal: string;
};

const EMPTY_PRICE_FORM: PriceFormState = {
  storeIds: [],
  applyToAllStores: false,
  unitPrice: "",
  currency: "TRY",
  discountPercent: "",
  discountAmount: "",
  taxPercent: "",
  taxAmount: "",
  lineTotal: "",
};

type PriceDrawerProps = {
  open: boolean;
  target: PriceTarget | null;
  allStoreOptions: { value: string; label: string }[];
  isMobile: boolean;
  showStoreScopeControls?: boolean;
  fixedStoreId?: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export default function PriceDrawer({
  open,
  target,
  allStoreOptions,
  isMobile,
  showStoreScopeControls = true,
  fixedStoreId,
  onClose,
  onSuccess,
}: PriceDrawerProps) {
  const [form, setForm] = useState<PriceFormState>(EMPTY_PRICE_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (open && target) {
      const firstStore = target.stores[0];
      setForm({
        storeIds: fixedStoreId ? [fixedStoreId] : [],
        applyToAllStores: false,
        unitPrice: firstStore?.salePrice != null ? String(firstStore.salePrice) : "",
        currency:
          firstStore?.currency === "TRY" ||
          firstStore?.currency === "USD" ||
          firstStore?.currency === "EUR"
            ? firstStore.currency
            : "TRY",
        discountPercent:
          firstStore?.discountPercent != null ? String(firstStore.discountPercent) : "",
        discountAmount: "",
        taxPercent: firstStore?.taxPercent != null ? String(firstStore.taxPercent) : "",
        taxAmount: "",
        lineTotal: "",
      });
      setFormError("");
    }
  }, [open, target, fixedStoreId]);

  const handleClose = () => {
    if (submitting) return;
    setForm(EMPTY_PRICE_FORM);
    setFormError("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!target) return;

    const effectiveApplyToAllStores = showStoreScopeControls ? form.applyToAllStores : false;
    const effectiveStoreIds = fixedStoreId ? [fixedStoreId] : form.storeIds;

    if (!effectiveApplyToAllStores && effectiveStoreIds.length === 0) {
      setFormError("Magaza secimi zorunludur veya tum magazalara uygula secenegini acin.");
      return;
    }
    if (!form.unitPrice || Number(form.unitPrice) < 0) {
      setFormError("Birim fiyat gecerli olmalidir.");
      return;
    }

    const unitPrice = Number(form.unitPrice);
    const discountPercent = form.discountPercent ? Number(form.discountPercent) : undefined;
    const discountAmount = form.discountAmount ? Number(form.discountAmount) : undefined;
    const taxPercent = form.taxPercent ? Number(form.taxPercent) : undefined;
    const taxAmount = form.taxAmount ? Number(form.taxAmount) : undefined;
    const lineTotal = form.lineTotal ? Number(form.lineTotal) : unitPrice;

    const payload: StorePricePayload = {
      unitPrice,
      currency: form.currency,
      lineTotal,
      applyToAllStores: effectiveApplyToAllStores || undefined,
      ...(effectiveStoreIds.length > 0 && !effectiveApplyToAllStores && { storeIds: effectiveStoreIds }),
      ...(discountPercent != null && { discountPercent }),
      ...(discountAmount != null && { discountAmount }),
      ...(taxPercent != null && { taxPercent }),
      ...(taxAmount != null && { taxAmount }),
    };

    setSubmitting(true);
    setFormError("");
    try {
      await updateStorePrice(target.productVariantId, payload);
      onSuccess("Fiyat guncellendi.");
      handleClose();
    } catch {
      setFormError("Fiyat guncellenemedi. Lutfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  const onFormChange = (field: keyof PriceFormState, value: string) => {
    setFormError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      side="right"
      title="Fiyat Duzenle"
      description={target ? `${target.productName} / ${target.variantName}` : ""}
      closeDisabled={submitting}
      className={cn(isMobile ? "!max-w-none" : "!max-w-[480px]")}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            label="Iptal"
            type="button"
            onClick={handleClose}
            disabled={submitting}
            variant="secondary"
          />
          <Button
            label={submitting ? "Kaydediliyor..." : "Kaydet"}
            type="button"
            onClick={handleSubmit}
            loading={submitting}
            variant="primarySolid"
          />
        </div>
      }
    >
      <div className="space-y-3 p-5">
        {showStoreScopeControls && (
          <>
            {/* Apply to all stores toggle */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface2/40 px-3 py-2.5">
              <span className="text-xs font-semibold text-muted">Tum Magazalara Uygula</span>
              <ToggleSwitch
                checked={form.applyToAllStores}
                onChange={(checked) => {
                  setFormError("");
                  setForm((prev) => ({
                    ...prev,
                    applyToAllStores: checked,
                    storeIds: checked ? [] : prev.storeIds,
                  }));
                }}
              />
            </div>

            {!form.applyToAllStores && (
              <Field label="Magaza *">
                <SearchableMultiSelectDropdown
                  options={allStoreOptions}
                  values={form.storeIds}
                  onChange={(values) => {
                    setFormError("");
                    setForm((prev) => ({ ...prev, storeIds: values }));
                  }}
                  placeholder="Magaza secin"
                />
              </Field>
            )}
          </>
        )}

        <Field label="Para Birimi *">
          <SearchableDropdown
            options={CURRENCY_OPTIONS}
            value={form.currency}
            onChange={(v) => onFormChange("currency", v || "TRY")}
            placeholder="Para birimi"
            showEmptyOption={false}
            allowClear={false}
          />
        </Field>

        <Field label="Birim Fiyat *">
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.unitPrice}
            onChange={(e) => onFormChange("unitPrice", e.target.value)}
            placeholder="150"
            className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Indirim (%)">
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={form.discountPercent}
              onChange={(e) => onFormChange("discountPercent", e.target.value)}
              placeholder="10"
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </Field>
          <Field label="Indirim (Tutar)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.discountAmount}
              onChange={(e) => onFormChange("discountAmount", e.target.value)}
              placeholder="50"
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="KDV (%)">
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={form.taxPercent}
              onChange={(e) => onFormChange("taxPercent", e.target.value)}
              placeholder="20"
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </Field>
          <Field label="KDV (Tutar)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.taxAmount}
              onChange={(e) => onFormChange("taxAmount", e.target.value)}
              placeholder="100"
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </Field>
        </div>

        <Field label="Satir Toplam">
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.lineTotal}
            onChange={(e) => onFormChange("lineTotal", e.target.value)}
            placeholder="Bos birakilirsa birim fiyat kullanilir"
            className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </Field>

        {formError && <p className="text-sm text-error">{formError}</p>}
      </div>
    </Drawer>
  );
}
