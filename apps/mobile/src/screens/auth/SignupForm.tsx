import { useRef } from "react";
import { TextInput } from "react-native";
import { TextField } from "@/src/components/ui";
import type { SignupFormState } from "./validators";

type SignupFormErrors = {
  tenantName: string;
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type SignupFormProps = {
  form: SignupFormState;
  errors: SignupFormErrors;
  onChange: (field: keyof SignupFormState, value: string) => void;
  onSubmit: () => void;
  onClearError: () => void;
};

export function SignupForm({ form, errors, onChange, onSubmit, onClearError }: SignupFormProps) {
  const nameRef = useRef<TextInput>(null);
  const surnameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  return (
    <>
      <TextField
        label="Sirket adi"
        value={form.tenantName}
        onChangeText={(value) => {
          onChange("tenantName", value);
          onClearError();
        }}
        errorText={errors.tenantName || undefined}
        returnKeyType="next"
        onSubmitEditing={() => nameRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Ad"
        value={form.name}
        onChangeText={(value) => {
          onChange("name", value);
          onClearError();
        }}
        inputRef={nameRef}
        errorText={errors.name || undefined}
        returnKeyType="next"
        onSubmitEditing={() => surnameRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Soyad"
        value={form.surname}
        onChangeText={(value) => {
          onChange("surname", value);
          onClearError();
        }}
        inputRef={surnameRef}
        errorText={errors.surname || undefined}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="E-posta"
        value={form.email}
        onChangeText={(value) => {
          onChange("email", value);
          onClearError();
        }}
        inputRef={emailRef}
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
        inputMode="email"
        errorText={errors.email || undefined}
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Sifre"
        value={form.password}
        onChangeText={(value) => {
          onChange("password", value);
          onClearError();
        }}
        inputRef={passwordRef}
        secureTextEntry
        textContentType="newPassword"
        helperText="En az 8 karakter, buyuk-kucuk harf ve rakam kullan."
        errorText={errors.password || undefined}
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Sifre tekrari"
        value={form.confirmPassword}
        onChangeText={(value) => {
          onChange("confirmPassword", value);
          onClearError();
        }}
        inputRef={confirmRef}
        secureTextEntry
        textContentType="password"
        errorText={errors.confirmPassword || undefined}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
    </>
  );
}
