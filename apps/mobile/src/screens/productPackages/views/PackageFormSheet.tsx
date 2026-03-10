import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type Product, type ProductVariant } from "@gase/core";
import { StyleSheet, Text, TextInput, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  FilterTabs,
  InlineFieldError,
  ListRow,
  ModalSheet,
  SearchBar,
  SectionTitle,
  SkeletonBlock,
  TextField,
} from "@/src/components/ui";
import { mobileTheme } from "@/src/theme";
import { type PackageForm, type PackageItemRow } from "../hooks/usePackageForm";

type PackageFormSheetProps = {
  visible: boolean;
  loadingDetail: boolean;
  form: PackageForm;
  nameError: string;
  codeError: string;
  itemsError: string;
  formError: string;
  items: PackageItemRow[];
  itemErrors: Record<string, string>;
  editingId: string | null;
  editingIsActive: boolean;
  submitting: boolean;
  canUpdate: boolean;
  variantSearchTerm: string;
  variantSearchLoading: boolean;
  variantSearchProducts: Product[];
  selectedProductId: string;
  selectedProductLabel: string;
  variantsLoading: boolean;
  variantOptions: ProductVariant[];
  selectedVariantId: string;
  addItemQuantity: string;
  addItemError: string;
  codeRef: { current: TextInput | null };
  descriptionRef: { current: TextInput | null };
  onClose: () => void;
  onSubmit: () => void;
  onToggleActive: () => void;
  onFormChange: <K extends keyof PackageForm>(field: K, value: PackageForm[K]) => void;
  onSearchProducts: (value: string) => void;
  onSelectProduct: (product: Product) => void;
  onSelectVariant: (variantId: string) => void;
  onAddItemQuantityChange: (value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (rowId: string) => void;
  onChangeItemQuantity: (rowId: string, value: string) => void;
};

export function PackageFormSheet({
  visible,
  loadingDetail,
  form,
  nameError,
  codeError,
  itemsError,
  formError,
  items,
  itemErrors,
  editingId,
  editingIsActive,
  submitting,
  canUpdate,
  variantSearchTerm,
  variantSearchLoading,
  variantSearchProducts,
  selectedProductId,
  selectedProductLabel,
  variantsLoading,
  variantOptions,
  selectedVariantId,
  addItemQuantity,
  addItemError,
  codeRef,
  descriptionRef,
  onClose,
  onSubmit,
  onToggleActive,
  onFormChange,
  onSearchProducts,
  onSelectProduct,
  onSelectVariant,
  onAddItemQuantityChange,
  onAddItem,
  onRemoveItem,
  onChangeItemQuantity,
}: PackageFormSheetProps) {
  return (
    <ModalSheet
      visible={visible}
      title={editingId ? "Paketi duzenle" : "Yeni paket"}
      subtitle="Paket bilgilerini ve kalemlerini guncelle"
      onClose={onClose}
    >
      {loadingDetail ? (
        <View style={styles.loadingList}>
          <SkeletonBlock height={72} />
          <SkeletonBlock height={72} />
          <SkeletonBlock height={72} />
        </View>
      ) : (
        <>
          {formError ? <Banner text={formError} /> : null}
          <TextField
            label="Paket adi"
            value={form.name}
            onChangeText={(value) => onFormChange("name", value)}
            errorText={nameError || undefined}
            returnKeyType="next"
            onSubmitEditing={() => codeRef.current?.focus()}
            blurOnSubmit={false}
          />
          <TextField
            label="Paket kodu"
            value={form.code}
            onChangeText={(value) => onFormChange("code", value)}
            errorText={codeError || undefined}
            inputRef={codeRef}
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => descriptionRef.current?.focus()}
            blurOnSubmit={false}
          />
          <TextField
            label="Aciklama"
            value={form.description}
            onChangeText={(value) => onFormChange("description", value)}
            inputRef={descriptionRef}
            multiline
            helperText="Opsiyonel. Paket icindeki varyant setini aciklamak icin kullan."
          />

          <Card>
            <SectionTitle title="Varyant ekle" />
            <View style={styles.modalSection}>
              <SearchBar
                value={variantSearchTerm}
                onChangeText={onSearchProducts}
                placeholder="Urun ara"
                hint="Once urun sec, sonra ilgili varyanti pakete ekle."
              />
              {variantSearchLoading ? (
                <View style={styles.loadingList}>
                  <SkeletonBlock height={64} />
                  <SkeletonBlock height={64} />
                </View>
              ) : variantSearchTerm.trim() ? (
                variantSearchProducts.length ? (
                  <View style={styles.list}>
                    {variantSearchProducts.map((product) => (
                      <ListRow
                        key={product.id}
                        title={product.name}
                        subtitle={product.sku}
                        caption={
                          selectedProductId === product.id ? "Secili urun" : "Varyantlarini goster"
                        }
                        badgeLabel={selectedProductId === product.id ? "secili" : "urun"}
                        badgeTone={selectedProductId === product.id ? "info" : "neutral"}
                        onPress={() => onSelectProduct(product)}
                        icon={
                          <MaterialCommunityIcons
                            name="package-variant-closed"
                            size={20}
                            color={mobileTheme.colors.brand.primary}
                          />
                        }
                      />
                    ))}
                  </View>
                ) : (
                  <EmptyStateWithAction
                    title="Urun bulunamadi."
                    subtitle="Farkli bir arama ile tekrar dene."
                    actionLabel="Aramayi temizle"
                    onAction={() => onSearchProducts("")}
                  />
                )
              ) : null}

              {selectedProductId ? (
                <>
                  <Text style={styles.selectedHint}>Secili urun: {selectedProductLabel}</Text>
                  {variantsLoading ? (
                    <View style={styles.loadingList}>
                      <SkeletonBlock height={64} />
                      <SkeletonBlock height={64} />
                    </View>
                  ) : variantOptions.length ? (
                    <>
                      <FilterTabs
                        value={selectedVariantId || variantOptions[0]?.id || ""}
                        options={variantOptions.map((variant) => ({
                          label: variant.name,
                          value: variant.id,
                        }))}
                        onChange={onSelectVariant}
                      />
                      <TextField
                        label="Paket basina miktar"
                        value={addItemQuantity}
                        onChangeText={onAddItemQuantityChange}
                        keyboardType="numeric"
                        inputMode="numeric"
                        errorText={addItemError || undefined}
                      />
                      <Button label="Varyanti ekle" onPress={onAddItem} variant="secondary" />
                    </>
                  ) : (
                    <EmptyStateWithAction
                      title="Aktif varyant bulunamadi."
                      subtitle="Secili urunde pakete eklenebilir varyant yok."
                      actionLabel="Farkli urun sec"
                      onAction={() => onSearchProducts("")}
                    />
                  )}
                </>
              ) : null}
            </View>
          </Card>

          <Card>
            <SectionTitle title={`Paket kalemleri (${items.length})`} />
            <View style={styles.modalSection}>
              <InlineFieldError text={itemsError} />
              {items.length ? (
                items.map((item) => (
                  <Card key={item.rowId} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>{item.variantLabel}</Text>
                    <TextField
                      label="Miktar"
                      value={item.quantity}
                      onChangeText={(value) => onChangeItemQuantity(item.rowId, value)}
                      keyboardType="numeric"
                      inputMode="numeric"
                      errorText={itemErrors[item.rowId] || undefined}
                    />
                    <Button
                      label="Kalemi cikar"
                      onPress={() => onRemoveItem(item.rowId)}
                      variant="ghost"
                    />
                  </Card>
                ))
              ) : (
                <EmptyStateWithAction
                  title="Henuz paket kalemi yok."
                  subtitle="Ustteki arama ile urun bulup varyant ekle."
                  actionLabel="Aramaya odaklan"
                  onAction={() => onSearchProducts(variantSearchTerm)}
                />
              )}
            </View>
          </Card>

          {editingId && canUpdate ? (
            <Button
              label={editingIsActive ? "Paketi pasif yap" : "Paketi aktif yap"}
              onPress={onToggleActive}
              variant={editingIsActive ? "ghost" : "secondary"}
            />
          ) : null}
          <Button
            label={editingId ? "Degisiklikleri kaydet" : "Paketi kaydet"}
            onPress={onSubmit}
            loading={submitting}
            disabled={Boolean(nameError || codeError || itemsError)}
          />
        </>
      )}
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  loadingList: {
    gap: 12,
    paddingBottom: 12,
  },
  list: {
    gap: 12,
  },
  modalSection: {
    marginTop: 12,
    gap: 12,
  },
  selectedHint: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
    fontWeight: "600",
  },
  itemCard: {
    gap: 12,
  },
  itemTitle: {
    color: mobileTheme.colors.dark.text,
    fontSize: 14,
    fontWeight: "700",
  },
});
