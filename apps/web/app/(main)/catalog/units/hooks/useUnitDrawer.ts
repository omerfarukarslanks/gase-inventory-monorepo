"use client";

import { useState } from "react";
import {
  createUnit,
  getUnitById,
  updateUnit,
  type Unit,
} from "@gase/core";

type Options = {
  t: (key: string) => string;
  onMutated: () => Promise<void>;
  onSuccess: (message: string) => void;
};

type UnitForm = {
  name: string;
  abbreviation: string;
  isActive: boolean;
};

const EMPTY_FORM: UnitForm = {
  name: "",
  abbreviation: "",
  isActive: true,
};

function parseApiError(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const msg = (error as { message?: string }).message ?? "";
  if (msg.includes("UNIT_NAME_EXISTS")) return "UNIT_NAME_EXISTS";
  if (msg.includes("UNIT_ABBREVIATION_EXISTS")) return "UNIT_ABBREVIATION_EXISTS";
  if (msg.includes("CANNOT_DEACTIVATE_DEFAULT")) return "CANNOT_DEACTIVATE_DEFAULT";
  return null;
}

export function useUnitDrawer({ t, onMutated, onSuccess }: Options) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [form, setForm] = useState<UnitForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [nameError, setNameError] = useState("");
  const [abbreviationError, setAbbreviationError] = useState("");

  const openCreateDrawer = () => {
    setEditingId(null);
    setEditingUnit(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setNameError("");
    setAbbreviationError("");
    setDrawerOpen(true);
  };

  const openEditDrawer = async (unit: Unit) => {
    setEditingId(unit.id);
    setEditingUnit(unit);
    setForm({ name: unit.name, abbreviation: unit.abbreviation, isActive: unit.isActive });
    setFormError("");
    setNameError("");
    setAbbreviationError("");
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      const detail = await getUnitById(unit.id);
      setForm({ name: detail.name, abbreviation: detail.abbreviation, isActive: detail.isActive });
      setEditingUnit(detail);
    } catch {
      setFormError(t("units.loadError"));
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDrawer = () => {
    if (submitting) return;
    setDrawerOpen(false);
  };

  const onFormChange = (field: keyof UnitForm, value: string | boolean) => {
    if (field === "name" && nameError) setNameError("");
    if (field === "abbreviation" && abbreviationError) setAbbreviationError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setFormError("");
    setNameError("");
    setAbbreviationError("");

    if (!form.name.trim()) {
      setNameError(t("units.nameRequired"));
      return;
    }
    if (!form.abbreviation.trim()) {
      setAbbreviationError(t("units.abbreviationRequired"));
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await updateUnit(editingId, {
          name: form.name.trim(),
          abbreviation: form.abbreviation.trim(),
          isActive: form.isActive,
        });
        onSuccess(t("units.updateSuccess"));
      } else {
        await createUnit({
          name: form.name.trim(),
          abbreviation: form.abbreviation.trim(),
        });
        onSuccess(t("units.createSuccess"));
      }
      setDrawerOpen(false);
      await onMutated();
    } catch (err) {
      const code = parseApiError(err);
      if (code === "UNIT_NAME_EXISTS") {
        setNameError(t("units.nameExists"));
      } else if (code === "UNIT_ABBREVIATION_EXISTS") {
        setAbbreviationError(t("units.abbreviationExists"));
      } else if (code === "CANNOT_DEACTIVATE_DEFAULT") {
        setFormError(t("units.cannotDeactivateDefault"));
      } else {
        setFormError(t("units.saveError"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return {
    drawerOpen,
    editingId,
    editingUnit,
    form,
    submitting,
    detailLoading,
    formError,
    nameError,
    abbreviationError,
    openCreateDrawer,
    openEditDrawer,
    closeDrawer,
    onFormChange,
    handleSave,
  };
}
