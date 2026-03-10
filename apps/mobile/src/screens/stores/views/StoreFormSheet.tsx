import { type Currency, type StoreType } from "@gase/core";
import { TextInput } from "react-native";
import {
  Banner,
  Button,
  Card,
  FilterTabs,
  ModalSheet,
  SectionTitle,
  TextField,
} from "@/src/components/ui";
import { mobileTheme } from "@/src/theme";
import { StyleSheet, Text } from "react-native";
import type { StoreForm } from "../hooks/useStoreForm";

const storeTypeOptions = [
  { label: "Perakende", value: "RETAIL" as const },
  { label: "Toptan", value: "WHOLESALE" as const },
];

const currencyOptions = [
  { label: "TRY", value: "TRY" as const },
  { label: "USD", value: "USD" as const },
  { label: "EUR", value: "EUR" as const },
];

type StoreFormSheetProps = {
  visible: boolean;
  form: StoreForm;
  formError: string;
  nameError: string;
  editingStoreId: string | null;
  editingStoreIsActive: boolean;
  submitting: boolean;
  canUpdate: boolean;
  codeRef: { current: TextInput | null };
  slugRef: { current: TextInput | null };
  addressRef: { current: TextInput | null };
  logoRef: { current: TextInput | null };
  descriptionRef: { current: TextInput | null };
  onClose: () => void;
  onSubmit: () => void;
  onToggleActive: () => void;
  onChange: (field: keyof StoreForm, value: StoreForm[keyof StoreForm]) => void;
};

export function StoreFormSheet({
  visible,
  form,
  formError,
  nameError,
  editingStoreId,
  editingStoreIsActive,
  submitting,
  canUpdate,
  codeRef,
  slugRef,
  addressRef,
  logoRef,
  descriptionRef,
  onClose,
  onSubmit,
  onToggleActive,
  onChange,
}: StoreFormSheetProps) {
  return (
    <ModalSheet
      visible={visible}
      title={editingStoreId ? "Magazayi duzenle" : "Yeni magaza"}
      subtitle="Scope ve operasyon detaylarini guncelle"
      onClose={onClose}
    >
      {formError ? <Banner text={formError} /> : null}
      {!editingStoreId ? (
        <>
          <SectionTitle title="Magaza tipi" />
          <FilterTabs
            value={form.storeType}
            options={storeTypeOptions}
            onChange={(value) => onChange("storeType", value)}
          />
          <SectionTitle title="Para birimi" />
          <FilterTabs
            value={form.currency}
            options={currencyOptions}
            onChange={(value) => onChange("currency", value)}
          />
        </>
      ) : (
        <Card>
          <SectionTitle title="Sabit alanlar" />
          <Text style={styles.mutedText}>
            Magaza tipi ve para birimi bu surumde sadece olustururken belirlenir.
          </Text>
        </Card>
      )}
      <TextField
        label="Magaza adi"
        value={form.name}
        onChangeText={(value) => onChange("name", value)}
        errorText={nameError || undefined}
        returnKeyType="next"
        onSubmitEditing={() => codeRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Kod"
        value={form.code}
        onChangeText={(value) => onChange("code", value)}
        inputRef={codeRef}
        helperText="Opsiyonel. Stok ve satis operasyonlarinda hiz kazandirir."
        returnKeyType="next"
        onSubmitEditing={() => slugRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Slug"
        value={form.slug}
        onChangeText={(value) => onChange("slug", value)}
        inputRef={slugRef}
        autoCapitalize="none"
        returnKeyType="next"
        onSubmitEditing={() => addressRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Adres"
        value={form.address}
        onChangeText={(value) => onChange("address", value)}
        inputRef={addressRef}
        multiline
        returnKeyType="next"
        onSubmitEditing={() => logoRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Logo URL"
        value={form.logo}
        onChangeText={(value) => onChange("logo", value)}
        inputRef={logoRef}
        autoCapitalize="none"
        inputMode="url"
        returnKeyType="next"
        onSubmitEditing={() => descriptionRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Aciklama"
        value={form.description}
        onChangeText={(value) => onChange("description", value)}
        inputRef={descriptionRef}
        multiline
        helperText="Opsiyonel. Operasyon notlari veya magaza baglami burada tutulabilir."
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
      {editingStoreId && canUpdate ? (
        <Button
          label={editingStoreIsActive ? "Kaydi pasif yap" : "Kaydi aktif yap"}
          onPress={onToggleActive}
          variant={editingStoreIsActive ? "ghost" : "secondary"}
        />
      ) : null}
      <Button
        label={editingStoreId ? "Degisiklikleri kaydet" : "Magazayi kaydet"}
        onPress={onSubmit}
        loading={submitting}
        disabled={Boolean(nameError || !form.name.trim())}
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
});
