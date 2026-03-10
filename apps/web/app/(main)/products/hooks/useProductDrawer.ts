"use client";
import { type FormEvent, useMemo, useState } from "react";
import {
  createProduct,
  updateProduct,
  createProductVariant,
  updateProductVariant,
  getProductById,
  getProductAttributes,
  type Product,
  type ProductVariant,
  type Currency,
} from "@/lib/products";
import { getAttributes, type Attribute as AttributeDefinition } from "@/lib/attributes";
import { getAllProductCategories } from "@/lib/product-categories";
import {
  EMPTY_PRODUCT_FORM,
  type ProductForm,
  type VariantForm,
  type FormErrors,
  type VariantErrors,
  type VariantSnapshot,
  type IsActiveFilter,
  createVariantClientKey,
  areVariantAttributesEqual,
  normalizeVariantsResponse,
} from "@/components/products/types";
import { toNumberOrNull } from "@/lib/format";
import { useEffect } from "react";
import { validateProductStep1, validateProductVariants } from "./productValidators";
import { useVariantEditor } from "./useVariantEditor";

type Options = {
  scopedStoreId: string;
  canTenantOnly: boolean;
  onSuccess: () => Promise<void>;
  t: (key: string) => string;
};

export function useProductDrawer({ scopedStoreId: _scopedStoreId, canTenantOnly, onSuccess, t: _t }: Options) {
  /* Drawer state */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [formError, setFormError] = useState("");

  /* Form state */
  const [form, setForm] = useState<ProductForm>(EMPTY_PRODUCT_FORM);
  const [originalForm, setOriginalForm] = useState<ProductForm>(EMPTY_PRODUCT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  /* Variant state */
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [expandedVariantKeys, setExpandedVariantKeys] = useState<string[]>([]);
  const [originalVariantMap, setOriginalVariantMap] = useState<Record<string, VariantSnapshot>>({});
  const [variantErrors, setVariantErrors] = useState<Record<number, VariantErrors>>({});

  /* Created product id (for variant step) */
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);

  /* Attribute definitions & category options */
  const [attributeDefinitions, setAttributeDefinitions] = useState<AttributeDefinition[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Array<{ value: string; label: string }>>([]);

  /* Step 1 panel open state */
  const [step1ProductInfoOpen, setStep1ProductInfoOpen] = useState(false);
  const [step1StoreScopeOpen, setStep1StoreScopeOpen] = useState(true);

  useEffect(() => {
    getAttributes()
      .then((res) => setAttributeDefinitions(res))
      .catch(() => setAttributeDefinitions([]));
  }, []);

  useEffect(() => {
    getAllProductCategories({ isActive: "all" })
      .then((categories) => {
        const options = (categories ?? [])
          .map((category) => ({
            value: category.id,
            label: category.name,
          }))
          .sort((a, b) => a.label.localeCompare(b.label, "tr"));
        setCategoryOptions(options);
      })
      .catch(() => setCategoryOptions([]));
  }, []);

  /* ── Calculated line total ── */

  const calculatedLineTotal = useMemo(() => {
    const unitPrice = toNumberOrNull(form.unitPrice);
    if (unitPrice == null || unitPrice < 0) return null;

    const taxValue =
      form.taxMode === "percent"
        ? unitPrice * ((toNumberOrNull(form.taxPercent) ?? 0) / 100)
        : (toNumberOrNull(form.taxAmount) ?? 0);
    const subtotalWithTax = unitPrice + taxValue;
    const discountValue =
      form.discountMode === "percent"
        ? subtotalWithTax * ((toNumberOrNull(form.discountPercent) ?? 0) / 100)
        : (toNumberOrNull(form.discountAmount) ?? 0);

    return subtotalWithTax - discountValue;
  }, [
    form.unitPrice,
    form.taxMode,
    form.taxPercent,
    form.taxAmount,
    form.discountMode,
    form.discountPercent,
    form.discountAmount,
  ]);

  /* ── Drawer handlers ── */

  const onOpenDrawer = () => {
    setForm(EMPTY_PRODUCT_FORM);
    setVariants([]);
    setErrors({});
    setVariantErrors({});
    setFormError("");
    setEditingProductId(null);
    setCreatedProductId(null);
    setExpandedVariantKeys([]);
    setOriginalVariantMap({});
    setStep(1);
    setStep1ProductInfoOpen(false);
    setStep1StoreScopeOpen(true);
    setDrawerOpen(true);
  };

  const onCloseDrawer = () => {
    if (submitting || loadingDetail) return;
    setDrawerOpen(false);
  };

  const onFormChange = (field: keyof ProductForm, value: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (
      (field === "unitPrice" ||
        field === "taxPercent" ||
        field === "taxAmount" ||
        field === "discountPercent" ||
        field === "discountAmount") &&
      errors.lineTotal
    ) {
      setErrors((prev) => ({ ...prev, lineTotal: undefined }));
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onFormPatch = (patch: Partial<ProductForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const onClearError = (field: keyof FormErrors) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  /* ── Edit product ── */

  const onEditProduct = async (id: string) => {
    setFormError("");
    setErrors({});
    setVariantErrors({});
    setOriginalVariantMap({});
    setLoadingDetail(true);
    setStep(1);

    try {
      const detail = await getProductById(id);
      const formData: ProductForm = {
        currency: detail.currency ?? "TRY",
        purchasePrice: detail.purchasePrice != null ? String(detail.purchasePrice) : "",
        unitPrice: detail.unitPrice != null ? String(detail.unitPrice) : "",
        discountMode:
          detail.discountAmount != null && String(detail.discountAmount) !== "" ? "amount" : "percent",
        discountPercent: detail.discountPercent != null ? String(detail.discountPercent) : "",
        discountAmount: detail.discountAmount != null ? String(detail.discountAmount) : "",
        taxMode: detail.taxAmount != null && String(detail.taxAmount) !== "" ? "amount" : "percent",
        taxPercent: detail.taxPercent != null ? String(detail.taxPercent) : "",
        taxAmount: detail.taxAmount != null ? String(detail.taxAmount) : "",
        name: detail.name ?? "",
        sku: detail.sku ?? "",
        description: detail.description ?? "",
        image: detail.image ?? "",
        storeIds: detail.storeIds ?? [],
        applyToAllStores: Boolean(detail.applyToAllStores),
        categoryId: detail.categoryId ?? detail.category?.id ?? "",
        supplierId: detail.supplierId ?? detail.supplier?.id ?? "",
      };
      setForm(formData);
      setOriginalForm(formData);
      setVariants([]);
      setStep1ProductInfoOpen(true);
      setStep1StoreScopeOpen(true);

      setEditingProductId(detail.id);
      setDrawerOpen(true);
    } catch {
      setFormError("Urun detayi yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoadingDetail(false);
    }
  };

  /* ── Validation ── */

  const validateStep1 = (): boolean => {
    const { errors: newErrors, valid } = validateProductStep1(form, calculatedLineTotal, canTenantOnly);
    setErrors(newErrors);
    return valid;
  };

  const validateVariants = (): boolean => {
    const { variantErrors: newVariantErrors, formError: newFormError, valid } = validateProductVariants(variants);
    setVariantErrors(newVariantErrors);
    setFormError(newFormError);
    return valid;
  };

  /* ── Step navigation ── */

  const isFormChanged = (): boolean => {
    const simpleKeys = Object.keys(originalForm) as (keyof ProductForm)[];
    return simpleKeys.some((key) => {
      if (key === "storeIds") {
        const left = originalForm.storeIds;
        const right = form.storeIds;
        if (left.length !== right.length) return true;
        return left.some((id, i) => id !== right[i]);
      }
      return form[key] !== originalForm[key];
    });
  };

  const fetchVariants = async (productId: string) => {
    try {
      const productAttributesRes = await getProductAttributes(productId);
      const productAttributes = (productAttributesRes.attributes ?? []).map((attribute) => ({
        id: attribute.id,
        values: (attribute.values ?? [])
          .filter((value) => value.isActive)
          .map((value) => value.id),
      }));

      setOriginalVariantMap({});
      const clientKey = createVariantClientKey();
      setVariants([
        {
          clientKey,
          id: undefined,
          isActive: true,
          attributes: productAttributes.length > 0 ? productAttributes : [{ id: "", values: [] }],
        },
      ]);
      setExpandedVariantKeys([clientKey]);
    } catch {
      const clientKey = createVariantClientKey();
      setOriginalVariantMap({});
      setVariants([
        {
          clientKey,
          id: undefined,
          isActive: true,
          attributes: [{ id: "", values: [] }],
        },
      ]);
      setExpandedVariantKeys([clientKey]);
    }
  };

  const buildPricingPayload = () => ({
    currency: form.currency,
    unitPrice: Number(form.unitPrice),
    purchasePrice: Number(form.purchasePrice),
    ...(form.taxMode === "percent"
      ? form.taxPercent
        ? { taxPercent: Number(form.taxPercent) }
        : {}
      : form.taxAmount
        ? { taxAmount: Number(form.taxAmount) }
        : {}),
    ...(form.discountMode === "percent"
      ? form.discountPercent
        ? { discountPercent: Number(form.discountPercent) }
        : {}
      : form.discountAmount
        ? { discountAmount: Number(form.discountAmount) }
        : {}),
  });

  const buildScopePayload = () =>
    canTenantOnly
      ? { storeIds: [], applyToAllStores: false }
      : form.applyToAllStores
        ? { storeIds: [], applyToAllStores: true }
        : { storeIds: form.storeIds, applyToAllStores: false };

  const goToStep2 = async () => {
    if (!validateStep1()) return;

    setSubmitting(true);
    setFormError("");

    try {
      const productPayload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        description: form.description.trim() || undefined,
        image: form.image.trim() || undefined,
        categoryId: form.categoryId || undefined,
        supplierId: form.supplierId || undefined,
        ...buildPricingPayload(),
        ...buildScopePayload(),
      };

      if (editingProductId) {
        if (isFormChanged()) {
          await updateProduct(editingProductId, productPayload);
        }
        await fetchVariants(editingProductId);
        setStep(2);
      } else {
        const created = await createProduct(productPayload);
        setCreatedProductId(created.id);
        await fetchVariants(created.id);
        setStep(2);
      }
    } catch {
      setFormError(
        editingProductId
          ? "Urun guncellenemedi. Lutfen tekrar deneyin."
          : "Urun olusturulamadi. Lutfen tekrar deneyin.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const goToStep1 = () => setStep(1);

  /* ── Close & reset helper ── */
  const closeAndReset = async () => {
    setDrawerOpen(false);
    setForm(EMPTY_PRODUCT_FORM);
    setVariants([]);
    setEditingProductId(null);
    setCreatedProductId(null);
    setExpandedVariantKeys([]);
    setOriginalVariantMap({});
    setStep(1);
    await onSuccess();
  };

  /* ── Submit ── */

  const onSubmitProduct = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (step === 1) {
      goToStep2();
      return;
    }

    if (!validateVariants()) return;

    const preparedVariants = variants
      .filter((v) => v.attributes.some((a) => a.id && a.values.length > 0))
      .map((v) => ({
        id: v.id,
        isActive: v.isActive ?? true,
        payload: {
          attributes: v.attributes.filter((a) => a.id && a.values.length > 0),
        },
      }));

    const targetProductId = editingProductId ?? createdProductId;

    if (preparedVariants.length === 0) {
      await closeAndReset();
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      if (editingProductId) {
        const variantsToUpdate = preparedVariants.filter((v) => {
          if (!v.id) return false;
          const original = originalVariantMap[v.id];
          if (!original) return true;
          return (
            original.isActive !== v.isActive ||
            !areVariantAttributesEqual(original.payload.attributes, v.payload.attributes)
          );
        });
        const variantsToCreate = preparedVariants
          .filter((v) => !v.id)
          .map((v) => v.payload);

        const hasChanges = variantsToUpdate.length > 0 || variantsToCreate.length > 0;

        if (hasChanges) {
          if (variantsToUpdate.length > 0) {
            await Promise.all(
              variantsToUpdate.map((v) =>
                updateProductVariant(editingProductId, v.id!, v.payload),
              ),
            );
          }

          if (variantsToCreate.length > 0) {
            await Promise.all(
              variantsToCreate.map((dto) =>
                createProductVariant(editingProductId, dto),
              ),
            );
          }
        }
      } else {
        await Promise.all(
          preparedVariants.map((v) =>
            createProductVariant(targetProductId!, v.payload),
          ),
        );
      }

      await closeAndReset();
    } catch {
      setFormError("Varyantlar olusturulamadi. Lutfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Variant helpers ── */

  const { removeVariant, toggleVariantPanel, addAttribute, removeAttribute, updateVariantAttribute } =
    useVariantEditor({ variants, setVariants, expandedVariantKeys, setExpandedVariantKeys, setVariantErrors });

  return {
    /* state */
    drawerOpen,
    step,
    submitting,
    editingProductId,
    loadingDetail,
    formError,
    form,
    originalForm,
    errors,
    variants,
    expandedVariantKeys,
    originalVariantMap,
    variantErrors,
    createdProductId,
    attributeDefinitions,
    categoryOptions,
    step1ProductInfoOpen,
    setStep1ProductInfoOpen,
    step1StoreScopeOpen,
    setStep1StoreScopeOpen,
    /* derived */
    calculatedLineTotal,
    /* functions */
    onOpenDrawer,
    onCloseDrawer,
    onFormChange,
    onFormPatch,
    onClearError,
    onEditProduct,
    validateStep1,
    validateVariants,
    isFormChanged,
    fetchVariants,
    buildPricingPayload,
    buildScopePayload,
    goToStep2,
    goToStep1,
    closeAndReset,
    onSubmitProduct,
    /* variant helpers */
    removeVariant,
    toggleVariantPanel,
    addAttribute,
    removeAttribute,
    updateVariantAttribute,
  };
}

