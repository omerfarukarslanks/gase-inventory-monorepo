import {
  Banner,
  Button,
  ModalSheet,
  TextField,
} from "@/src/components/ui";
import { StyleSheet, Switch, Text, View } from "react-native";
import { mobileTheme } from "@/src/theme";
import type { UnitForm } from "../hooks/useUnitForm";

type UnitFormSheetProps = {
  visible: boolean;
  form: UnitForm;
  formError: string;
  nameError: string;
  abbreviationError: string;
  editingUnitId: string | null;
  editingUnitIsDefault: boolean;
  editingUnitIsActive: boolean;
  submitting: boolean;
  canUpdate: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onToggleActive: (value: boolean) => void;
  onChange: (field: keyof UnitForm, value: string) => void;
};

export function UnitFormSheet({
  visible,
  form,
  formError,
  nameError,
  abbreviationError,
  editingUnitId,
  editingUnitIsDefault,
  editingUnitIsActive,
  submitting,
  canUpdate,
  onClose,
  onSubmit,
  onToggleActive,
  onChange,
}: UnitFormSheetProps) {
  const colors = mobileTheme.colors.dark;

  return (
    <ModalSheet
      visible={visible}
      title={editingUnitId ? "Birimi duzenle" : "Yeni birim"}
      subtitle="Ad ve kisaltma bilgisini gir"
      onClose={onClose}
    >
      {formError ? <Banner text={formError} /> : null}
      <TextField
        label="Birim adi"
        value={form.name}
        onChangeText={(value) => onChange("name", value)}
        errorText={nameError || undefined}
        returnKeyType="next"
        blurOnSubmit={false}
      />
      <TextField
        label="Kisaltma"
        value={form.abbreviation}
        onChangeText={(value) => onChange("abbreviation", value)}
        errorText={abbreviationError || undefined}
        autoCapitalize="characters"
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        helperText="Ornegin: kg, lt, adet"
      />

      {editingUnitId && canUpdate ? (
        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Durum</Text>
            <Text style={[styles.toggleHint, { color: colors.text2 }]}>
              {editingUnitIsDefault
                ? "Varsayilan birim pasife alinamaz"
                : editingUnitIsActive
                  ? "Simdi aktif"
                  : "Simdi pasif"}
            </Text>
          </View>
          <Switch
            value={editingUnitIsActive}
            onValueChange={onToggleActive}
            disabled={editingUnitIsDefault}
            trackColor={{
              false: mobileTheme.colors.dark.border,
              true: mobileTheme.colors.brand.primary,
            }}
          />
        </View>
      ) : null}

      <Button
        label={editingUnitId ? "Degisiklikleri kaydet" : "Birimi kaydet"}
        onPress={onSubmit}
        loading={submitting}
        disabled={Boolean(nameError || abbreviationError || !form.name.trim() || !form.abbreviation.trim())}
      />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    gap: 12,
  },
  toggleCopy: {
    flex: 1,
    gap: 2,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  toggleHint: {
    fontSize: 12,
  },
});
