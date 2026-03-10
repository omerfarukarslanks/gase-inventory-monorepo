import { createPermission, updatePermission, type Permission } from "@gase/core";
import { useCallback, useMemo, useState } from "react";
import { trackEvent } from "@/src/lib/analytics";

export type PermissionForm = {
  name: string;
  description: string;
  group: string;
  isActive: boolean;
};

const emptyPermissionForm: PermissionForm = {
  name: "",
  description: "",
  group: "",
  isActive: true,
};

type UsePermissionFormParams = {
  fetchPermissionsList: () => Promise<void>;
};

export function usePermissionForm({ fetchPermissionsList }: UsePermissionFormParams) {
  const [permissionEditorOpen, setPermissionEditorOpen] = useState(false);
  const [editingPermissionId, setEditingPermissionId] = useState<string | null>(null);
  const [permissionForm, setPermissionForm] = useState<PermissionForm>(emptyPermissionForm);
  const [permissionFormError, setPermissionFormError] = useState("");
  const [permissionSubmitting, setPermissionSubmitting] = useState(false);

  const permissionNameError = useMemo(() => {
    if (!permissionForm.name.trim()) return "Ad zorunlu.";
    return permissionForm.name.trim().length >= 2 ? "" : "Ad en az 2 karakter olmali.";
  }, [permissionForm.name]);

  const permissionDescriptionError = useMemo(() => {
    if (!permissionForm.description.trim()) return "Aciklama zorunlu.";
    return permissionForm.description.trim().length >= 4
      ? ""
      : "Aciklama en az 4 karakter olmali.";
  }, [permissionForm.description]);

  const permissionGroupError = useMemo(() => {
    if (!permissionForm.group.trim()) return "Grup zorunlu.";
    return permissionForm.group.trim().length >= 2 ? "" : "Grup en az 2 karakter olmali.";
  }, [permissionForm.group]);

  const resetPermissionEditor = useCallback(() => {
    setPermissionEditorOpen(false);
    setEditingPermissionId(null);
    setPermissionForm(emptyPermissionForm);
    setPermissionFormError("");
  }, []);

  const openCreatePermission = useCallback(() => {
    setPermissionEditorOpen(true);
    setEditingPermissionId(null);
    setPermissionForm(emptyPermissionForm);
    setPermissionFormError("");
  }, []);

  const openEditPermission = useCallback((permission: Permission) => {
    setPermissionEditorOpen(true);
    setEditingPermissionId(permission.id);
    setPermissionForm({
      name: permission.name,
      description: permission.description,
      group: permission.group,
      isActive: permission.isActive,
    });
    setPermissionFormError("");
  }, []);

  const handlePermissionFieldChange = useCallback(
    (field: keyof PermissionForm, value: PermissionForm[keyof PermissionForm]) => {
      setPermissionForm((current) => ({ ...current, [field]: value }));
      setPermissionFormError((current) => (current ? "" : current));
    },
    [],
  );

  const submitPermission = async () => {
    if (permissionNameError || permissionDescriptionError || permissionGroupError) {
      trackEvent("validation_error", { screen: "permissions", field: "permission_form" });
      setPermissionFormError("Alanlari duzeltip tekrar dene.");
      return;
    }

    setPermissionSubmitting(true);
    setPermissionFormError("");
    try {
      if (editingPermissionId) {
        await updatePermission(editingPermissionId, {
          description: permissionForm.description.trim(),
          group: permissionForm.group.trim(),
          isActive: permissionForm.isActive,
        });
      } else {
        await createPermission({
          name: permissionForm.name.trim(),
          description: permissionForm.description.trim(),
          group: permissionForm.group.trim(),
          isActive: permissionForm.isActive,
        });
      }

      resetPermissionEditor();
      await fetchPermissionsList();
    } catch (nextError) {
      setPermissionFormError(nextError instanceof Error ? nextError.message : "Kayit basarisiz oldu.");
    } finally {
      setPermissionSubmitting(false);
    }
  };

  return {
    permissionEditorOpen,
    editingPermissionId,
    permissionForm,
    permissionFormError,
    permissionSubmitting,
    permissionNameError,
    permissionDescriptionError,
    permissionGroupError,
    resetPermissionEditor,
    openCreatePermission,
    openEditPermission,
    handlePermissionFieldChange,
    submitPermission,
  };
}
