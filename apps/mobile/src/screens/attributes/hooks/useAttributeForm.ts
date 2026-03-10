import {
  createAttribute,
  createAttributeValues,
  getAttributeById,
  updateAttribute,
  updateAttributeValue,
  type AttributeDetail,
  type AttributeValue,
} from "@gase/core";
import { useCallback, useMemo, useRef, useState } from "react";
import { type TextInput } from "react-native";
import { trackEvent } from "@/src/lib/analytics";

type EditableValue = {
  id: string;
  name: string;
  isActive: boolean;
  originalName: string;
};

function parseCommaSeparated(input: string): string[] {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function sortValues(values: AttributeValue[] = []) {
  return [...values].sort((left, right) => {
    const leftNumber = Number(left.value);
    const rightNumber = Number(right.value);

    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      return leftNumber - rightNumber;
    }

    return String(left.value).localeCompare(String(right.value), "tr");
  });
}

export function toEditableValues(values: AttributeValue[] = []): EditableValue[] {
  return sortValues(values).map((value) => ({
    id: value.id,
    name: value.name ?? "",
    isActive: value.isActive,
    originalName: value.name ?? "",
  }));
}

export { sortValues };

type UseAttributeFormParams = {
  fetchAttributes: () => Promise<void>;
  setSelectedAttribute: (attribute: AttributeDetail | null) => void;
};

export function useAttributeForm({ fetchAttributes, setSelectedAttribute }: UseAttributeFormParams) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAttributeId, setEditingAttributeId] = useState<string | null>(null);
  const [editingAttributeIsActive, setEditingAttributeIsActive] = useState(true);
  const [formName, setFormName] = useState("");
  const [formAttempted, setFormAttempted] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [valueEditorOpen, setValueEditorOpen] = useState(false);
  const [existingValues, setExistingValues] = useState<EditableValue[]>([]);
  const [newValuesInput, setNewValuesInput] = useState("");
  const [valueFormError, setValueFormError] = useState("");
  const [valueSubmitting, setValueSubmitting] = useState(false);
  const [togglingAttribute, setTogglingAttribute] = useState(false);
  const [togglingValueId, setTogglingValueId] = useState<string | null>(null);
  const nameRef = useRef<TextInput>(null);
  const valuesRef = useRef<TextInput>(null);

  const nameError = useMemo(() => {
    if (!formAttempted && !formName.trim()) return "";
    if (!formName.trim()) return "Ozellik adi zorunlu.";
    return formName.trim().length >= 2 ? "" : "Ozellik adi en az 2 karakter olmali.";
  }, [formAttempted, formName]);

  const resetEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingAttributeId(null);
    setEditingAttributeIsActive(true);
    setFormName("");
    setFormAttempted(false);
    setFormError("");
  }, []);

  const resetValueEditor = useCallback(() => {
    setValueEditorOpen(false);
    setExistingValues([]);
    setNewValuesInput("");
    setValueFormError("");
  }, []);

  const openCreateModal = useCallback(() => {
    setEditorOpen(true);
    setEditingAttributeId(null);
    setEditingAttributeIsActive(true);
    setFormName("");
    setFormAttempted(false);
    setFormError("");
  }, []);

  const openEditModal = useCallback((attribute: AttributeDetail) => {
    setEditorOpen(true);
    setEditingAttributeId(attribute.id);
    setEditingAttributeIsActive(attribute.isActive);
    setFormName(attribute.name ?? "");
    setFormAttempted(false);
    setFormError("");
  }, []);

  const openValuesEditor = useCallback((attribute: AttributeDetail) => {
    setSelectedAttribute(attribute);
    setExistingValues(toEditableValues(attribute.values));
    setNewValuesInput("");
    setValueFormError("");
    setValueEditorOpen(true);
  }, [setSelectedAttribute]);

  const submitAttribute = async (canManageValues: boolean) => {
    setFormAttempted(true);

    if (nameError) {
      trackEvent("validation_error", { screen: "attributes", field: "attribute_name" });
      setFormError("Alanlari duzeltip tekrar dene.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      if (editingAttributeId) {
        const updated = await updateAttribute(editingAttributeId, {
          name: formName.trim(),
          isActive: editingAttributeIsActive,
        });
        const refreshed = await getAttributeById(updated.id);
        setSelectedAttribute(refreshed);
      } else {
        const created = await createAttribute({ name: formName.trim() });
        const refreshed = await getAttributeById(created.id);
        setSelectedAttribute(refreshed);
        if (canManageValues) {
          setExistingValues(toEditableValues(refreshed.values));
          setNewValuesInput("");
          setValueFormError("");
          setValueEditorOpen(true);
        }
      }

      resetEditor();
      await fetchAttributes();
    } catch (nextError) {
      setFormError(nextError instanceof Error ? nextError.message : "Ozellik kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const saveValues = async (selectedAttribute: AttributeDetail | null) => {
    if (!selectedAttribute) {
      setValueFormError("Ozellik detayi bulunamadi. Tekrar dene.");
      return;
    }

    const preparedNewValues = parseCommaSeparated(newValuesInput).map((name) => ({ name }));
    const existingValueUpdates = existingValues
      .filter((value) => value.name.trim() !== value.originalName)
      .map((value) => ({ id: value.id, name: value.name.trim() }));

    if (existingValueUpdates.some((value) => !value.name)) {
      trackEvent("validation_error", { screen: "attributes", field: "attribute_values" });
      setValueFormError("Deger adi bos birakilamaz.");
      return;
    }

    if (!preparedNewValues.length && !existingValueUpdates.length) {
      resetValueEditor();
      return;
    }

    setValueSubmitting(true);
    setValueFormError("");
    try {
      if (existingValueUpdates.length) {
        await Promise.all(
          existingValueUpdates.map((value) =>
            updateAttributeValue(value.id, { name: value.name }),
          ),
        );
      }

      if (preparedNewValues.length) {
        await createAttributeValues(selectedAttribute.value, preparedNewValues);
      }

      const refreshed = await getAttributeById(selectedAttribute.id);
      setSelectedAttribute(refreshed);
      resetValueEditor();
      await fetchAttributes();
    } catch (nextError) {
      setValueFormError(
        nextError instanceof Error ? nextError.message : "Degerler kaydedilemedi.",
      );
    } finally {
      setValueSubmitting(false);
    }
  };

  const toggleAttributeActive = async (
    selectedAttribute: AttributeDetail,
    onError: (msg: string) => void,
  ) => {
    setTogglingAttribute(true);
    try {
      await updateAttribute(selectedAttribute.id, {
        isActive: !selectedAttribute.isActive,
      });
      const refreshed = await getAttributeById(selectedAttribute.id);
      setSelectedAttribute(refreshed);
      await fetchAttributes();
    } catch (nextError) {
      onError(nextError instanceof Error ? nextError.message : "Ozellik durumu guncellenemedi.");
    } finally {
      setTogglingAttribute(false);
    }
  };

  const toggleValueActive = async (
    value: Pick<AttributeValue, "id">,
    next: boolean,
    selectedAttribute: AttributeDetail | null,
    onError: (msg: string) => void,
  ) => {
    if (!selectedAttribute) return;

    setTogglingValueId(value.id);
    try {
      await updateAttributeValue(value.id, { isActive: next });
      const refreshed = await getAttributeById(selectedAttribute.id);
      setSelectedAttribute(refreshed);
      await fetchAttributes();
    } catch (nextError) {
      onError(nextError instanceof Error ? nextError.message : "Deger durumu guncellenemedi.");
    } finally {
      setTogglingValueId(null);
    }
  };

  return {
    editorOpen,
    editingAttributeId,
    editingAttributeIsActive,
    setEditingAttributeIsActive,
    formName,
    setFormName,
    formError,
    setFormError,
    nameError,
    submitting,
    valueEditorOpen,
    existingValues,
    setExistingValues,
    newValuesInput,
    setNewValuesInput,
    valueFormError,
    setValueFormError,
    valueSubmitting,
    togglingAttribute,
    togglingValueId,
    nameRef,
    valuesRef,
    resetEditor,
    resetValueEditor,
    openCreateModal,
    openEditModal,
    openValuesEditor,
    submitAttribute,
    saveValues,
    toggleAttributeActive,
    toggleValueActive,
  };
}

export type { EditableValue };
