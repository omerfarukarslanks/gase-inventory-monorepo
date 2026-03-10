import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type Supplier } from "@gase/core";
import { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  FilterTabs,
  ListRow,
  ScreenHeader,
  SearchBar,
  SectionTitle,
  SkeletonBlock,
  StickyActionBar,
} from "@/src/components/ui";
import { trackEvent } from "@/src/lib/analytics";
import { mobileTheme } from "@/src/theme";
import type { StatusFilter } from "../hooks/useSupplierList";
import type { SupplierForm } from "../hooks/useSupplierForm";
import { SupplierFormSheet } from "./SupplierFormSheet";

const statusOptions = [
  { label: "Tum", value: "all" as const },
  { label: "Aktif", value: "true" as const },
  { label: "Pasif", value: "false" as const },
];

type SupplierListViewProps = {
  suppliers: Supplier[];
  loading: boolean;
  error: string;
  search: string;
  setSearch: (value: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
  canCreate: boolean;
  onBack?: () => void;
  onSupplierPress: (supplierId: string) => void;
  onFetchSuppliers: () => void;
  onResetFilters: () => void;
  onOpenCreateModal: () => void;
  // SupplierFormSheet props
  editorOpen: boolean;
  form: SupplierForm;
  formError: string;
  nameError: string;
  phoneError: string;
  emailError: string;
  editingSupplierId: string | null;
  editingSupplierIsActive: boolean;
  submitting: boolean;
  canUpdate: boolean;
  surnameRef: { current: import("react-native").TextInput | null };
  phoneRef: { current: import("react-native").TextInput | null };
  emailRef: { current: import("react-native").TextInput | null };
  addressRef: { current: import("react-native").TextInput | null };
  onCloseEditor: () => void;
  onSubmit: () => void;
  onToggleActive: () => void;
  onFormChange: (field: keyof SupplierForm, value: string) => void;
};

export function SupplierListView({
  suppliers,
  loading,
  error,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  canCreate,
  onBack,
  onSupplierPress,
  onFetchSuppliers,
  onResetFilters,
  onOpenCreateModal,
  editorOpen,
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
  onCloseEditor,
  onSubmit,
  onToggleActive,
  onFormChange,
}: SupplierListViewProps) {
  const activeFilterLabel = useMemo(() => {
    if (statusFilter === "true") return "Aktif tedarikciler";
    if (statusFilter === "false") return "Pasif tedarikciler";
    return "Tum tedarikciler";
  }, [statusFilter]);

  const hasFilters = Boolean(search.trim() || statusFilter !== "all");

  return (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <ScreenHeader
          title="Tedarikciler"
          subtitle="Stok alimi icin iletisim ve durum yonetimi"
          onBack={onBack}
          action={
            <Button
              label="Yenile"
              onPress={onFetchSuppliers}
              variant="secondary"
              size="sm"
              fullWidth={false}
            />
          }
        />

        {error ? <Banner text={error} /> : null}

        <Card>
          <View style={styles.filterStack}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Isim, telefon veya e-posta ara"
            />
            <FilterTabs value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
          </View>
        </Card>
      </View>

      {loading ? (
        <View style={styles.listWrap}>
          <View style={styles.loadingList}>
            <SkeletonBlock height={82} />
            <SkeletonBlock height={82} />
            <SkeletonBlock height={82} />
          </View>
        </View>
      ) : (
        <FlatList
          data={suppliers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Card>
              <SectionTitle title="Liste baglami" />
              <View style={styles.summaryStats}>
                <View style={styles.summaryStat}>
                  <Text style={styles.detailLabel}>Kapsam</Text>
                  <Text style={styles.detailValue}>{activeFilterLabel}</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.detailLabel}>Kayit</Text>
                  <Text style={styles.detailValue}>{suppliers.length}</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.detailLabel}>Arama</Text>
                  <Text style={styles.detailValue}>
                    {search.trim() ? `"${search.trim()}"` : "Tum tedarikciler"}
                  </Text>
                </View>
              </View>
            </Card>
          }
          renderItem={({ item }) => (
            <ListRow
              title={[item.name, item.surname].filter(Boolean).join(" ").trim()}
              subtitle={item.phoneNumber ?? item.email ?? "Iletisim bilgisi yok"}
              caption={item.address ?? "Adres bilgisi yok"}
              badgeLabel={item.isActive === false ? "pasif" : "aktif"}
              badgeTone={item.isActive === false ? "neutral" : "positive"}
              onPress={() => onSupplierPress(item.id)}
              icon={
                <MaterialCommunityIcons
                  name="truck-delivery-outline"
                  size={20}
                  color={mobileTheme.colors.brand.primary}
                />
              }
            />
          )}
          ListEmptyComponent={
            error ? (
              <EmptyStateWithAction
                title="Tedarikci listesi yuklenemedi."
                subtitle="Baglanti problemi olabilir. Listeyi yeniden sorgula."
                actionLabel="Tekrar dene"
                onAction={onFetchSuppliers}
              />
            ) : (
              <EmptyStateWithAction
                title={hasFilters ? "Filtreye uygun tedarikci yok." : "Tedarikci bulunamadi."}
                subtitle={
                  hasFilters
                    ? "Aramayi temizleyip durum filtresini genislet."
                    : "Yeni tedarikci ekleyerek alim akislarini tamamlayabilirsin."
                }
                actionLabel={hasFilters ? "Filtreyi temizle" : canCreate ? "Yeni tedarikci" : "Listeyi yenile"}
                onAction={() => {
                  if (hasFilters) {
                    trackEvent("empty_state_action_clicked", {
                      screen: "suppliers",
                      target: "reset_filters",
                    });
                    onResetFilters();
                    return;
                  }
                  if (canCreate) {
                    onOpenCreateModal();
                    return;
                  }
                  onFetchSuppliers();
                }}
              />
            )
          }
        />
      )}

      <StickyActionBar>
        <Button label="Filtreyi temizle" onPress={onResetFilters} variant="ghost" />
        {canCreate ? (
          <Button
            label="Yeni tedarikci"
            onPress={onOpenCreateModal}
            icon={<MaterialCommunityIcons name="plus-circle-outline" size={16} color="#FFFFFF" />}
          />
        ) : (
          <Button label="Listeyi yenile" onPress={onFetchSuppliers} variant="secondary" />
        )}
      </StickyActionBar>

      <SupplierFormSheet
        visible={editorOpen}
        form={form}
        formError={formError}
        nameError={nameError}
        phoneError={phoneError}
        emailError={emailError}
        editingSupplierId={editingSupplierId}
        editingSupplierIsActive={editingSupplierIsActive}
        submitting={submitting}
        canUpdate={canUpdate}
        surnameRef={surnameRef}
        phoneRef={phoneRef}
        emailRef={emailRef}
        addressRef={addressRef}
        onClose={onCloseEditor}
        onSubmit={onSubmit}
        onToggleActive={onToggleActive}
        onChange={onFormChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: mobileTheme.colors.dark.bg,
  },
  screenContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  filterStack: {
    gap: 12,
  },
  listWrap: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 12,
  },
  loadingList: {
    gap: 12,
    paddingBottom: 120,
  },
  summaryStats: {
    marginTop: 12,
    gap: 12,
  },
  summaryStat: {
    gap: 4,
  },
  detailLabel: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  detailValue: {
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
});
