import { type TextInput } from "react-native";
import { StyleSheet, Text, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  ModalSheet,
  SectionTitle,
  TextField,
} from "@/src/components/ui";
import { mobileTheme } from "@/src/theme";
import { type EditableValue } from "../hooks/useAttributeForm";

type AttributeFormSheetProps = {
  visible: boolean;
  formName: string;
  formError: string;
  nameError: string;
  editingAttributeId: string | null;
  editingAttributeIsActive: boolean;
  canUpdate: boolean;
  submitting: boolean;
  nameRef: { current: TextInput | null };
  onClose: () => void;
  onSubmit: () => void;
  onToggleActive: () => void;
  onChangeName: (value: string) => void;
};

export function AttributeFormSheet({
  visible,
  formName,
  formError,
  nameError,
  editingAttributeId,
  editingAttributeIsActive,
  canUpdate,
  submitting,
  nameRef,
  onClose,
  onSubmit,
  onToggleActive,
  onChangeName,
}: AttributeFormSheetProps) {
  return (
    <ModalSheet
      visible={visible}
      title={editingAttributeId ? "Ozelligi duzenle" : "Yeni ozellik"}
      subtitle="Varyant taniminda kullanilacak kaydi guncelle"
      onClose={onClose}
    >
      {formError ? <Banner text={formError} /> : null}
      <TextField
        label="Ozellik adi"
        value={formName}
        onChangeText={onChangeName}
        inputRef={nameRef}
        errorText={nameError || undefined}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
      {editingAttributeId && canUpdate ? (
        <Button
          label={editingAttributeIsActive ? "Kaydi pasif yap" : "Kaydi aktif yap"}
          onPress={onToggleActive}
          variant={editingAttributeIsActive ? "ghost" : "secondary"}
        />
      ) : null}
      <Button
        label={editingAttributeId ? "Degisiklikleri kaydet" : "Ozelligi kaydet"}
        onPress={onSubmit}
        loading={submitting}
        disabled={Boolean(nameError || !formName.trim())}
      />
    </ModalSheet>
  );
}

type AttributeValuesSheetProps = {
  visible: boolean;
  values: EditableValue[];
  newValuesInput: string;
  formError: string;
  submitting: boolean;
  valuesRef: { current: TextInput | null };
  onClose: () => void;
  onSave: () => void;
  onNewValuesChange: (value: string) => void;
  onUpdateValue: (id: string, nextName: string) => void;
};

export function AttributeValuesSheet({
  visible,
  values,
  newValuesInput,
  formError,
  submitting,
  valuesRef,
  onClose,
  onSave,
  onNewValuesChange,
  onUpdateValue,
}: AttributeValuesSheetProps) {
  return (
    <ModalSheet
      visible={visible}
      title="Degerleri yonet"
      subtitle="Mevcut degerleri duzenle, yenilerini virgulle ekle"
      onClose={onClose}
    >
      {formError ? <Banner text={formError} /> : null}
      <Card>
        <SectionTitle title="Mevcut degerler" />
        <View style={styles.editorValueList}>
          {values.length ? (
            values.map((value, index) => (
              <TextField
                key={value.id}
                label={`Deger ${index + 1}`}
                value={value.name}
                onChangeText={(nextValue) => onUpdateValue(value.id, nextValue)}
                helperText={value.isActive ? "Aktif deger" : "Pasif deger"}
              />
            ))
          ) : (
            <Text style={styles.mutedText}>Henuz kayitli deger yok.</Text>
          )}
        </View>
      </Card>

      <TextField
        label="Yeni degerler"
        value={newValuesInput}
        onChangeText={onNewValuesChange}
        inputRef={valuesRef}
        multiline
        helperText="Ornek: S, M, L veya 36, 38, 40"
        returnKeyType="done"
        onSubmitEditing={onSave}
      />

      <Button label="Degerleri kaydet" onPress={onSave} loading={submitting} />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  editorValueList: {
    marginTop: 12,
    gap: 12,
  },
  mutedText: {
    marginTop: 12,
    color: mobileTheme.colors.dark.text2,
    fontSize: 13,
    lineHeight: 19,
  },
});
