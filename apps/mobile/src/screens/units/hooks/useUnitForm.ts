import { useCallback, useMemo, useState } from "react";
import { createUnit, updateUnit, type Unit } from "@gase/core";

export type UnitForm = {
  name: string;
  abbreviation: string;
};

type Options = {
  fetchUnits: () => Promise<void>;
  setSelectedUnit: (unit: Unit | null) => void;
};

function parseApiErrorCode(err: unknown): string | null {
  const msg = (err as { message?: string }).message ?? "";
  if (msg.includes("UNIT_NAME_EXISTS")) return "UNIT_NAME_EXISTS";
  if (msg.includes("UNIT_ABBREVIATION_EXISTS")) return "UNIT_ABBREVIATION_EXISTS";
  if (msg.includes("CANNOT_DEACTIVATE_DEFAULT")) return "CANNOT_DEACTIVATE_DEFAULT";
  return null;
}

const EMPTY_FORM: UnitForm = { name: "", abbreviation: "" };

export function useUnitForm({ fetchUnits, setSelectedUnit }: Options) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnitIsDefault, setEditingUnitIsDefault] = useState(false);
  const [editingUnitIsActive, setEditingUnitIsActive] = useState(true);
  const [form, setForm] = useState<UnitForm>(EMPTY_FORM);
  const [formAttempted, setFormAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [formError, setFormError] = useState("");

  const nameError = useMemo(() => {
    if (!formAttempted) return "";
    return form.name.trim() ? "" : "Birim adı zorunludur.";
  }, [form.name, formAttempted]);

  const abbreviationError = useMemo(() => {
    if (!formAttempted) return "";
    return form.abbreviation.trim() ? "" : "Kısaltma zorunludur.";
  }, [form.abbreviation, formAttempted]);

  const resetEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingUnitId(null);
    setEditingUnitIsDefault(false);
    setEditingUnitIsActive(true);
    setForm(EMPTY_FORM);
    setFormAttempted(false);
    setFormError("");
  }, []);

  const openCreateModal = useCallback(() => {
    setEditingUnitId(null);
    setEditingUnitIsDefault(false);
    setEditingUnitIsActive(true);
    setForm(EMPTY_FORM);
    setFormAttempted(false);
    setFormError("");
    setEditorOpen(true);
  }, []);

  const openEditModal = useCallback((unit: Unit) => {
    setEditingUnitId(unit.id);
    setEditingUnitIsDefault(unit.isDefault);
    setEditingUnitIsActive(unit.isActive);
    setForm({ name: unit.name, abbreviation: unit.abbreviation });
    setFormAttempted(false);
    setFormError("");
    setEditorOpen(true);
  }, []);

  const handleFormChange = useCallback((field: keyof UnitForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const submitUnit = useCallback(async () => {
    setFormAttempted(true);
    if (!form.name.trim() || !form.abbreviation.trim()) return;

    setSubmitting(true);
    setFormError("");
    try {
      if (editingUnitId) {
        const updated = await updateUnit(editingUnitId, {
          name: form.name.trim(),
          abbreviation: form.abbreviation.trim(),
          isActive: editingUnitIsActive,
        });
        setSelectedUnit(updated);
      } else {
        await createUnit({ name: form.name.trim(), abbreviation: form.abbreviation.trim() });
      }
      await fetchUnits();
      setEditorOpen(false);
    } catch (err) {
      const code = parseApiErrorCode(err);
      if (code === "UNIT_NAME_EXISTS") {
        setFormError("Bu isimde bir birim zaten mevcut.");
      } else if (code === "UNIT_ABBREVIATION_EXISTS") {
        setFormError("Bu kısaltmada bir birim zaten mevcut.");
      } else if (code === "CANNOT_DEACTIVATE_DEFAULT") {
        setFormError("Varsayılan birim pasife alınamaz.");
      } else {
        setFormError("Birim kaydedilemedi. Lütfen tekrar deneyin.");
      }
    } finally {
      setSubmitting(false);
    }
  }, [form, editingUnitId, editingUnitIsActive, fetchUnits, setSelectedUnit]);

  const toggleUnitActive = useCallback(
    async (unit: Unit, setError: (msg: string) => void) => {
      if (unit.isDefault) {
        setError("Varsayılan birim pasife alınamaz.");
        return;
      }
      setToggling(true);
      try {
        const updated = await updateUnit(unit.id, { isActive: !unit.isActive });
        setSelectedUnit(updated);
        await fetchUnits();
      } catch {
        setError("Birim durumu güncellenemedi.");
      } finally {
        setToggling(false);
      }
    },
    [fetchUnits, setSelectedUnit],
  );

  return {
    editorOpen,
    editingUnitId,
    editingUnitIsDefault,
    editingUnitIsActive,
    setEditingUnitIsActive,
    submitting,
    toggling,
    form,
    formAttempted,
    formError,
    nameError,
    abbreviationError,
    resetEditor,
    openCreateModal,
    openEditModal,
    handleFormChange,
    submitUnit,
    toggleUnitActive,
  };
}
