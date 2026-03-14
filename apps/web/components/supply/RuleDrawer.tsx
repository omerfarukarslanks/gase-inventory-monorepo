"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { ApiError } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { useDebounceStr } from "@/hooks/useDebounce";
import {
  getProducts,
  getProductVariants,
  type Product,
  type ProductVariant,
} from "@/lib/products";
import type { Supplier } from "@/lib/suppliers";
import type {
  CreateReplenishmentRulePayload,
  ReplenishmentRule,
  UpdateReplenishmentRulePayload,
} from "@/lib/replenishment";
import { getReplenishmentRuleStatusLabel, getReplenishmentRuleStatusVariant } from "@/components/supply/status";
import { StatusBadge } from "@/components/ui/StatusBadge";

type RuleDrawerProps = {
  open: boolean;
  mode: "create" | "edit";
  loading: boolean;
  submitting: boolean;
  rule: ReplenishmentRule | null;
  productLabel: string;
  variantLabel: string;
  suppliers: Supplier[];
  storeOptions: Array<{ value: string; label: string }>;
  showStoreSelector: boolean;
  fixedStoreId?: string;
  onClose: () => void;
  onCreate: (payload: CreateReplenishmentRulePayload) => Promise<void>;
  onUpdate: (id: string, payload: UpdateReplenishmentRulePayload) => Promise<void>;
};

const INPUT_CLASSNAME =
  "h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message.trim()) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export default function RuleDrawer({
  open,
  mode,
  loading,
  submitting,
  rule,
  productLabel,
  variantLabel,
  suppliers,
  storeOptions,
  showStoreSelector,
  fixedStoreId,
  onClose,
  onCreate,
  onUpdate,
}: RuleDrawerProps) {
  const { t } = useLang();
  const [storeId, setStoreId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [minStock, setMinStock] = useState("");
  const [targetStock, setTargetStock] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [variantOptions, setVariantOptions] = useState<ProductVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const debouncedProductSearchTerm = useDebounceStr(productSearchTerm, 300);

  const supplierOptions = useMemo(
    () => suppliers.map((supplier) => ({
      value: supplier.id,
      label: supplier.surname ? `${supplier.name} ${supplier.surname}` : supplier.name,
    })),
    [suppliers],
  );

  const productOptions = useMemo(() => {
    const next = new Map<string, { value: string; label: string }>();
    if (selectedProduct) {
      next.set(selectedProduct.id, { value: selectedProduct.id, label: selectedProduct.name });
    }
    productResults.forEach((product) => {
      next.set(product.id, { value: product.id, label: product.name });
    });
    return [...next.values()];
  }, [productResults, selectedProduct]);

  const variantDropdownOptions = useMemo(
    () => variantOptions.map((variant) => ({ value: variant.id, label: variant.name })),
    [variantOptions],
  );

  const resetForm = useEffectEvent(() => {
    setFormError("");
    setSelectedProduct(null);
    setSelectedVariantId("");
    setProductSearchTerm("");
    setProductResults([]);
    setVariantOptions([]);
    setProductsLoading(false);
    setVariantsLoading(false);

    if (mode === "edit" && rule) {
      setStoreId(rule.storeId ?? fixedStoreId ?? "");
      setSupplierId(rule.supplierId ?? "");
      setMinStock(rule.minStock != null ? String(rule.minStock) : "");
      setTargetStock(rule.targetStock != null ? String(rule.targetStock) : "");
      setLeadTimeDays(rule.leadTimeDays != null ? String(rule.leadTimeDays) : "");
      return;
    }

    setStoreId(showStoreSelector ? (fixedStoreId || storeOptions[0]?.value || "") : (fixedStoreId || ""));
    setSupplierId("");
    setMinStock("");
    setTargetStock("");
    setLeadTimeDays("");
  });

  const loadProducts = useEffectEvent(async (search: string) => {
    setProductsLoading(true);
    try {
      const response = await getProducts({
        page: 1,
        limit: 15,
        search: search.trim() || undefined,
        isActive: true,
        variantIsActive: true,
      });
      setProductResults(response.data ?? []);
    } catch {
      setProductResults([]);
    } finally {
      setProductsLoading(false);
    }
  });

  const loadVariants = useEffectEvent(async (productId: string | null) => {
    if (!productId) {
      setVariantOptions([]);
      setVariantsLoading(false);
      return;
    }

    setVariantsLoading(true);
    try {
      const variants = await getProductVariants(productId, { isActive: true });
      setVariantOptions(variants ?? []);
    } catch {
      setVariantOptions([]);
    } finally {
      setVariantsLoading(false);
    }
  });

  useEffect(() => {
    if (!open) return;
    resetForm();
  }, [mode, open, rule]);

  useEffect(() => {
    if (!open || mode !== "create") return;
    void loadProducts(debouncedProductSearchTerm);
  }, [debouncedProductSearchTerm, mode, open]);

  useEffect(() => {
    if (mode !== "create") return;
    void loadVariants(selectedProduct?.id ?? null);
  }, [mode, selectedProduct?.id]);

  const submit = async () => {
    setFormError("");

    const targetStoreId = showStoreSelector ? storeId : (fixedStoreId || storeId);
    if (!targetStoreId) {
      setFormError(t("supply.rules.storeRequired"));
      return;
    }

    const parsedMinStock = Number(minStock);
    if (!Number.isFinite(parsedMinStock) || parsedMinStock < 0) {
      setFormError(t("supply.rules.minStockRequired"));
      return;
    }

    const parsedTargetStock = Number(targetStock);
    if (!Number.isFinite(parsedTargetStock) || parsedTargetStock < 0) {
      setFormError(t("supply.rules.targetStockRequired"));
      return;
    }

    if (parsedTargetStock < parsedMinStock) {
      setFormError(t("supply.rules.targetStockInvalid"));
      return;
    }

    const parsedLeadTimeDays = leadTimeDays.trim() ? Number(leadTimeDays) : null;
    if (parsedLeadTimeDays != null && (!Number.isFinite(parsedLeadTimeDays) || parsedLeadTimeDays < 0)) {
      setFormError(t("supply.rules.saveError"));
      return;
    }

    try {
      if (mode === "create") {
        if (!selectedProduct) {
          setFormError(t("supply.rules.productRequired"));
          return;
        }
        if (!selectedVariantId) {
          setFormError(t("supply.rules.variantRequired"));
          return;
        }

        await onCreate({
          storeId: targetStoreId,
          productVariantId: selectedVariantId,
          minStock: parsedMinStock,
          targetStock: parsedTargetStock,
          supplierId: supplierId || undefined,
          leadTimeDays: parsedLeadTimeDays ?? undefined,
        });
        return;
      }

      if (!rule) return;

      const payload: UpdateReplenishmentRulePayload = {};
      if ((rule.minStock ?? null) !== parsedMinStock) payload.minStock = parsedMinStock;
      if ((rule.targetStock ?? null) !== parsedTargetStock) payload.targetStock = parsedTargetStock;
      if ((rule.supplierId ?? "") !== supplierId) payload.supplierId = supplierId || null;
      if ((rule.leadTimeDays ?? null) !== (parsedLeadTimeDays ?? null)) payload.leadTimeDays = parsedLeadTimeDays ?? null;

      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      await onUpdate(rule.id, payload);
    } catch (error) {
      setFormError(getErrorMessage(error, t("supply.rules.saveError")));
    }
  };

  const footer = loading ? (
    <div className="flex items-center justify-end">
      <Button label={t("supply.suggestions.close")} onClick={onClose} variant="secondary" />
    </div>
  ) : (
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
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={mode === "create" ? t("supply.rules.createTitle") : t("supply.rules.editTitle")}
      description={mode === "create" ? t("supply.rules.createDescription") : `${productLabel} / ${variantLabel}`}
      closeDisabled={submitting}
      mobileFullscreen
      className="!max-w-[640px]"
      footer={footer}
    >
      <div className="space-y-4 p-5">
        {loading ? (
          <p className="text-sm text-muted">{t("supply.rules.loading")}</p>
        ) : mode === "edit" && !rule ? (
          <p className="text-sm text-muted">{t("supply.rules.detailLoadError")}</p>
        ) : (
          <>
            {mode === "edit" && rule ? (
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={getReplenishmentRuleStatusLabel(rule.isActive)}
                  variant={getReplenishmentRuleStatusVariant(rule.isActive)}
                />
              </div>
            ) : null}

            {showStoreSelector ? (
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">{t("common.storeFilter")} *</label>
                <SearchableDropdown
                  options={storeOptions}
                  value={storeId}
                  onChange={setStoreId}
                  placeholder={t("supply.common.storePlaceholder")}
                  showEmptyOption={false}
                  allowClear={false}
                  disabled={mode === "edit"}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface2/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("common.storeFilter")}</p>
                <p className="mt-2 text-sm font-semibold text-text">
                  {storeOptions.find((option) => option.value === (fixedStoreId || storeId))?.label ?? "-"}
                </p>
              </div>
            )}

            {mode === "create" ? (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">{t("supply.rules.productLabel")} *</label>
                  <SearchableDropdown
                    options={productOptions}
                    value={selectedProduct?.id ?? ""}
                    onChange={(value) => {
                      const product = productResults.find((item) => item.id === value) ?? selectedProduct;
                      setSelectedProduct(product && product.id === value ? product : null);
                      setSelectedVariantId("");
                      setFormError("");
                    }}
                    searchValue={productSearchTerm}
                    onSearchChange={setProductSearchTerm}
                    placeholder={t("supply.common.productPlaceholder")}
                    showEmptyOption={false}
                    allowClear={false}
                    loading={productsLoading}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">{t("supply.rules.variantLabel")} *</label>
                  <SearchableDropdown
                    options={variantDropdownOptions}
                    value={selectedVariantId}
                    onChange={setSelectedVariantId}
                    placeholder={t("supply.common.variantPlaceholder")}
                    showEmptyOption={false}
                    allowClear={false}
                    loading={variantsLoading}
                    disabled={!selectedProduct}
                  />
                </div>
              </>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface2/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("supply.rules.productLabel")}</p>
                  <p className="mt-2 text-sm font-semibold text-text">{productLabel}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface2/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("supply.rules.variantLabel")}</p>
                  <p className="mt-2 text-sm font-semibold text-text">{variantLabel}</p>
                </div>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">{t("supply.rules.minStockLabel")} *</label>
                <input
                  className={INPUT_CLASSNAME}
                  value={minStock}
                  onChange={(event) => setMinStock(event.target.value)}
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">{t("supply.rules.targetStockLabel")} *</label>
                <input
                  className={INPUT_CLASSNAME}
                  value={targetStock}
                  onChange={(event) => setTargetStock(event.target.value)}
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">{t("supply.rules.supplierLabel")}</label>
                <SearchableDropdown
                  options={supplierOptions}
                  value={supplierId}
                  onChange={setSupplierId}
                  placeholder={t("supply.common.allSuppliers")}
                  emptyOptionLabel={t("supply.common.allSuppliers")}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">{t("supply.rules.leadTimeDaysLabel")}</label>
                <input
                  className={INPUT_CLASSNAME}
                  value={leadTimeDays}
                  onChange={(event) => setLeadTimeDays(event.target.value)}
                  inputMode="numeric"
                />
              </div>
            </div>

            {rule?.createdAt ? (
              <div className="rounded-xl border border-border bg-surface2/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("supply.rules.createdAtLabel")}</p>
                <p className="mt-2 text-sm text-text2">{new Date(rule.createdAt).toLocaleString("tr-TR")}</p>
              </div>
            ) : null}

            {formError ? <p className="text-sm text-error">{formError}</p> : null}
          </>
        )}
      </div>
    </Drawer>
  );
}
