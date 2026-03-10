import {
  createProductPackage,
  getProductPackageById,
  getProducts,
  getProductVariants,
  updateProductPackage,
  type Product,
  type ProductPackage,
  type ProductVariant,
} from "@gase/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TextInput } from "react-native";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { trackEvent } from "@/src/lib/analytics";
import { toNumber } from "@/src/lib/format";

export type PackageForm = {
  name: string;
  code: string;
  description: string;
};

export type PackageItemRow = {
  rowId: string;
  productVariantId: string;
  variantLabel: string;
  quantity: string;
};

const emptyForm: PackageForm = {
  name: "",
  code: "",
  description: "",
};

function createRowId() {
  return `pkg-row-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function validateItemQuantity(value: string) {
  if (!value.trim()) return "Miktar zorunlu.";
  const quantity = toNumber(value, Number.NaN);
  if (!Number.isFinite(quantity)) return "Gecerli bir miktar girin.";
  return quantity > 0 ? "" : "Miktar en az 1 olmali.";
}

type UsePackageFormParams = {
  onSaveSuccess: (updated?: ProductPackage) => Promise<void>;
};

export function usePackageForm({ onSaveSuccess }: UsePackageFormParams) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingIsActive, setEditingIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<PackageForm>(emptyForm);
  const [formAttempted, setFormAttempted] = useState(false);
  const [formError, setFormError] = useState("");
  const [items, setItems] = useState<PackageItemRow[]>([]);

  // Variant picker state
  const [variantSearchTerm, setVariantSearchTerm] = useState("");
  const [variantSearchLoading, setVariantSearchLoading] = useState(false);
  const [variantSearchProducts, setVariantSearchProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProductLabel, setSelectedProductLabel] = useState("");
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantOptions, setVariantOptions] = useState<ProductVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [addItemQuantity, setAddItemQuantity] = useState("1");
  const [addItemError, setAddItemError] = useState("");

  const debouncedVariantSearch = useDebouncedValue(variantSearchTerm, 350);

  const codeRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  // Variant product search effect
  useEffect(() => {
    if (!editorOpen) return;
    if (!debouncedVariantSearch.trim()) {
      setVariantSearchProducts([]);
      return;
    }

    let cancelled = false;
    setVariantSearchLoading(true);
    getProducts({
      page: 1,
      limit: 20,
      search: debouncedVariantSearch,
      isActive: true,
    })
      .then((response) => {
        if (!cancelled) setVariantSearchProducts(response.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setVariantSearchProducts([]);
      })
      .finally(() => {
        if (!cancelled) setVariantSearchLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedVariantSearch, editorOpen]);

  // Variant options effect
  useEffect(() => {
    if (!editorOpen) return;
    if (!selectedProductId) {
      setVariantOptions([]);
      setSelectedVariantId("");
      return;
    }

    let cancelled = false;
    setVariantsLoading(true);
    getProductVariants(selectedProductId, { isActive: true })
      .then((variants) => {
        if (!cancelled) {
          const nextVariants = variants.filter((variant) => variant.isActive !== false);
          setVariantOptions(nextVariants);
          setSelectedVariantId((current) => current || nextVariants[0]?.id || "");
        }
      })
      .catch(() => {
        if (!cancelled) setVariantOptions([]);
      })
      .finally(() => {
        if (!cancelled) setVariantsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [editorOpen, selectedProductId]);

  const nameError = useMemo(() => {
    if (!formAttempted && !form.name.trim()) return "";
    if (!form.name.trim()) return "Paket adi zorunlu.";
    return form.name.trim().length >= 2 ? "" : "Paket adi en az 2 karakter olmali.";
  }, [form.name, formAttempted]);

  const codeError = useMemo(() => {
    if (!formAttempted && !form.code.trim()) return "";
    return form.code.trim() ? "" : "Paket kodu zorunlu.";
  }, [form.code, formAttempted]);

  const itemErrors = useMemo(
    () =>
      Object.fromEntries(
        items.map((item) => [item.rowId, validateItemQuantity(item.quantity)]),
      ) as Record<string, string>,
    [items],
  );

  const itemsError = useMemo(() => {
    if (!formAttempted) return "";
    if (!items.length) return "En az bir paket kalemi ekle.";
    const hasInvalidItem = items.some((item) => itemErrors[item.rowId]);
    return hasInvalidItem ? "Kalem miktarlarini duzelt." : "";
  }, [formAttempted, itemErrors, items]);

  const resetVariantPicker = useCallback(() => {
    setVariantSearchTerm("");
    setVariantSearchProducts([]);
    setSelectedProductId("");
    setSelectedProductLabel("");
    setVariantOptions([]);
    setSelectedVariantId("");
    setAddItemQuantity("1");
    setAddItemError("");
  }, []);

  const resetEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingId(null);
    setEditingIsActive(true);
    setForm(emptyForm);
    setFormAttempted(false);
    setFormError("");
    setItems([]);
    resetVariantPicker();
  }, [resetVariantPicker]);

  const populateEditorFromPackage = useCallback(
    (detail: ProductPackage) => {
      setForm({
        name: detail.name ?? "",
        code: detail.code ?? "",
        description: detail.description ?? "",
      });
      setItems(
        (detail.items ?? []).map((item) => ({
          rowId: createRowId(),
          productVariantId: item.productVariant.id,
          variantLabel: `${item.productVariant.name} (${item.productVariant.code})`,
          quantity: String(item.quantity),
        })),
      );
      setEditingId(detail.id);
      setEditingIsActive(detail.isActive ?? true);
      setFormAttempted(false);
      setFormError("");
      resetVariantPicker();
      setEditorOpen(true);
    },
    [resetVariantPicker],
  );

  const openCreateModal = useCallback(() => {
    setEditorLoading(false);
    setEditingId(null);
    setEditingIsActive(true);
    setForm(emptyForm);
    setItems([]);
    setFormAttempted(false);
    setFormError("");
    resetVariantPicker();
    setEditorOpen(true);
  }, [resetVariantPicker]);

  const openEditModal = useCallback(
    async (packageId: string) => {
      setEditorLoading(true);
      setFormError("");
      setEditorOpen(true);
      try {
        const detail = await getProductPackageById(packageId);
        populateEditorFromPackage(detail);
      } catch (nextError) {
        setFormError(
          nextError instanceof Error ? nextError.message : "Paket detayi yuklenemedi.",
        );
      } finally {
        setEditorLoading(false);
      }
    },
    [populateEditorFromPackage],
  );

  const addVariantItem = () => {
    setAddItemError("");
    if (!selectedVariantId) {
      setAddItemError("Paket icin bir varyant sec.");
      return;
    }

    const quantityError = validateItemQuantity(addItemQuantity);
    if (quantityError) {
      setAddItemError(quantityError);
      return;
    }

    if (items.some((item) => item.productVariantId === selectedVariantId)) {
      setAddItemError("Bu varyant pakete zaten eklendi.");
      return;
    }

    const variant = variantOptions.find((item) => item.id === selectedVariantId);
    if (!variant) {
      setAddItemError("Secilen varyant tekrar yuklenemedi.");
      return;
    }

    setItems((current) => [
      ...current,
      {
        rowId: createRowId(),
        productVariantId: variant.id,
        variantLabel: `${variant.name} (${variant.code})`,
        quantity: addItemQuantity,
      },
    ]);
    setSelectedVariantId("");
    setAddItemQuantity("1");
  };

  const submitPackage = async () => {
    setFormAttempted(true);

    if (nameError || codeError || itemsError) {
      trackEvent("validation_error", { screen: "product_packages", field: "package_form" });
      setFormError("Paket alanlarini duzeltip tekrar dene.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim() || undefined,
        items: items.map((item) => ({
          productVariantId: item.productVariantId,
          quantity: toNumber(item.quantity),
        })),
      };

      let updated: ProductPackage | undefined;
      if (editingId) {
        updated = await updateProductPackage(editingId, {
          ...payload,
          isActive: editingIsActive,
        });
      } else {
        await createProductPackage(payload);
      }

      resetEditor();
      await onSaveSuccess(updated);
    } catch (nextError) {
      setFormError(nextError instanceof Error ? nextError.message : "Paket kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    editorOpen,
    editorLoading,
    editingId,
    editingIsActive,
    setEditingIsActive,
    submitting,
    form,
    setForm,
    formAttempted,
    formError,
    setFormError,
    items,
    setItems,
    variantSearchTerm,
    setVariantSearchTerm,
    variantSearchLoading,
    variantSearchProducts,
    selectedProductId,
    setSelectedProductId,
    selectedProductLabel,
    setSelectedProductLabel,
    variantsLoading,
    variantOptions,
    selectedVariantId,
    setSelectedVariantId,
    addItemQuantity,
    setAddItemQuantity,
    addItemError,
    setAddItemError,
    nameError,
    codeError,
    itemErrors,
    itemsError,
    codeRef,
    descriptionRef,
    openCreateModal,
    openEditModal,
    resetEditor,
    addVariantItem,
    submitPackage,
  };
}
