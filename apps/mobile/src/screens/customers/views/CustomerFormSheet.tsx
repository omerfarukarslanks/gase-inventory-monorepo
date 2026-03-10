import type { RefObject } from "react";
import type { TextInput } from "react-native";
import {
  Banner,
  Button,
  ModalSheet,
  TextField,
} from "@/src/components/ui";

type CustomerForm = {
  name: string;
  surname: string;
  phoneNumber: string;
  email: string;
};

type CustomerFormSheetProps = {
  visible: boolean;
  onClose: () => void;
  form: CustomerForm;
  composerError: string;
  nameError: string;
  surnameError: string;
  phoneError: string;
  emailError: string;
  canSubmit: boolean;
  submitting: boolean;
  surnameRef: RefObject<TextInput | null>;
  phoneRef: RefObject<TextInput | null>;
  emailRef: RefObject<TextInput | null>;
  handleFieldChange: (field: keyof CustomerForm, value: string) => void;
  onCreateCustomer: () => Promise<void>;
};

export function CustomerFormSheet({
  visible,
  onClose,
  form,
  composerError,
  nameError,
  surnameError,
  phoneError,
  emailError,
  canSubmit,
  submitting,
  surnameRef,
  phoneRef,
  emailRef,
  handleFieldChange,
  onCreateCustomer,
}: CustomerFormSheetProps) {
  return (
    <ModalSheet
      visible={visible}
      title="Yeni musteri"
      subtitle="Saha operasyonu icin hizli kayit"
      onClose={onClose}
    >
      {composerError ? <Banner text={composerError} /> : null}
      <TextField
        label="Ad"
        value={form.name}
        onChangeText={(value) => handleFieldChange("name", value)}
        errorText={nameError || undefined}
        returnKeyType="next"
        onSubmitEditing={() => surnameRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Soyad"
        value={form.surname}
        onChangeText={(value) => handleFieldChange("surname", value)}
        errorText={surnameError || undefined}
        inputRef={surnameRef}
        returnKeyType="next"
        onSubmitEditing={() => phoneRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Telefon"
        value={form.phoneNumber}
        onChangeText={(value) => handleFieldChange("phoneNumber", value)}
        keyboardType="phone-pad"
        inputMode="tel"
        helperText="Opsiyonel. Tahsilat ve aramada hiz kazandirir."
        errorText={phoneError || undefined}
        inputRef={phoneRef}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="E-posta"
        value={form.email}
        onChangeText={(value) => handleFieldChange("email", value)}
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
        inputMode="email"
        helperText="Opsiyonel. Varsa musteri kaydini daha sonra bulmak kolaylasir."
        errorText={emailError || undefined}
        inputRef={emailRef}
        returnKeyType="done"
        onSubmitEditing={() => void onCreateCustomer()}
      />
      <Button
        label="Musteriyi kaydet"
        onPress={() => void onCreateCustomer()}
        loading={submitting}
        disabled={!canSubmit}
      />
    </ModalSheet>
  );
}
