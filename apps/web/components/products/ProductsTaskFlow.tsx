"use client";

import type { FormEvent } from "react";
import type { Attribute as AttributeDefinition } from "@/lib/attributes";
import type { FormErrors, ProductForm, VariantErrors, VariantForm } from "@/components/products/types";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import ProductDrawerStep1 from "@/components/products/ProductDrawerStep1";
import ProductDrawerStep2 from "@/components/products/ProductDrawerStep2";
import { useLang } from "@/context/LangContext";

type ProductsTaskFlowProps = {
  open: boolean;
  step: 1 | 2;
  submitting: boolean;
  loadingDetail: boolean;
  editingProductId: string | null;
  form: ProductForm;
  errors: FormErrors;
  calculatedLineTotal: number | null;
  storeOptions: Array<{ value: string; label: string }>;
  categoryOptions: Array<{ value: string; label: string }>;
  unitOptions: Array<{ value: string; label: string }>;
  productInfoOpen: boolean;
  onToggleProductInfo: () => void;
  storeScopeOpen: boolean;
  onToggleStoreScope: () => void;
  formError: string;
  canTenantOnly: boolean;
  onFormChange: (field: keyof ProductForm, value: string) => void;
  onFormPatch: (patch: Partial<ProductForm>) => void;
  onClearError: (field: keyof FormErrors) => void;
  variants: VariantForm[];
  expandedVariantKeys: string[];
  variantErrors: Record<number, VariantErrors>;
  attributeDefinitions: AttributeDefinition[];
  onToggleVariantPanel: (clientKey: string) => void;
  onRemoveVariant: (index: number) => void;
  onAddAttribute: (variantIndex: number) => void;
  onRemoveAttribute: (variantIndex: number, attrIndex: number) => void;
  onUpdateAttribute: (
    variantIndex: number,
    attrIndex: number,
    field: "id" | "values",
    value: string | string[],
  ) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
};

export default function ProductsTaskFlow({
  open,
  step,
  submitting,
  loadingDetail,
  editingProductId,
  form,
  errors,
  calculatedLineTotal,
  storeOptions,
  categoryOptions,
  unitOptions,
  productInfoOpen,
  onToggleProductInfo,
  storeScopeOpen,
  onToggleStoreScope,
  formError,
  canTenantOnly,
  onFormChange,
  onFormPatch,
  onClearError,
  variants,
  expandedVariantKeys,
  variantErrors,
  attributeDefinitions,
  onToggleVariantPanel,
  onRemoveVariant,
  onAddAttribute,
  onRemoveAttribute,
  onUpdateAttribute,
  onClose,
  onSubmit,
  onBack,
}: ProductsTaskFlowProps) {
  const { t } = useLang();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={editingProductId ? t("products.update") : t("products.create")}
      description={step === 1 ? `1/2 - ${t("products.step1")}` : `2/2 - ${t("products.step2")}`}
      closeDisabled={submitting || loadingDetail}
      mobileFullscreen
      footer={
        <div className="flex items-center justify-between">
          <div>
            {step === 2 ? (
              <Button
                label={t("common.back")}
                type="button"
                onClick={onBack}
                disabled={submitting}
                variant="secondary"
              />
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button
              label={t("common.cancel")}
              type="button"
              onClick={onClose}
              disabled={submitting || loadingDetail}
              variant="secondary"
            />
            <Button
              label={
                step === 1
                  ? t("common.continue")
                  : submitting
                    ? editingProductId
                      ? t("common.updating")
                      : t("common.creating")
                    : t("common.save")
              }
              type="submit"
              form="product-mobile-form"
              disabled={submitting || loadingDetail}
              loading={step === 2 && submitting}
              variant="primarySolid"
            />
          </div>
        </div>
      }
    >
      <form
        id="product-mobile-form"
        onSubmit={onSubmit}
        className="space-y-4 p-5"
      >
        {loadingDetail ? (
          <div className="text-sm text-muted">{t("common.loading")}</div>
        ) : step === 1 ? (
          <ProductDrawerStep1
            form={form}
            errors={errors}
            calculatedLineTotal={calculatedLineTotal}
            storeOptions={storeOptions}
            categoryOptions={categoryOptions}
            unitOptions={unitOptions}
            productInfoOpen={productInfoOpen}
            onToggleProductInfo={onToggleProductInfo}
            storeScopeOpen={storeScopeOpen}
            onToggleStoreScope={onToggleStoreScope}
            formError={formError}
            onFormChange={onFormChange}
            onFormPatch={onFormPatch}
            onClearError={onClearError}
            canTenantOnly={canTenantOnly}
          />
        ) : (
          <ProductDrawerStep2
            variants={variants}
            expandedVariantKeys={expandedVariantKeys}
            variantErrors={variantErrors}
            attributeDefinitions={attributeDefinitions}
            formError={formError}
            onToggleVariantPanel={onToggleVariantPanel}
            onRemoveVariant={onRemoveVariant}
            onAddAttribute={onAddAttribute}
            onRemoveAttribute={onRemoveAttribute}
            onUpdateAttribute={onUpdateAttribute}
          />
        )}
      </form>
    </Drawer>
  );
}
