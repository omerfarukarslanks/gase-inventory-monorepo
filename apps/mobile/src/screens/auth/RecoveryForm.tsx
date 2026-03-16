import { useRef } from "react";
import { StyleSheet, Text, TextInput } from "react-native";
import { Button, Card, SectionTitle, TextField } from "@/src/components/ui";
import { mobileTheme } from "@/src/theme";
import type { RecoveryFormState } from "./validators";

type RecoveryMode = "request" | "reset";

type RecoveryFormErrors = {
  email: string;
  token: string;
  password: string;
  confirmPassword: string;
};

type RecoveryFormProps = {
  form: RecoveryFormState;
  errors: RecoveryFormErrors;
  recoveryMode: RecoveryMode;
  onChange: (field: keyof RecoveryFormState, value: string) => void;
  onSubmit: () => void;
  onSwitchToReset: () => void;
  onClearError: () => void;
};

export function RecoveryForm({
  form,
  errors,
  recoveryMode,
  onChange,
  onSubmit,
  onSwitchToReset,
  onClearError,
}: RecoveryFormProps) {
  const tokenRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  return (
    <>
      <TextField
        label="E-posta"
        value={form.email}
        onChangeText={(value) => {
          onChange("email", value);
          onClearError();
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
        inputMode="email"
        errorText={errors.email || undefined}
        returnKeyType={recoveryMode === "reset" ? "next" : "done"}
        onSubmitEditing={() => {
          if (recoveryMode === "reset") {
            tokenRef.current?.focus();
            return;
          }
          onSubmit();
        }}
        blurOnSubmit={false}
      />

      {recoveryMode === "reset" ? (
        <>
          <TextField
            label="Token"
            value={form.token}
            onChangeText={(value) => {
              onChange("token", value);
              onClearError();
            }}
            inputRef={tokenRef}
            autoCapitalize="none"
            errorText={errors.token || undefined}
            helperText="E-postadaki sifirlama tokenini buraya yapistir."
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
          />
          <TextField
            label="Yeni sifre"
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
            label="Yeni sifre tekrari"
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
      ) : (
        <Card>
          <SectionTitle title="Akis" />
          <Text style={styles.note}>
            E-posta adresine sifirlama tokeni gonderilir. Sonraki adimda token ile yeni sifreni
            belirleyebilirsin.
          </Text>
          <Button
            label="Token ile sifre belirle"
            onPress={onSwitchToReset}
            variant="secondary"
          />
        </Card>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  note: {
    marginTop: 12,
    marginBottom: 12,
    color: mobileTheme.colors.dark.text2,
    fontSize: 13,
    lineHeight: 19,
  },
});
