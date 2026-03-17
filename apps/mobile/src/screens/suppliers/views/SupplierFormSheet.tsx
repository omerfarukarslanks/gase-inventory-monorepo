import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import {
  Banner,
  Button,
  ModalSheet,
  TextField,
} from "@/src/components/ui";
import { mobileTheme } from "@/src/theme";
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
  taxIdRef?: { current: TextInput | null };
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
  taxIdRef,
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
        returnKeyType="next"
        onSubmitEditing={() => taxIdRef?.current?.focus()}
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
          }}
          inputRef={taxIdRef}
          keyboardType="numeric"
          placeholder={form.taxIdType === "tckn" ? "11 haneli TCKN (opsiyonel)" : "10 haneli Vergi No (opsiyonel)"}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />
      </View>

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
    color: mobileTheme.colors.dark.text2,
  },
  taxIdToggle: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: mobileTheme.colors.dark.border,
    overflow: "hidden",
  },
  taxIdBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  taxIdBtnActive: {
    backgroundColor: mobileTheme.colors.brand.primary,
  },
  taxIdBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: mobileTheme.colors.dark.text2,
  },
  taxIdBtnTextActive: {
    color: "#FFFFFF",
  },
});
