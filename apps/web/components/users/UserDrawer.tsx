"use client";

import Drawer, { DrawerFooter } from "@/components/ui/Drawer";
import FormField from "@/components/ui/FormField";
import InputField from "@/components/ui/InputField";
import PhoneInput from "@/components/ui/PhoneInput";
import ReadOnlyField from "@/components/ui/ReadOnlyField";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import SegmentedControl from "@/components/ui/SegmentedControl";
import TextareaField from "@/components/ui/TextareaField";
import { useLang } from "@/context/LangContext";
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
  const { t } = useLang();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={mode === "create" ? t("users.new") : t("users.update")}
      description={mode === "create" ? t("users.createDesc") : t("users.editDesc")}
      closeDisabled={saving}
      mobileFullscreen
      footer={
        <DrawerFooter
          cancelLabel={t("common.cancel")}
          onCancel={onClose}
          cancelDisabled={saving}
          onSave={onSave}
          saveLabel={t("common.save")}
          saveDisabled={saving}
          saving={saving}
        />
      }
    >
      <div className="space-y-4 p-5">
        <InputField
          label={t("users.name")}
          type="text"
          value={form.name}
          onChange={(value) => onFormChange("name", value)}
          error={errors.name}
        />

        <InputField
          label={t("users.surname")}
          type="text"
          value={form.surname}
          onChange={(value) => onFormChange("surname", value)}
          error={errors.surname}
        />

        <FormField label={`${t("users.role")} *`} error={errors.role}>
          <SearchableDropdown
            options={roleOptions}
            value={form.role}
            onChange={(role) => onFormChange("role", role)}
            placeholder={t("users.rolePlaceholder")}
            inputAriaLabel={t("users.roleSelectAria")}
            toggleAriaLabel={t("users.roleSelectToggleAria")}
            allowClear={false}
            showEmptyOption={false}
            error={errors.role}
          />
        </FormField>

        {mode === "create" ? (
          <>
            <InputField
              label={t("users.email")}
              type="email"
              value={form.email}
              onChange={(value) => onFormChange("email", value)}
              error={errors.email}
            />
            <InputField
              label={t("users.password")}
              type="password"
              value={form.password}
              onChange={(value) => onFormChange("password", value)}
              error={errors.password}
              autoComplete="new-password"
            />
          </>
        ) : (
          <ReadOnlyField label={t("users.emailReadonly")} value={selectedUser?.email} />
        )}

        {showStoreField && (
          <FormField
            label={t("users.store")}
            error={errors.storeId}
            helperText={storeOptions.length === 0 ? t("users.storeNotFound") : undefined}
          >
            <SearchableDropdown
              options={storeOptions}
              value={form.storeId}
              onChange={(storeId) => onFormChange("storeId", storeId)}
              placeholder={t("users.storePlaceholder")}
              emptyOptionLabel={t("users.storePlaceholder")}
              inputAriaLabel={t("users.storeSelectAria")}
              clearAriaLabel={t("users.storeSelectClearAria")}
              toggleAriaLabel={t("users.storeSelectToggleAria")}
              error={errors.storeId}
            />
          </FormField>
        )}

        <FormField label={t("users.gender")}>
          <SegmentedControl
            ariaLabel={t("users.genderSelectAria")}
            options={[
              { value: "MALE", label: t("users.genderMale") },
              { value: "FEMALE", label: t("users.genderFemale") },
              { value: "OTHER", label: t("users.genderOther") },
            ]}
            value={form.gender}
            onChange={(value) => onFormChange("gender", value as UserForm["gender"])}
          />
        </FormField>

        <FormField label={t("customers.colPhone")}>
          <PhoneInput
            countryCode={form.phoneCountry}
            localNumber={form.phone}
            onCountryChange={(code) => onFormChange("phoneCountry", code)}
            onNumberChange={(number) => onFormChange("phone", number)}
          />
        </FormField>

        <InputField
          label={t("users.birthDate")}
          type="date"
          value={form.birthDate}
          onChange={(value) => onFormChange("birthDate", value)}
        />

        <TextareaField
          label={t("users.address")}
          value={form.address}
          onChange={(value) => onFormChange("address", value)}
          placeholder={t("users.addressPlaceholder")}
          rows={3}
        />

        <div className="grid grid-cols-3 gap-3">
          <InputField
            label={t("users.country")}
            type="text"
            value={form.country}
            onChange={(value) => onFormChange("country", value)}
            placeholder={t("users.countryPlaceholder")}
          />
          <InputField
            label={t("users.city")}
            type="text"
            value={form.city}
            onChange={(value) => onFormChange("city", value)}
            placeholder={t("users.cityPlaceholder")}
          />
          <InputField
            label={t("users.district")}
            type="text"
            value={form.district}
            onChange={(value) => onFormChange("district", value)}
            placeholder={t("users.districtPlaceholder")}
          />
        </div>

        <InputField
          label={t("users.avatar")}
          type="text"
          value={form.avatar}
          onChange={(value) => onFormChange("avatar", value)}
          placeholder="https://..."
        />
      </div>
    </Drawer>
  );
}
