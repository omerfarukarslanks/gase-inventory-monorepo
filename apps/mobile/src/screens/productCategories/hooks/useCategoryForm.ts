import {
  createProductCategory,
  getProductCategoryById,
  updateProductCategory,
  type ProductCategory,
} from "@gase/core";
import { useCallback, useMemo, useRef, useState } from "react";
import { type TextInput } from "react-native";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { trackEvent } from "@/src/lib/analytics";

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  parentId: string;
};

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  parentId: "",
};

export const rootCategoryValue = "__root__";

export function slugifyText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[ç]/g, "c")
    .replace(/[ğ]/g, "g")
    .replace(/[ı]/g, "i")
    .replace(/[ö]/g, "o")
    .replace(/[ş]/g, "s")
    .replace(/[ü]/g, "u")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

type UseCategoryFormParams = {
  allCategories: { id: string; name: string; slug?: string | null; description?: string | null; isActive?: boolean | null }[];
  fetchCategories: () => Promise<void>;
  fetchAllCategories: () => Promise<void>;
  setSelectedCategory: (category: ProductCategory | null) => void;
};

export function useCategoryForm({
  allCategories,
  fetchCategories,
  fetchAllCategories,
  setSelectedCategory,
}: UseCategoryFormParams) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryIsActive, setEditingCategoryIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [formAttempted, setFormAttempted] = useState(false);
  const [formError, setFormError] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [parentSearch, setParentSearch] = useState("");
  const debouncedParentSearch = useDebouncedValue(parentSearch, 150);
  const slugRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  const nameError = useMemo(() => {
    if (!formAttempted && !form.name.trim()) return "";
    if (!form.name.trim()) return "Kategori adi zorunlu.";
    return form.name.trim().length >= 2 ? "" : "Kategori adi en az 2 karakter olmali.";
  }, [form.name, formAttempted]);

  const slugError = useMemo(() => {
    if (!formAttempted && !form.slug.trim()) return "";
    const trimmedSlug = form.slug.trim();
    if (!trimmedSlug) return "Slug alani zorunlu.";
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmedSlug)
      ? ""
      : "Slug sadece kucuk harf, rakam ve tire icerebilir.";
  }, [form.slug, formAttempted]);

  const parentError = useMemo(() => {
    if (!editingCategoryId || !form.parentId) return "";
    return editingCategoryId === form.parentId
      ? "Bir kategori kendisini ust kategori secemez."
      : "";
  }, [editingCategoryId, form.parentId]);

  const parentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allCategories.forEach((category) => {
      map.set(category.id, category.name);
    });
    return map;
  }, [allCategories]);

  const selectedParentLabel = useMemo(() => {
    if (!form.parentId) return "Kok kategori";
    return parentNameMap.get(form.parentId) ?? "Secili kategori bulunamadi";
  }, [form.parentId, parentNameMap]);

  const parentSelectionItems = useMemo(() => {
    const normalizedSearch = debouncedParentSearch.trim().toLowerCase();
    const parentOptions = allCategories
      .filter((category) => category.id !== editingCategoryId)
      .filter((category) => {
        if (!normalizedSearch) return true;
        return [category.name, category.slug, category.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .map((category) => ({
        value: category.id,
        label: category.name,
        description: [
          category.slug ? `Slug: ${category.slug}` : null,
          category.isActive === false ? "Pasif" : "Aktif",
        ]
          .filter(Boolean)
          .join(" • "),
      }));

    return [
      {
        value: rootCategoryValue,
        label: "Kok kategori",
        description: "Bu kaydi ust seviye kategori olarak tut.",
      },
      ...parentOptions,
    ];
  }, [allCategories, debouncedParentSearch, editingCategoryId]);

  const resetEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingCategoryId(null);
    setEditingCategoryIsActive(true);
    setForm(emptyForm);
    setFormAttempted(false);
    setFormError("");
    setSlugTouched(false);
    setParentSearch("");
  }, []);

  const openCreateModal = useCallback(() => {
    setEditorOpen(true);
    setEditingCategoryId(null);
    setEditingCategoryIsActive(true);
    setForm(emptyForm);
    setFormAttempted(false);
    setFormError("");
    setSlugTouched(false);
    setParentSearch("");
  }, []);

  const openEditModal = useCallback((category: ProductCategory) => {
    setEditorOpen(true);
    setEditingCategoryId(category.id);
    setEditingCategoryIsActive(category.isActive ?? true);
    setForm({
      name: category.name ?? "",
      slug: category.slug ?? slugifyText(category.name ?? ""),
      description: category.description ?? "",
      parentId: category.parentId ?? "",
    });
    setFormAttempted(false);
    setFormError("");
    setSlugTouched(true);
    setParentSearch("");
  }, []);

  const submitCategory = async () => {
    setFormAttempted(true);

    if (nameError || slugError || parentError) {
      trackEvent("validation_error", { screen: "product_categories", field: "category_form" });
      setFormError("Alanlari duzeltip tekrar dene.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      if (editingCategoryId) {
        const updated = await updateProductCategory(editingCategoryId, {
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || undefined,
          parentId: form.parentId || null,
          isActive: editingCategoryIsActive,
        });
        const refreshed = await getProductCategoryById(updated.id);
        setSelectedCategory(refreshed);
      } else {
        await createProductCategory({
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || undefined,
          parentId: form.parentId || null,
          isActive: true,
        });
      }

      resetEditor();
      await Promise.all([fetchCategories(), fetchAllCategories()]);
    } catch (nextError) {
      setFormError(nextError instanceof Error ? nextError.message : "Kategori kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCategoryActive = async (selectedCategory: ProductCategory, onError: (msg: string) => void) => {
    setToggling(true);
    try {
      const updated = await updateProductCategory(selectedCategory.id, {
        name: selectedCategory.name,
        slug: selectedCategory.slug ?? slugifyText(selectedCategory.name),
        description: selectedCategory.description ?? undefined,
        parentId: selectedCategory.parentId ?? null,
        isActive: !(selectedCategory.isActive ?? true),
      });
      const refreshed = await getProductCategoryById(updated.id);
      setSelectedCategory(refreshed);
      await Promise.all([fetchCategories(), fetchAllCategories()]);
    } catch (nextError) {
      onError(nextError instanceof Error ? nextError.message : "Kategori durumu guncellenemedi.");
    } finally {
      setToggling(false);
    }
  };

  const handleFormChange = (field: keyof CategoryForm, value: string) => {
    setForm((current) => {
      if (field === "name") {
        const nextName = value;
        return {
          ...current,
          name: nextName,
          slug: slugTouched ? current.slug : slugifyText(nextName),
        };
      }
      return { ...current, [field]: value };
    });
    if (field === "slug") setSlugTouched(true);
    if (formError) setFormError("");
  };

  const handleParentSelect = (value: string) => {
    setForm((current) => ({
      ...current,
      parentId: value === rootCategoryValue ? "" : value,
    }));
    if (formError) setFormError("");
  };

  return {
    editorOpen,
    editingCategoryId,
    editingCategoryIsActive,
    setEditingCategoryIsActive,
    submitting,
    toggling,
    form,
    formError,
    nameError,
    slugError,
    parentError,
    parentSearch,
    setParentSearch,
    selectedParentLabel,
    parentSelectionItems,
    slugRef,
    descriptionRef,
    resetEditor,
    openCreateModal,
    openEditModal,
    submitCategory,
    toggleCategoryActive,
    handleFormChange,
    handleParentSelect,
  };
}

export type { CategoryForm };
