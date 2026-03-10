import type { ProductForm, FormErrors, VariantErrors, VariantForm } from "@/components/products/types";
import { toNumberOrNull } from "@/lib/format";

export function validateProductStep1(
  form: ProductForm,
  calculatedLineTotal: number | null,
  canTenantOnly: boolean,
): { errors: FormErrors; valid: boolean } {
  const newErrors: FormErrors = {};

  if (!form.name.trim()) newErrors.name = "Urun adi zorunludur.";
  if (!form.sku.trim()) newErrors.sku = "SKU zorunludur.";

  if (!form.unitPrice || isNaN(Number(form.unitPrice)) || Number(form.unitPrice) < 0)
    newErrors.unitPrice = "Gecerli bir satis fiyati girin.";

  if (!form.purchasePrice || isNaN(Number(form.purchasePrice)) || Number(form.purchasePrice) < 0)
    newErrors.purchasePrice = "Gecerli bir alis fiyati girin.";

  if (form.taxMode === "percent") {
    if (form.taxPercent && isNaN(Number(form.taxPercent))) {
      newErrors.taxPercent = "Gecerli bir vergi orani girin.";
    } else if (form.taxPercent) {
      const tax = Number(form.taxPercent);
      if (tax < 0 || tax > 100) newErrors.taxPercent = "Vergi orani 0-100 arasi olmalidir.";
    }
  } else if (form.taxAmount && isNaN(Number(form.taxAmount))) {
    newErrors.taxAmount = "Gecerli bir vergi tutari girin.";
  }

  if (form.discountMode === "percent") {
    if (form.discountPercent && isNaN(Number(form.discountPercent))) {
      newErrors.discountPercent = "Gecerli bir indirim orani girin.";
    } else if (form.discountPercent) {
      const discount = Number(form.discountPercent);
      if (discount < 0 || discount > 100) newErrors.discountPercent = "Indirim orani 0-100 arasi olmalidir.";
    }
  } else if (form.discountAmount && isNaN(Number(form.discountAmount))) {
    newErrors.discountAmount = "Gecerli bir indirim tutari girin.";
  }

  if (calculatedLineTotal == null || Number.isNaN(calculatedLineTotal) || calculatedLineTotal < 0) {
    newErrors.lineTotal = "Gecerli bir satir toplami girin.";
  }

  if (canTenantOnly && !form.applyToAllStores && form.storeIds.length === 0) {
    newErrors.storeIds = "En az bir magaza secin veya tum magazalara uygulayin.";
  }

  return { errors: newErrors, valid: Object.keys(newErrors).length === 0 };
}

export function validateProductVariants(
  variants: VariantForm[],
): { variantErrors: Record<number, VariantErrors>; formError: string; valid: boolean } {
  if (variants.length === 0) {
    return { variantErrors: {}, formError: "En az bir ozellik eklemelisiniz.", valid: false };
  }

  const newErrors: Record<number, VariantErrors> = {};
  let hasAtLeastOneValidAttribute = false;

  variants.forEach((v, i) => {
    const e: VariantErrors = {};

    const hasEmptyAttr = v.attributes.some((a) => a.id && a.values.length === 0);
    const hasEmptyKey = v.attributes.some((a) => !a.id && a.values.length > 0);
    const validAttributeCount = v.attributes.filter((a) => a.id && a.values.length > 0).length;
    if (validAttributeCount > 0) hasAtLeastOneValidAttribute = true;

    if (hasEmptyAttr || hasEmptyKey) {
      e.attributes = "Tum ozellik alanlari doldurulmalidir.";
    } else if (validAttributeCount === 0) {
      e.attributes = "En az bir ozellik secmelisiniz.";
    }

    if (Object.keys(e).length > 0) newErrors[i] = e;
  });

  const formError = hasAtLeastOneValidAttribute ? "" : "En az bir ozellik eklemelisiniz.";
  const valid = Object.keys(newErrors).length === 0 && hasAtLeastOneValidAttribute;

  return { variantErrors: newErrors, formError, valid };
}
