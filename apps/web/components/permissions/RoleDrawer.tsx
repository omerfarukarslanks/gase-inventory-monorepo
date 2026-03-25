"use client";

import Drawer, { DrawerFooter } from "@/components/ui/Drawer";
import FormField from "@/components/ui/FormField";
import InputField from "@/components/ui/InputField";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import type { Permission, RoleEntry } from "@/lib/permissions";

type RoleDrawerProps = {
  open: boolean;
  editingRole: RoleEntry | null;
  roleName: string;
  roleNameError: string;
  roleLevel?: number;
  levelOptions: Array<{ value: string; label: string }>;
  roleLoading: boolean;
  roleSubmitting: boolean;
  roleFormError: string;
  groupedPerms: Map<string, Permission[]>;
  selectedPermNames: Set<string>;
  onClose: () => void;
  onSave: () => void;
  onRoleNameChange: (value: string) => void;
  onRoleLevelChange: (value?: number) => void;
  onToggleRolePerm: (name: string, checked: boolean) => void;
};

export default function RoleDrawer({
  open,
  editingRole,
  roleName,
  roleNameError,
  roleLevel,
  levelOptions,
  roleLoading,
  roleSubmitting,
  roleFormError,
  groupedPerms,
  selectedPermNames,
  onClose,
  onSave,
  onRoleNameChange,
  onRoleLevelChange,
  onToggleRolePerm,
}: RoleDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={editingRole ? `${editingRole.role} — Yetkiler` : "Yeni Rol"}
      description={
        editingRole
          ? "Rol için aktif yetkileri seçin. Kaydet ile mevcut atama tamamen değiştirilir."
          : "Rol adını girin ve atanacak yetkileri seçin."
      }
      closeDisabled={roleSubmitting || roleLoading}
      mobileFullscreen
      footer={
        <DrawerFooter
          cancelLabel="İptal"
          onCancel={onClose}
          cancelDisabled={roleSubmitting || roleLoading}
          onSave={onSave}
          saveLabel="Kaydet"
          saveDisabled={roleSubmitting || roleLoading}
          saving={roleSubmitting}
        />
      }
    >
      <div className="space-y-5 p-5">
        <InputField
          label="Rol Adı *"
          type="text"
          value={roleName}
          onChange={onRoleNameChange}
          placeholder="KASIYER"
          error={roleNameError}
          disabled={roleSubmitting}
        />

        <FormField label="Seviye">
          <SearchableDropdown
            options={levelOptions}
            value={roleLevel != null ? String(roleLevel) : ""}
            onChange={(value) => onRoleLevelChange(value ? Number(value) : undefined)}
            placeholder="Seviye seçin"
            showEmptyOption
            allowClear
            inputAriaLabel="Rol seviyesi"
            toggleAriaLabel="Rol seviyesi listesini aç"
            disabled={roleSubmitting}
          />
        </FormField>

        {roleLoading ? (
          <p className="text-sm text-muted">Yükleniyor...</p>
        ) : groupedPerms.size === 0 && !roleFormError ? (
          <p className="text-sm text-muted">Yetki bulunamadı.</p>
        ) : (
          [...groupedPerms.entries()].map(([group, perms]) => (
            <div key={group} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{group}</p>
              <div className="space-y-1">
                {perms.map((permission) => (
                  <label
                    key={permission.name}
                    className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface2/60"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                      checked={selectedPermNames.has(permission.name)}
                      onChange={(event) => onToggleRolePerm(permission.name, event.target.checked)}
                      disabled={roleSubmitting}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-semibold text-text">{permission.name}</p>
                      <p className="text-xs text-muted">{permission.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))
        )}

        {roleFormError ? <p className="text-sm text-error">{roleFormError}</p> : null}
      </div>
    </Drawer>
  );
}
