import { useRef } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { TextField } from "@/src/components/ui";
import type { SignupFormState } from "./validators";

type SignupFormErrors = {
  tenantName: string;
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
  taxIdValue: string;
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
  const addressRef = useRef<TextInput>(null);
  const taxIdRef = useRef<TextInput>(null);
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
        onSubmitEditing={() => addressRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Adres"
        value={form.address}
        onChangeText={(value) => {
          onChange("address", value);
          onClearError();
        }}
        inputRef={addressRef}
        placeholder="Sirket adresi (opsiyonel)"
        returnKeyType="next"
        onSubmitEditing={() => taxIdRef.current?.focus()}
        blurOnSubmit={false}
      />

      {/* TaxId toggle field */}
      <View style={styles.taxIdContainer}>
        <View style={styles.taxIdHeader}>
          <Text style={styles.taxIdLabel}>Kimlik No</Text>
          <View style={styles.taxIdToggle}>
            <TouchableOpacity
              onPress={() => {
                onChange("taxIdType", "tckn");
                onChange("taxIdValue", "");
              }}
              style={[styles.taxIdBtn, form.taxIdType === "tckn" && styles.taxIdBtnActive]}
            >
              <Text style={[styles.taxIdBtnText, form.taxIdType === "tckn" && styles.taxIdBtnTextActive]}>
                TCKN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onChange("taxIdType", "taxNumber");
                onChange("taxIdValue", "");
              }}
              style={[styles.taxIdBtn, form.taxIdType === "taxNumber" && styles.taxIdBtnActive]}
            >
              <Text style={[styles.taxIdBtnText, form.taxIdType === "taxNumber" && styles.taxIdBtnTextActive]}>
                Vergi No
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <TextField
          label=""
          value={form.taxIdValue}
          onChangeText={(value) => {
            const digits = value.replace(/\D/g, "");
            const max = form.taxIdType === "tckn" ? 11 : 10;
            onChange("taxIdValue", digits.slice(0, max));
            onClearError();
          }}
          inputRef={taxIdRef}
          keyboardType="numeric"
          placeholder={form.taxIdType === "tckn" ? "11 haneli TCKN (opsiyonel)" : "10 haneli Vergi No (opsiyonel)"}
          errorText={errors.taxIdValue || undefined}
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          blurOnSubmit={false}
        />
      </View>

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

const styles = StyleSheet.create({
  taxIdContainer: {
    marginBottom: 4,
  },
  taxIdHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  taxIdLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  taxIdToggle: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  taxIdBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  taxIdBtnActive: {
    backgroundColor: "#6366F1",
  },
  taxIdBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
  },
  taxIdBtnTextActive: {
    color: "#FFFFFF",
  },
});
