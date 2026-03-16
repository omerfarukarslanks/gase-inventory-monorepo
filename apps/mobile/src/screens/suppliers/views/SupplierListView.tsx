import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type Supplier } from "@gase/core";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  FilterTabs,
  ListRow,
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
      <FlatList
        data={loading ? [] : suppliers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        onRefresh={onFetchSuppliers}
        refreshing={loading}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {error ? <Banner text={error} /> : null}

            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Isim, telefon veya e-posta ara"
            />
            <FilterTabs value={statusFilter} options={statusOptions} onChange={setStatusFilter} />

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

            {loading ? (
              <View style={styles.skeletonGroup}>
                <SkeletonBlock height={82} />
                <SkeletonBlock height={82} />
                <SkeletonBlock height={82} />
              </View>
            ) : null}
          </View>
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
          !loading ? (
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
                    trackEvent("empty_state_action_clicked", { screen: "suppliers", target: "reset_filters" });
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
          ) : null
        }
      />

      {hasFilters ? (
        <StickyActionBar>
          <Button label="Filtreyi temizle" onPress={onResetFilters} variant="ghost" />
        </StickyActionBar>
      ) : null}

      {/* FAB — Yeni Tedarikci (sadece yetkili kullanicilara) */}
      {canCreate ? (
        <Pressable style={styles.fab} onPress={onOpenCreateModal} hitSlop={8}>
          <MaterialCommunityIcons name="plus-circle-outline" size={22} color="#fff" />
        </Pressable>
      ) : null}

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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 12,
  },
  listHeader: {
    paddingTop: 16,
    gap: 12,
    marginBottom: 8,
  },
  skeletonGroup: {
    gap: 12,
    marginTop: 4,
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
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: mobileTheme.colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: mobileTheme.colors.brand.primary,
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
});
