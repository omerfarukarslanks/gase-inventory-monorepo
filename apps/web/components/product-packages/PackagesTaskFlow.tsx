"use client";

import { useEffect, useMemo, useState } from "react";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableMultiSelectDropdown from "@/components/ui/SearchableMultiSelectDropdown";
import { FieldError } from "@/components/ui/FieldError";
import type { Product } from "@/lib/products";
import type { FormErrors, PackageForm, PackageItemRow } from "@/components/product-packages/types";

type PackagesTaskFlowProps = {
  open: boolean;
  editingId: string | null;
  loadingDetail: boolean;
  submitting: boolean;
  form: PackageForm;
  errors: FormErrors;
  items: PackageItemRow[];
  variantSearchTerm: string;
  onVariantSearchTermChange: (value: string) => void;
  variantSearchLoading: boolean;
  variantSearchProducts: Product[];
  selectedProductForVariant: string;
  onSelectProduct: (product: Product) => void;
  variantOptions: Array<{ value: string; label: string }>;
  variantsLoading: boolean;
  selectedVariantIds: string[];
  onSelectedVariantIdsChange: (value: string[]) => void;
  addItemQuantity: string;
  onAddItemQuantityChange: (value: string) => void;
  addItemError: string;
  formError: string;
  onFormChange: (field: keyof PackageForm, value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (rowId: string) => void;
  onItemQuantityChange: (rowId: string, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

type PackageTaskStep = "info" | "product" | "variant" | "quantity" | "review";

const STEPS: Array<{ key: PackageTaskStep; label: string }> = [
  { key: "info", label: "Bilgi" },
  { key: "product", label: "Urun" },
  { key: "variant", label: "Varyant" },
  { key: "quantity", label: "Adet" },
  { key: "review", label: "Ozet" },
];

export default function PackagesTaskFlow({
  open,
  editingId,
  loadingDetail,
  submitting,
  form,
  errors,
  items,
  variantSearchTerm,
  onVariantSearchTermChange,
  variantSearchLoading,
  variantSearchProducts,
  selectedProductForVariant,
  onSelectProduct,
  variantOptions,
  variantsLoading,
  selectedVariantIds,
  onSelectedVariantIdsChange,
  addItemQuantity,
  onAddItemQuantityChange,
  addItemError,
  formError,
  onFormChange,
  onAddItem,
  onRemoveItem,
  onItemQuantityChange,
  onClose,
  onSubmit,
}: PackagesTaskFlowProps) {
  const [step, setStep] = useState<PackageTaskStep>("info");

  useEffect(() => {
    if (open) {
      setStep("info");
    }
  }, [open]);

  const stepIndex = STEPS.findIndex((item) => item.key === step);
  const currentStepNumber = stepIndex + 1;

  const selectedProductLabel = useMemo(
    () => variantSearchProducts.find((product) => product.id === selectedProductForVariant)?.name ?? variantSearchTerm,
    [selectedProductForVariant, variantSearchProducts, variantSearchTerm],
  );

  const canContinue =
    step === "info"
      ? Boolean(form.name.trim() && form.code.trim())
      : step === "product"
        ? Boolean(selectedProductForVariant || items.length > 0)
        : step === "variant"
          ? Boolean(selectedVariantIds.length > 0 || items.length > 0)
          : step === "quantity"
            ? items.length > 0
            : true;

  const handleBack = () => {
    if (step === "review") setStep("quantity");
    else if (step === "quantity") setStep("variant");
    else if (step === "variant") setStep("product");
    else if (step === "product") setStep("info");
    else onClose();
  };

  const handleContinue = () => {
    if (!canContinue) return;
    if (step === "info") setStep("product");
    else if (step === "product") setStep("variant");
    else if (step === "variant") setStep("quantity");
    else if (step === "quantity") setStep("review");
  };

  const renderContent = () => {
    if (loadingDetail) {
      return <div className="text-sm text-muted">Paket detayi yukleniyor...</div>;
    }

    if (step === "info") {
      return (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Paket Adi *</label>
            <input
              type="text"
              value={form.name}
              onChange={(event) => onFormChange("name", event.target.value)}
              placeholder="Kiyafet Paketi S/M/L"
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <FieldError error={errors.name} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Paket Kodu *</label>
            <input
              type="text"
              value={form.code}
              onChange={(event) => onFormChange("code", event.target.value)}
              placeholder="PKG-001"
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 font-mono text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <FieldError error={errors.code} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Aciklama</label>
            <textarea
              value={form.description}
              onChange={(event) => onFormChange("description", event.target.value)}
              placeholder="S, M, L bedenlerinden birer adet icerir"
              className="min-h-[92px] w-full rounded-xl2 border border-border bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
            />
          </div>
        </div>
      );
    }

    if (step === "product") {
      return (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Urun Ara</label>
            <input
              type="text"
              placeholder="Urun adi veya SKU..."
              value={variantSearchTerm}
              onChange={(event) => onVariantSearchTermChange(event.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {variantSearchLoading ? <p className="text-xs text-muted">Araniyor...</p> : null}
          </div>

          {!variantSearchLoading && variantSearchProducts.length > 0 ? (
            <div className="space-y-2">
              {variantSearchProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onSelectProduct(product)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                    selectedProductForVariant === product.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-surface hover:bg-surface2"
                  }`}
                >
                  <div className="text-sm font-medium text-text">{product.name}</div>
                  <div className="mt-1 text-xs text-muted">{product.sku}</div>
                </button>
              ))}
            </div>
          ) : null}

          {selectedProductForVariant ? (
            <div className="rounded-xl border border-border bg-surface2/30 p-3 text-sm text-text2">
              Secilen urun: <span className="font-medium text-text">{selectedProductLabel || "Secildi"}</span>
            </div>
          ) : null}
        </div>
      );
    }

    if (step === "variant") {
      return (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Varyantlari Sec</label>
            {variantsLoading ? (
              <p className="text-sm text-muted">Varyantlar yukleniyor...</p>
            ) : variantOptions.length === 0 ? (
              <p className="text-sm text-muted">Bu urun icin aktif varyant bulunamadi.</p>
            ) : (
              <SearchableMultiSelectDropdown
                options={variantOptions.filter(
                  (option) =>
                    selectedVariantIds.includes(option.value) ||
                    !items.some((item) => item.productVariantId === option.value),
                )}
                values={selectedVariantIds}
                onChange={onSelectedVariantIdsChange}
                placeholder="Varyantlari secin..."
                noResultsText="Secilebilir varyant kalmadi."
              />
            )}
          </div>

          {selectedVariantIds.length > 0 ? (
            <div className="rounded-xl border border-border bg-surface2/30 p-3 text-sm text-text2">
              {selectedVariantIds.length} varyant secildi. Sonraki adimda miktar girip pakete ekleyin.
            </div>
          ) : null}
        </div>
      );
    }

    if (step === "quantity") {
      return (
        <div className="space-y-4">
          {selectedVariantIds.length > 0 ? (
            <div className="space-y-3 rounded-xl2 border border-dashed border-border bg-surface2/20 p-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Miktar (paket basina adet)</label>
                <input
                  type="number"
                  min="1"
                  value={addItemQuantity}
                  onChange={(event) => onAddItemQuantityChange(event.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <Button
                label={`Secilenleri Ekle (${selectedVariantIds.length})`}
                type="button"
                onClick={onAddItem}
                variant="primarySoft"
                className="w-full"
              />
              <FieldError error={addItemError} />
            </div>
          ) : null}

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-text">Paket Kalemleri</h3>
              <p className="mt-1 text-xs text-muted">Eklenen varyantlar ve miktarlar.</p>
            </div>
            <FieldError error={errors.items} />
            {items.length === 0 ? (
              <div className="rounded-xl2 border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                Henuz paket kalemi eklenmedi.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.rowId} className="space-y-3 rounded-xl border border-border bg-surface p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">{item.variantLabel}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) => onItemQuantityChange(item.rowId, event.target.value)}
                        className="h-10 flex-1 rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      <Button
                        label="Kaldir"
                        type="button"
                        onClick={() => onRemoveItem(item.rowId)}
                        variant="secondary"
                        className="px-3"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-xl2 border border-border bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Paket Bilgisi</p>
          <p className="mt-2 text-sm font-semibold text-text">{form.name || "-"}</p>
          <p className="mt-1 text-xs font-mono text-muted">{form.code || "-"}</p>
          <p className="mt-3 text-sm text-text2">{form.description || "Aciklama girilmedi."}</p>
        </div>

        <div className="rounded-xl2 border border-border bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Kalemler</p>
          <div className="mt-3 space-y-3">
            {items.map((item) => (
              <div key={item.rowId} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface2/30 px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text">{item.variantLabel}</p>
                </div>
                <span className="rounded-full bg-surface2 px-2 py-1 text-xs font-semibold text-text2">
                  {item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {formError ? (
          <div className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
            {formError}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={editingId ? "Paketi Guncelle" : "Yeni Paket Olustur"}
      description={`${currentStepNumber}/${STEPS.length} - ${STEPS[stepIndex]?.label ?? ""}`}
      closeDisabled={submitting || loadingDetail}
      mobileFullscreen
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button
            label={step === "info" ? "Iptal" : "Geri"}
            type="button"
            onClick={handleBack}
            disabled={submitting || loadingDetail}
            variant="secondary"
          />
          {step === "review" ? (
            <Button
              label={submitting ? (editingId ? "Guncelleniyor..." : "Olusturuluyor...") : "Kaydet"}
              type="button"
              onClick={onSubmit}
              loading={submitting}
              disabled={submitting || loadingDetail}
              variant="primarySolid"
            />
          ) : (
            <Button
              label="Devam Et"
              type="button"
              onClick={handleContinue}
              disabled={!canContinue || submitting || loadingDetail}
              variant="primarySolid"
            />
          )}
        </div>
      }
    >
      <div className="space-y-5 p-5">
        <div className="flex gap-2">
          {STEPS.map((item, index) => (
            <div
              key={item.key}
              className={`h-1 flex-1 rounded-full ${index <= stepIndex ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>

        {renderContent()}
      </div>
    </Drawer>
  );
}
