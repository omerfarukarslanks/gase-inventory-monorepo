"use client";

import { useState } from "react";
import {
  createAttribute,
  createAttributeValues,
  getAttributeById,
  updateAttribute,
  updateAttributeValue,
  type Attribute,
} from "@/lib/attributes";
import { parseCommaSeparated, type DrawerStep, type EditableValue } from "@/components/attributes/types";

type Options = {
  t: (key: string) => string;
  onMutated: () => Promise<void>;
  onSuccess: (message: string) => void;
};

export function useAttributeDrawer({ t, onMutated, onSuccess }: Options) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState<DrawerStep>(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [workingAttribute, setWorkingAttribute] = useState<Attribute | null>(null);
  const [formName, setFormName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [existingValues, setExistingValues] = useState<EditableValue[]>([]);
  const [newValuesInput, setNewValuesInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);

  const openCreateDrawer = () => {
    setEditingId(null);
    setWorkingAttribute(null);
    setDrawerStep(1);
    setFormName("");
    setOriginalName("");
    setExistingValues([]);
    setNewValuesInput("");
    setFormError("");
    setDrawerOpen(true);
  };

  const openEditDrawer = async (attribute: Attribute) => {
    setEditingId(attribute.id);
    setWorkingAttribute(attribute);
    setDrawerStep(1);
    setFormName(attribute.name);
    setOriginalName(attribute.name);
    setExistingValues([]);
    setNewValuesInput("");
    setFormError("");
    setDrawerOpen(true);
    setDetailLoading(true);

    try {
      const detail = await getAttributeById(attribute.id);
      const values = [...detail.values]
        .sort((a, b) => Number(a.value) - Number(b.value))
        .map((value) => ({
          id: value.id,
          name: value.name ?? "",
          isActive: value.isActive,
          originalName: value.name ?? "",
          originalIsActive: value.isActive,
        }));
      setExistingValues(values);
    } catch {
      setFormError(t("attributes.loadError"));
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDrawer = () => {
    if (submitting) return;
    setDrawerOpen(false);
  };

  const goNextStep = async () => {
    setFormError("");
    if (!formName.trim()) {
      setFormError("Ozellik adi zorunludur.");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      const nextName = formName.trim();

      if (editingId && workingAttribute) {
        if (nextName !== originalName.trim()) {
          await updateAttribute(editingId, { name: nextName });
          setOriginalName(nextName);
          onSuccess("Ozellik bilgisi guncellendi.");
          await onMutated();
        }
      } else {
        const created = await createAttribute({ name: nextName });
        setEditingId(created.id);
        setWorkingAttribute(created);
        setOriginalName(created.name ?? nextName);
        onSuccess("Ozellik olusturuldu. Deger girisine devam edin.");
        await onMutated();
      }

      setDrawerStep(2);
    } catch {
      setFormError("Ozellik kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const goPrevStep = () => {
    setFormError("");
    setDrawerStep(1);
  };

  const handleSave = async () => {
    setFormError("");
    if (!workingAttribute) {
      setFormError("Ozellik kimligi bulunamadi. Lutfen tekrar deneyin.");
      return;
    }

    const preparedNewValues = parseCommaSeparated(newValuesInput).map((name) => ({ name }));
    const existingValueUpdates = existingValues
      .filter((item) => item.name.trim() !== item.originalName)
      .map((item) => ({ id: item.id, name: item.name.trim() }));

    if (existingValueUpdates.some((item) => !item.name)) {
      setFormError("Deger adi bos birakilamaz.");
      return;
    }

    if (preparedNewValues.length === 0 && existingValueUpdates.length === 0) {
      onSuccess("Degisiklik yok.");
      setDrawerOpen(false);
      return;
    }

    setSubmitting(true);
    try {
      if (existingValueUpdates.length > 0) {
        await Promise.all(
          existingValueUpdates.map((value) => updateAttributeValue(value.id, { name: value.name })),
        );
      }

      if (preparedNewValues.length > 0) {
        await createAttributeValues(workingAttribute.value, preparedNewValues);
      }

      setDrawerOpen(false);
      onSuccess("Degerler kaydedildi.");
      await onMutated();
    } catch {
      setFormError("Kaydetme islemi basarisiz oldu.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateEditableValue = (id: string, patch: Partial<EditableValue>) => {
    setExistingValues((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  return {
    /* state */
    drawerOpen,
    drawerStep,
    editingId,
    submitting,
    detailLoading,
    formName,
    setFormName,
    originalName,
    existingValues,
    newValuesInput,
    setNewValuesInput,
    formError,
    /* functions */
    openCreateDrawer,
    openEditDrawer,
    closeDrawer,
    goNextStep,
    goPrevStep,
    handleSave,
    updateEditableValue,
  };
}
