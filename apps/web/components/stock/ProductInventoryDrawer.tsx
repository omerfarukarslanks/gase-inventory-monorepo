"use client";

import { useEffect, useState } from "react";
import type { Store } from "@/lib/stores";
import type { Supplier } from "@/lib/suppliers";
import type { Currency } from "@/lib/products";
import type { InventoryVariantStockItem } from "@/lib/inventory";
import {
  receiveInventory,
  receiveInventoryBulk,
  adjustInventory,
  transferInventory,
  transferInventoryBulk,
} from "@/lib/inventory";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { CURRENCY_OPTIONS } from "@/components/products/types";
import { cn } from "@/lib/cn";

/* ── Types ── */

export type ProductInventoryOperation = "receive" | "adjust" | "transfer";

export type ProductInventoryTarget = {
  productId: string;
  productName: string;
  variants: InventoryVariantStockItem[];
};

type Props = {
  open: boolean;
  operation: ProductInventoryOperation | null;
  target: ProductInventoryTarget | null;
  stores: Store[];
  suppliers: Supplier[];
  isMobile: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
};

/* ── Sub-components ── */

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-semibold text-muted">{label}</label>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
  min,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  min?: number;
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      min={min}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "" || /^[0-9]*[.,]?[0-9]*$/.test(v)) {
          onChange(v.replace(",", "."));
        }
      }}
      placeholder={placeholder}
      className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
    />
  );
}

/* ── Main component ── */

export default function ProductInventoryDrawer({
  open,
  operation,
  target,
  stores,
  suppliers,
  isMobile,
  onClose,
  onSuccess,
}: Props) {
  /* ── Form state ── */
  const [applyToAllVariants, setApplyToAllVariants] = useState(true);
  const [supplierId, setSupplierId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [fromStoreId, setFromStoreId] = useState("");
  const [toStoreId, setToStoreId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [currency, setCurrency] = useState<Currency>("TRY");
  const [applyToAllStores, setApplyToAllStores] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  /* ── Per-variant state (unchecked mode) ── */
  const [variantQtys, setVariantQtys] = useState<Record<string, string>>({});
  const [variantNewQtys, setVariantNewQtys] = useState<Record<string, string>>({});
  const [variantStoreIds, setVariantStoreIds] = useState<Record<string, string>>({});

  /* ── Submit state ── */
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  /* ── Reset on open ── */
  useEffect(() => {
    if (!open) return;
    setApplyToAllVariants(true);
    setSupplierId("");
    setStoreId("");
    setFromStoreId("");
    setToStoreId("");
    setQuantity("");
    setNewQuantity("");
    setUnitPrice("");
    setCurrency("TRY");
    setApplyToAllStores(false);
    setReason("");
    setNote("");
    setVariantQtys({});
    setVariantNewQtys({});
    setVariantStoreIds({});
    setFormError("");
  }, [open, operation]);

  /* ── Derived ── */
  const storeOptions = stores
    .filter((s) => s.isActive)
    .map((s) => ({ value: s.id, label: s.name }));

  const supplierOptions = suppliers.map((s) => ({
    value: s.id,
    label: s.surname ? `${s.name} ${s.surname}` : s.name,
  }));

  const toStoreOptions = storeOptions.filter((s) => s.value !== fromStoreId);

  const variants = target?.variants ?? [];

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!target || !operation) return;
    setFormError("");

    const meta = {
      reason: reason || undefined,
      note: note || undefined,
    };

    setSubmitting(true);
    try {
      if (applyToAllVariants) {
        /* ── All-variants mode (single productId payload) ── */
        if (operation === "receive") {
          if (!storeId && !applyToAllStores) {
            setFormError("Magaza secimi zorunludur.");
            return;
          }
          if (!quantity || Number(quantity) <= 0) {
            setFormError("Miktar 0'dan buyuk olmalidir.");
            return;
          }
          if (!unitPrice || Number(unitPrice) <= 0) {
            setFormError("Birim fiyat 0'dan buyuk olmalidir.");
            return;
          }
          await receiveInventory({
            productId: target.productId,
            storeId: storeId || "",
            supplierId: supplierId || undefined,
            quantity: Number(quantity),
            unitPrice: Number(unitPrice),
            currency,
            meta,
          });
          onSuccess("Stok girisi kaydedildi.");
        } else if (operation === "adjust") {
          if (!newQuantity || Number(newQuantity) < 0) {
            setFormError("Miktar gecerli olmalidir.");
            return;
          }
          await adjustInventory({
            productId: target.productId,
            newQuantity: Number(newQuantity),
            storeId: storeId || undefined,
            applyToAllStores: applyToAllStores || undefined,
            meta,
          });
          onSuccess("Stok duzeltme kaydedildi.");
        } else if (operation === "transfer") {
          if (!fromStoreId) {
            setFormError("Kaynak magaza secimi zorunludur.");
            return;
          }
          if (!toStoreId) {
            setFormError("Hedef magaza secimi zorunludur.");
            return;
          }
          if (fromStoreId === toStoreId) {
            setFormError("Kaynak ve hedef magaza ayni olamaz.");
            return;
          }
          if (!quantity || Number(quantity) <= 0) {
            setFormError("Miktar 0'dan buyuk olmalidir.");
            return;
          }
          await transferInventory({
            productId: target.productId,
            fromStoreId,
            toStoreId,
            quantity: Number(quantity),
            meta,
          });
          onSuccess("Stok transferi kaydedildi.");
        }
      } else {
        /* ── Per-variant mode (items[] payload) ── */
        if (operation === "receive") {
          const items = variants.map((v) => ({
            productVariantId: v.productVariantId,
            storeId: variantStoreIds[v.productVariantId] ?? storeId,
            supplierId: supplierId || undefined,
            quantity: Number(variantQtys[v.productVariantId] ?? 0),
            unitPrice: Number(unitPrice) || 0,
            currency,
            meta,
          })).filter((item) => item.quantity > 0);

          if (items.length === 0) {
            setFormError("En az bir varyant icin miktar girilmelidir.");
            return;
          }
          if (!unitPrice || Number(unitPrice) <= 0) {
            setFormError("Birim fiyat 0'dan buyuk olmalidir.");
            return;
          }
          await receiveInventoryBulk(items);
          onSuccess("Stok girisi kaydedildi.");
        } else if (operation === "adjust") {
          const items = variants.map((v) => ({
            storeId: variantStoreIds[v.productVariantId] ?? storeId ?? "",
            productVariantId: v.productVariantId,
            newQuantity: Number(variantNewQtys[v.productVariantId] ?? 0),
            meta,
          })).filter((_, i) => variantNewQtys[variants[i].productVariantId] !== undefined && variantNewQtys[variants[i].productVariantId] !== "");

          if (items.length === 0) {
            setFormError("En az bir varyant icin miktar girilmelidir.");
            return;
          }
          await adjustInventory({ items });
          onSuccess("Stok duzeltme kaydedildi.");
        } else if (operation === "transfer") {
          if (!fromStoreId) {
            setFormError("Kaynak magaza secimi zorunludur.");
            return;
          }
          if (!toStoreId) {
            setFormError("Hedef magaza secimi zorunludur.");
            return;
          }
          if (fromStoreId === toStoreId) {
            setFormError("Kaynak ve hedef magaza ayni olamaz.");
            return;
          }

          const items = variants
            .filter((v) => Number(variantQtys[v.productVariantId] ?? 0) > 0)
            .map((v) => ({
              productVariantId: v.productVariantId,
              fromStoreId,
              toStoreId,
              quantity: Number(variantQtys[v.productVariantId]),
              meta,
            }));

          if (items.length === 0) {
            setFormError("En az bir varyant icin transfer miktari girilmelidir.");
            return;
          }
          await transferInventoryBulk({ items });
          onSuccess("Stok transferi kaydedildi.");
        }
      }
      onClose();
    } catch {
      setFormError("Islem gerceklestirilemedi. Lutfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Titles ── */
  const titles: Record<ProductInventoryOperation, string> = {
    receive: "Stok Girisi",
    adjust: "Stok Duzeltme",
    transfer: "Stok Transfer",
  };

  const title = operation ? titles[operation] : "";

  /* ── Render ── */
  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={title}
      description={target?.productName ?? ""}
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
            label="Kaydet"
            type="button"
            onClick={handleSubmit}
            loading={submitting}
            variant="primarySolid"
          />
        </div>
      }
    >
      <div className="space-y-4 p-5">
        {/* All variants toggle */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface2/40 px-3 py-2.5">
          <span className="text-xs font-semibold text-muted">Butun variantlar icin gecerli</span>
          <ToggleSwitch
            checked={applyToAllVariants}
            onChange={setApplyToAllVariants}
            disabled={submitting}
          />
        </div>

        {/* Supplier (receive only) */}
        {operation === "receive" && (
          <Field label="Tedarikci">
            <SearchableDropdown
              options={supplierOptions}
              value={supplierId}
              onChange={setSupplierId}
              placeholder="Tedarikci secin (istege bagli)"
              showEmptyOption
            />
          </Field>
        )}

        {applyToAllVariants ? (
          /* ── All-variants simple form ── */
          <div className="space-y-3">
            {/* Transfer stores */}
            {operation === "transfer" && (
              <>
                <Field label="Hangi Magazadan *">
                  <SearchableDropdown
                    options={storeOptions}
                    value={fromStoreId}
                    onChange={setFromStoreId}
                    placeholder="Kaynak magaza secin"
                    showEmptyOption={false}
                  />
                </Field>
                <Field label="Hangi Magazaya *">
                  <SearchableDropdown
                    options={toStoreOptions}
                    value={toStoreId}
                    onChange={setToStoreId}
                    placeholder="Hedef magaza secin"
                    showEmptyOption={false}
                  />
                </Field>
              </>
            )}

            {/* Store (receive / adjust) */}
            {operation !== "transfer" && (
              <>
                {operation === "adjust" && (
                  <div className="flex items-center justify-between rounded-xl border border-border bg-surface2/40 px-3 py-2.5">
                    <span className="text-xs font-semibold text-muted">Tum Magazalara Uygula</span>
                    <ToggleSwitch
                      checked={applyToAllStores}
                      onChange={setApplyToAllStores}
                      disabled={submitting}
                    />
                  </div>
                )}
                {!applyToAllStores && (
                  <Field label={operation === "receive" ? "Magaza *" : "Magaza"}>
                    <SearchableDropdown
                      options={storeOptions}
                      value={storeId}
                      onChange={setStoreId}
                      placeholder="Magaza secin"
                      showEmptyOption={operation === "adjust"}
                    />
                  </Field>
                )}
              </>
            )}

            {/* Quantity */}
            {operation !== "adjust" && (
              <Field label="Miktar *">
                <NumberInput value={quantity} onChange={setQuantity} placeholder="0" />
              </Field>
            )}

            {/* New quantity (adjust) */}
            {operation === "adjust" && (
              <Field label="Yeni Miktar *">
                <NumberInput value={newQuantity} onChange={setNewQuantity} placeholder="0" min={0} />
              </Field>
            )}

            {/* Price + currency (receive only) */}
            {operation === "receive" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Birim Fiyat *">
                  <NumberInput value={unitPrice} onChange={setUnitPrice} placeholder="0.00" />
                </Field>
                <Field label="Para Birimi">
                  <SearchableDropdown
                    options={CURRENCY_OPTIONS}
                    value={currency}
                    onChange={(v) => setCurrency((v || "TRY") as Currency)}
                    showEmptyOption={false}
                    allowClear={false}
                  />
                </Field>
              </div>
            )}

            {/* Meta */}
            <Field label="Sebep">
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Sebep"
                className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </Field>
            <Field label="Not">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Aciklama"
                className="min-h-[80px] w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </Field>
          </div>
        ) : (
          /* ── Per-variant form ── */
          <div className="space-y-3">
            {/* Shared fields */}
            {operation === "transfer" && (
              <>
                <Field label="Hangi Magazadan *">
                  <SearchableDropdown
                    options={storeOptions}
                    value={fromStoreId}
                    onChange={setFromStoreId}
                    placeholder="Kaynak magaza secin"
                    showEmptyOption={false}
                  />
                </Field>
                <Field label="Hangi Magazaya *">
                  <SearchableDropdown
                    options={toStoreOptions}
                    value={toStoreId}
                    onChange={setToStoreId}
                    placeholder="Hedef magaza secin"
                    showEmptyOption={false}
                  />
                </Field>
              </>
            )}

            {operation === "receive" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Birim Fiyat *">
                    <NumberInput value={unitPrice} onChange={setUnitPrice} placeholder="0.00" />
                  </Field>
                  <Field label="Para Birimi">
                    <SearchableDropdown
                      options={CURRENCY_OPTIONS}
                      value={currency}
                      onChange={(v) => setCurrency((v || "TRY") as Currency)}
                      showEmptyOption={false}
                      allowClear={false}
                    />
                  </Field>
                </div>
              </>
            )}

            {/* Variant list */}
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-[1fr_auto] border-b border-border bg-surface2/70 px-3 py-2 text-[11px] uppercase tracking-wide text-muted">
                <div>Varyant</div>
                <div className="text-right">
                  {operation === "adjust" ? "Yeni Miktar" : "Miktar"}
                </div>
              </div>
              <div className="max-h-[320px] overflow-y-auto divide-y divide-border">
                {variants.map((v) => (
                  <div key={v.productVariantId} className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2">
                    <div>
                      <div className="text-xs font-medium text-text">{v.variantName}</div>
                      {v.variantCode && (
                        <div className="text-[11px] text-muted">{v.variantCode}</div>
                      )}
                    </div>
                    <div className="w-28">
                      {operation === "adjust" ? (
                        <NumberInput
                          value={variantNewQtys[v.productVariantId] ?? ""}
                          onChange={(val) =>
                            setVariantNewQtys((prev) => ({ ...prev, [v.productVariantId]: val }))
                          }
                          placeholder="0"
                          min={0}
                        />
                      ) : (
                        <NumberInput
                          value={variantQtys[v.productVariantId] ?? ""}
                          onChange={(val) =>
                            setVariantQtys((prev) => ({ ...prev, [v.productVariantId]: val }))
                          }
                          placeholder="0"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shared store for receive/adjust */}
            {operation !== "transfer" && (
              <Field label="Magaza">
                <SearchableDropdown
                  options={storeOptions}
                  value={storeId}
                  onChange={setStoreId}
                  placeholder="Magaza secin"
                  showEmptyOption
                />
              </Field>
            )}

            {/* Meta */}
            <Field label="Sebep">
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Sebep"
                className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </Field>
            <Field label="Not">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Aciklama"
                className="min-h-[80px] w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </Field>
          </div>
        )}

        {formError && <p className="text-sm text-error">{formError}</p>}
      </div>
    </Drawer>
  );
}
