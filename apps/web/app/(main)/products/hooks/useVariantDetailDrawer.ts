"use client";

import { useState } from "react";
import { updateProductVariant, type ProductVariant } from "@/lib/products";

type Options = {
  onSuccess: () => void;
};

type VariantDetailForm = {
  unitId: string;
  barcode: string;
};

export function useVariantDetailDrawer({ onSuccess }: Options) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [form, setForm] = useState<VariantDetailForm>({ unitId: "", barcode: "" });

  const openDrawer = (productId: string, variant: ProductVariant) => {
    setEditingProductId(productId);
    setEditingVariant(variant);
    setForm({
      unitId: (variant as unknown as { unit?: { id: string } }).unit?.id ?? "",
      barcode: variant.barcode ?? "",
    });
    setFormError("");
    setOpen(true);
  };

  const closeDrawer = () => {
    if (submitting) return;
    setOpen(false);
  };

  const onFormChange = (field: keyof VariantDetailForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!editingProductId || !editingVariant) return;
    setFormError("");
    setSubmitting(true);
    try {
      await updateProductVariant(editingProductId, editingVariant.id, {
        unitId: form.unitId || null,
        barcode: form.barcode || undefined,
        attributes: editingVariant.attributes ?? [],
      });
      setOpen(false);
      onSuccess();
    } catch (err) {
      const msg = (err as { message?: string }).message ?? "";
      if (msg.includes("zaten kullanimda") || msg.toLowerCase().includes("barcode")) {
        setFormError(`Barkod '${form.barcode}' bu tenant'ta zaten kullanımda.`);
      } else if (msg.includes("UNIT_NOT_FOUND")) {
        setFormError("Seçilen birim bulunamadı.");
      } else {
        setFormError("Varyant güncellenemedi. Lütfen tekrar deneyin.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return {
    open,
    submitting,
    formError,
    editingVariant,
    form,
    openDrawer,
    closeDrawer,
    onFormChange,
    handleSave,
  };
}
