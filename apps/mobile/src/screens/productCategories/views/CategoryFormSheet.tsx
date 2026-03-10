import { type TextInput } from "react-native";
import {
  Banner,
  Button,
  Card,
  ModalSheet,
  SearchBar,
  SectionTitle,
  SelectionList,
  TextField,
} from "@/src/components/ui";
import { StyleSheet, Text } from "react-native";
import { mobileTheme } from "@/src/theme";
import { rootCategoryValue, type CategoryForm } from "../hooks/useCategoryForm";

type CategoryFormSheetProps = {
  visible: boolean;
  form: CategoryForm;
  formError: string;
  nameError: string;
  slugError: string;
  parentError: string;
  parentSearch: string;
  parentSelectionItems: { label: string; value: string; description?: string }[];
  selectedParentLabel: string;
  editingCategoryId: string | null;
  editingCategoryIsActive: boolean;
  submitting: boolean;
  canUpdate: boolean;
  slugRef: { current: TextInput | null };
  descriptionRef: { current: TextInput | null };
  onClose: () => void;
  onSubmit: () => void;
  onToggleActive: () => void;
  onParentSearchChange: (value: string) => void;
  onParentSelect: (value: string) => void;
  onChange: (field: keyof CategoryForm, value: string) => void;
};

export function CategoryFormSheet({
  visible,
  form,
  formError,
  nameError,
  slugError,
  parentError,
  parentSearch,
  parentSelectionItems,
  selectedParentLabel,
  editingCategoryId,
  editingCategoryIsActive,
  submitting,
  canUpdate,
  slugRef,
  descriptionRef,
  onClose,
  onSubmit,
  onToggleActive,
  onParentSearchChange,
  onParentSelect,
  onChange,
}: CategoryFormSheetProps) {
  return (
    <ModalSheet
      visible={visible}
      title={editingCategoryId ? "Kategoriyi duzenle" : "Yeni kategori"}
      subtitle="Hiyerarsi ve slug bilgisini guncelle"
      onClose={onClose}
    >
      {formError ? <Banner text={formError} /> : null}
      <TextField
        label="Kategori adi"
        value={form.name}
        onChangeText={(value) => onChange("name", value)}
        errorText={nameError || undefined}
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
        errorText={slugError || undefined}
        helperText="Kucuk harf, rakam ve tire kullan."
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
        helperText="Opsiyonel. Operasyon ve raporlama notlari icin faydalidir."
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />

      <Card>
        <SectionTitle title="Ust kategori" />
        <Text style={styles.parentValue}>{selectedParentLabel}</Text>
        <Text style={[styles.parentHelper, parentError ? styles.parentHelperError : null]}>
          {parentError || "Opsiyonel. Bu kaydi mevcut bir kategori altina baglayabilirsin."}
        </Text>
        <SearchBar
          value={parentSearch}
          onChangeText={onParentSearchChange}
          placeholder="Ust kategori ara"
          hint="Kok kategori seciliyse kayit ust seviye olarak kalir."
        />
        <SelectionList
          items={parentSelectionItems}
          selectedValue={form.parentId || rootCategoryValue}
          onSelect={onParentSelect}
          emptyText="Eslesen kategori yok."
        />
      </Card>

      {editingCategoryId && canUpdate ? (
        <Button
          label={editingCategoryIsActive ? "Kaydi pasif yap" : "Kaydi aktif yap"}
          onPress={onToggleActive}
          variant={editingCategoryIsActive ? "ghost" : "secondary"}
        />
      ) : null}
      <Button
        label={editingCategoryId ? "Degisiklikleri kaydet" : "Kategoriyi kaydet"}
        onPress={onSubmit}
        loading={submitting}
        disabled={Boolean(nameError || slugError || parentError || !form.name.trim() || !form.slug.trim())}
      />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  parentValue: {
    marginTop: 12,
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
  parentHelper: {
    marginTop: 6,
    marginBottom: 12,
    color: mobileTheme.colors.dark.text2,
    fontSize: 13,
    lineHeight: 18,
  },
  parentHelperError: {
    color: mobileTheme.colors.brand.error,
  },
});
