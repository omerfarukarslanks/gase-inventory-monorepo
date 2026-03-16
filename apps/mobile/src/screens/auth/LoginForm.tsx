import { useRef } from "react";
import { TextInput } from "react-native";
import { TextField } from "@/src/components/ui";
import type { LoginFormState } from "./validators";

type LoginFormErrors = { email: string; password: string };

type LoginFormProps = {
  form: LoginFormState;
  errors: LoginFormErrors;
  onChange: (field: keyof LoginFormState, value: string) => void;
  onSubmit: () => void;
  onClearError: () => void;
};

export function LoginForm({ form, errors, onChange, onSubmit, onClearError }: LoginFormProps) {
  const passwordRef = useRef<TextInput>(null);

  return (
    <>
      <TextField
        label="E-posta"
        value={form.email}
        onChangeText={(value) => {
          onChange("email", value);
          onClearError();
        }}
        placeholder="ornek@firma.com"
        keyboardType="email-address"
        returnKeyType="next"
        autoCapitalize="none"
        textContentType="emailAddress"
        inputMode="email"
        helperText="Operator oturumu acmak icin kurum hesabini kullan."
        errorText={errors.email || undefined}
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
        placeholder="Sifrenizi girin"
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        autoCapitalize="none"
        textContentType="password"
        errorText={errors.password || undefined}
        inputRef={passwordRef}
      />
    </>
  );
}
