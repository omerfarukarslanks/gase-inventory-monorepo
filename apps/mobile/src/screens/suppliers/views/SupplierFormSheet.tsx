import { TextInput } from "react-native";
import {
  Banner,
  Button,
  ModalSheet,
  TextField,
} from "@/src/components/ui";
import type { SupplierForm } from "../hooks/useSupplierForm";

type SupplierFormSheetProps = {
  visible: boolean;
  form: SupplierForm;
  formError: string;
  nameError: string;
  phoneError: string;
  emailError: string;
  editingSupplierId: string | null;
  editingSupplierIsActive: boolean;
  submitting: boolean;
  canUpdate: boolean;
  surnameRef: { current: TextInput | null };
  phoneRef: { current: TextInput | null };
  emailRef: { current: TextInput | null };
  addressRef: { current: TextInput | null };
  onClose: () => void;
  onSubmit: () => void;
  onToggleActive: () => void;
  onChange: (field: keyof SupplierForm, value: string) => void;
};

export function SupplierFormSheet({
  visible,
  form,
  formError,
  nameError,
  phoneError,
  emailError,
  editingSupplierId,
  editingSupplierIsActive,
  submitting,
  canUpdate,
  surnameRef,
  phoneRef,
  emailRef,
  addressRef,
  onClose,
  onSubmit,
  onToggleActive,
  onChange,
}: SupplierFormSheetProps) {
  return (
    <ModalSheet
      visible={visible}
      title={editingSupplierId ? "Tedarikciyi duzenle" : "Yeni tedarikci"}
      subtitle="Stok alimlerinde kullanilacak kaydi guncelle"
      onClose={onClose}
    >
      {formError ? <Banner text={formError} /> : null}
      <TextField
        label="Isim"
        value={form.name}
        onChangeText={(value) => onChange("name", value)}
        errorText={nameError || undefined}
        returnKeyType="next"
        onSubmitEditing={() => surnameRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Soyisim"
        value={form.surname}
        onChangeText={(value) => onChange("surname", value)}
        inputRef={surnameRef}
        returnKeyType="next"
        onSubmitEditing={() => phoneRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Telefon"
        value={form.phoneNumber}
        onChangeText={(value) => onChange("phoneNumber", value)}
        keyboardType="phone-pad"
        inputMode="tel"
        errorText={phoneError || undefined}
        inputRef={phoneRef}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="E-posta"
        value={form.email}
        onChangeText={(value) => onChange("email", value)}
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
        inputMode="email"
        errorText={emailError || undefined}
        inputRef={emailRef}
        returnKeyType="next"
        onSubmitEditing={() => addressRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Adres"
        value={form.address}
        onChangeText={(value) => onChange("address", value)}
        multiline
        helperText="Opsiyonel. Teslimat ve operasyon notlari icin faydalidir."
        inputRef={addressRef}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
      {editingSupplierId && canUpdate ? (
        <Button
          label={editingSupplierIsActive ? "Kaydi pasif yap" : "Kaydi aktif yap"}
          onPress={onToggleActive}
          variant={editingSupplierIsActive ? "ghost" : "secondary"}
        />
      ) : null}
      <Button
        label={editingSupplierId ? "Degisiklikleri kaydet" : "Tedarikciyi kaydet"}
        onPress={onSubmit}
        loading={submitting}
        disabled={Boolean(nameError || phoneError || emailError || !form.name.trim())}
      />
    </ModalSheet>
  );
}
