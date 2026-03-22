"use client";

import Drawer, { DrawerFooter } from "@/components/ui/Drawer";
import InputField from "@/components/ui/InputField";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import type { User } from "@/lib/users";
import type { UserForm, UserFormErrors } from "@/components/users/types";

type UserDrawerProps = {
  open: boolean;
  mode: "edit" | "create";
  selectedUser: User | null;
  saving: boolean;
  form: UserForm;
  errors: UserFormErrors;
  roleOptions: Array<{ value: string; label: string }>;
  storeOptions: Array<{ value: string; label: string }>;
  showStoreField: boolean;
  onClose: () => void;
  onSave: () => void;
  onFormChange: <K extends keyof UserForm>(field: K, value: UserForm[K]) => void;
};

export default function UserDrawer({
  open,
  mode,
  selectedUser,
  saving,
  form,
  errors,
  roleOptions,
  storeOptions,
  showStoreField,
  onClose,
  onSave,
  onFormChange,
}: UserDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={mode === "create" ? "Yeni Kullanıcı" : "Kullanıcı Düzenle"}
      description={mode === "create" ? "Yeni bir kullanıcı hesabı oluşturun." : "Kullanıcı bilgilerini güncelleyin."}
      closeDisabled={saving}
      mobileFullscreen
      footer={
        <DrawerFooter
          cancelLabel="İptal"
          onCancel={onClose}
          cancelDisabled={saving}
          onSave={onSave}
          saveLabel="Kaydet"
          saveDisabled={saving}
          saving={saving}
        />
      }
    >
      <div className="space-y-4 p-5">
        <InputField
          label="Ad *"
          type="text"
          value={form.name}
          onChange={(value) => onFormChange("name", value)}
          error={errors.name}
        />

        <InputField
          label="Soyad *"
          type="text"
          value={form.surname}
          onChange={(value) => onFormChange("surname", value)}
          error={errors.surname}
        />

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted">Rol *</label>
          <SearchableDropdown
            options={roleOptions}
            value={form.role}
            onChange={(role) => onFormChange("role", role)}
            placeholder="Rol seçin"
            inputAriaLabel="Rol seçimi"
            toggleAriaLabel="Rol listesini aç"
            allowClear={false}
            showEmptyOption={false}
            error={errors.role}
          />
          {errors.role && <p className="px-1 text-xs text-error">{errors.role}</p>}
        </div>

        {mode === "create" ? (
          <>
            <InputField
              label="E-Posta *"
              type="email"
              value={form.email}
              onChange={(value) => onFormChange("email", value)}
              error={errors.email}
            />
            <InputField
              label="Şifre"
              type="password"
              value={form.password}
              onChange={(value) => onFormChange("password", value)}
              error={errors.password}
            />
          </>
        ) : (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Email (Değiştirilemez)</label>
            <div className="w-full rounded-xl2 border border-border bg-surface2 px-4 py-2.5 text-sm text-text2">
              {selectedUser?.email}
            </div>
          </div>
        )}

        {showStoreField && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Mağaza *</label>
            <SearchableDropdown
              options={storeOptions}
              value={form.storeId}
              onChange={(storeId) => onFormChange("storeId", storeId)}
              placeholder="Mağaza seçin"
              emptyOptionLabel="Mağaza seçin"
              inputAriaLabel="Mağaza seçimi"
              clearAriaLabel="Mağaza seçimini temizle"
              toggleAriaLabel="Mağaza listesini aç"
              error={errors.storeId}
            />
            {errors.storeId && <p className="px-1 text-xs text-error">{errors.storeId}</p>}
            {storeOptions.length === 0 && <div className="px-1 text-xs text-muted">Mağaza bulunamadı.</div>}
          </div>
        )}
      </div>
    </Drawer>
  );
}
