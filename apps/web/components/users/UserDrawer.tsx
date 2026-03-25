"use client";

import Drawer, { DrawerFooter } from "@/components/ui/Drawer";
import FormField from "@/components/ui/FormField";
import InputField from "@/components/ui/InputField";
import PhoneInput from "@/components/ui/PhoneInput";
import ReadOnlyField from "@/components/ui/ReadOnlyField";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import SegmentedControl from "@/components/ui/SegmentedControl";
import TextareaField from "@/components/ui/TextareaField";
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

        <FormField label="Rol *" error={errors.role}>
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
        </FormField>

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
              autoComplete="new-password"
            />
          </>
        ) : (
          <ReadOnlyField label="Email (Değiştirilemez)" value={selectedUser?.email} />
        )}

        {showStoreField && (
          <FormField
            label="Mağaza"
            error={errors.storeId}
            helperText={storeOptions.length === 0 ? "Mağaza bulunamadı." : undefined}
          >
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
          </FormField>
        )}

        <FormField label="Cinsiyet">
          <SegmentedControl
            ariaLabel="Cinsiyet seçimi"
            options={[
              { value: "MALE", label: "Erkek" },
              { value: "FEMALE", label: "Kadın" },
              { value: "OTHER", label: "Diğer" },
            ]}
            value={form.gender}
            onChange={(value) => onFormChange("gender", value as UserForm["gender"])}
          />
        </FormField>

        <FormField label="Telefon">
          <PhoneInput
            countryCode={form.phoneCountry}
            localNumber={form.phone}
            onCountryChange={(code) => onFormChange("phoneCountry", code)}
            onNumberChange={(number) => onFormChange("phone", number)}
          />
        </FormField>

        <InputField
          label="Doğum Tarihi"
          type="date"
          value={form.birthDate}
          onChange={(value) => onFormChange("birthDate", value)}
        />

        <TextareaField
          label="Adres"
          value={form.address}
          onChange={(value) => onFormChange("address", value)}
          placeholder="Adres bilgisi"
          rows={3}
        />

        <div className="grid grid-cols-3 gap-3">
          <InputField
            label="Ülke"
            type="text"
            value={form.country}
            onChange={(value) => onFormChange("country", value)}
            placeholder="Türkiye"
          />
          <InputField
            label="İl"
            type="text"
            value={form.city}
            onChange={(value) => onFormChange("city", value)}
            placeholder="İstanbul"
          />
          <InputField
            label="İlçe"
            type="text"
            value={form.district}
            onChange={(value) => onFormChange("district", value)}
            placeholder="Kadıköy"
          />
        </div>

        <InputField
          label="Avatar URL"
          type="text"
          value={form.avatar}
          onChange={(value) => onFormChange("avatar", value)}
          placeholder="https://..."
        />
      </div>
    </Drawer>
  );
}
