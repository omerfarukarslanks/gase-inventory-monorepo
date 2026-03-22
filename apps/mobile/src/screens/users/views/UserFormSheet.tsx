import { TextInput } from "react-native";
import { StyleSheet, Text } from "react-native";
import {
  Banner,
  Button,
  Card,
  FilterTabs,
  ModalSheet,
  SectionTitle,
  SelectionList,
  TextField,
} from "@/src/components/ui";
import { mobileTheme } from "@/src/theme";
import type { UserForm, UserFormErrors, UserRole } from "../hooks/useUserForm";
import { noStoreValue } from "../hooks/useUserForm";

type UserFormSheetProps = {
  visible: boolean;
  form: UserForm;
  formErrors: UserFormErrors;
  formError: string;
  roleOptions: { label: string; value: string }[];
  storeSelectionItems: { label: string; value: string; description?: string }[];
  selectedStoreLabel: string;
  editingUserId: string | null;
  editingUserIsActive: boolean;
  canUpdate: boolean;
  submitting: boolean;
  surnameRef: { current: TextInput | null };
  emailRef: { current: TextInput | null };
  passwordRef: { current: TextInput | null };
  onClose: () => void;
  onSubmit: () => void;
  onToggleActive: () => void;
  onChange: (field: keyof UserForm, value: UserForm[keyof UserForm]) => void;
};

export function UserFormSheet({
  visible,
  form,
  formErrors,
  formError,
  roleOptions,
  storeSelectionItems,
  selectedStoreLabel,
  editingUserId,
  editingUserIsActive,
  canUpdate,
  submitting,
  surnameRef,
  emailRef,
  passwordRef,
  onClose,
  onSubmit,
  onToggleActive,
  onChange,
}: UserFormSheetProps) {
  return (
    <ModalSheet
      visible={visible}
      title={editingUserId ? "Kullaniciyi duzenle" : "Yeni kullanici"}
      subtitle="Rol, magaza ve temel kimlik bilgisini guncelle"
      onClose={onClose}
    >
      {formError ? <Banner text={formError} /> : null}
      <TextField
        label="Ad"
        value={form.name}
        onChangeText={(value) => onChange("name", value)}
        errorText={formErrors.name || undefined}
        returnKeyType="next"
        onSubmitEditing={() => surnameRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Soyad"
        value={form.surname}
        onChangeText={(value) => onChange("surname", value)}
        inputRef={surnameRef}
        errorText={formErrors.surname || undefined}
        returnKeyType={editingUserId ? "done" : "next"}
        onSubmitEditing={() => {
          if (editingUserId) {
            onSubmit();
            return;
          }
          emailRef.current?.focus();
        }}
        blurOnSubmit={false}
      />
      <SectionTitle title="Rol" />
      <FilterTabs
        value={form.role}
        options={roleOptions}
        onChange={(value) => onChange("role", value as UserRole)}
      />
      {formErrors.role ? <Text style={styles.errorText}>{formErrors.role}</Text> : null}
      {!editingUserId ? (
        <>
          <TextField
            label="E-posta"
            value={form.email}
            onChangeText={(value) => onChange("email", value)}
            inputRef={emailRef}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoCapitalize="none"
            inputMode="email"
            errorText={formErrors.email || undefined}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
          />
          <TextField
            label="Sifre"
            value={form.password}
            onChangeText={(value) => onChange("password", value)}
            inputRef={passwordRef}
            secureTextEntry
            textContentType="newPassword"
            errorText={formErrors.password || undefined}
            helperText="En az 8 karakter, buyuk-kucuk harf ve rakam kullan."
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />
        </>
      ) : (
        <Card>
          <SectionTitle title="Kimlik bilgisi" />
          <Text style={styles.mutedText}>
            Bu surumde e-posta ve sifre sadece kullanici olustururken belirlenir.
          </Text>
        </Card>
      )}
      <Card>
        <SectionTitle title="Magaza atamasi" />
        <Text style={styles.assignmentSummary}>{selectedStoreLabel}</Text>
        <SelectionList
          items={storeSelectionItems}
          selectedValue={form.storeId || noStoreValue}
          onSelect={(value) => onChange("storeId", value === noStoreValue ? "" : value)}
          emptyText="Magaza bulunamadi."
        />
        {formErrors.storeId ? <Text style={styles.errorText}>{formErrors.storeId}</Text> : null}
      </Card>
      {editingUserId && canUpdate ? (
        <Button
          label={editingUserIsActive ? "Kaydi pasif yap" : "Kaydi aktif yap"}
          onPress={onToggleActive}
          variant={editingUserIsActive ? "ghost" : "secondary"}
        />
      ) : null}
      <Button
        label={editingUserId ? "Degisiklikleri kaydet" : "Kullaniciyi kaydet"}
        onPress={onSubmit}
        loading={submitting}
        disabled={Boolean(
          formErrors.name ||
            formErrors.surname ||
            formErrors.email ||
            formErrors.password ||
            formErrors.role ||
            formErrors.storeId ||
            !form.name.trim() ||
            !form.surname.trim() ||
            (!editingUserId && (!form.email.trim() || !form.password)),
        )}
      />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    marginTop: 12,
    color: mobileTheme.colors.dark.text2,
    fontSize: 13,
    lineHeight: 19,
  },
  assignmentSummary: {
    marginTop: 12,
    marginBottom: 12,
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
  errorText: {
    marginTop: 4,
    color: mobileTheme.colors.status.error,
    fontSize: 12,
  },
});
