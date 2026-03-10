import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type Store } from "@gase/core";
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
import type { StatusFilter } from "../hooks/useStoreList";
import type { StoreForm } from "../hooks/useStoreForm";
import { StoreFormSheet } from "./StoreFormSheet";

const statusOptions = [
  { label: "Tum", value: "all" as const },
  { label: "Aktif", value: "true" as const },
  { label: "Pasif", value: "false" as const },
];

function formatStoreType(value: string | null | undefined) {
  return value === "WHOLESALE" ? "Toptan" : "Perakende";
}

type StoreListViewProps = {
  stores: Store[];
  loading: boolean;
  error: string;
  search: string;
  setSearch: (value: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
  canCreate: boolean;
  onBack?: () => void;
  onStorePress: (storeId: string) => void;
  onFetchStores: () => void;
  onResetFilters: () => void;
  onOpenCreateModal: () => void;
  // StoreFormSheet props
  editorOpen: boolean;
  form: StoreForm;
  formError: string;
  nameError: string;
  editingStoreId: string | null;
  editingStoreIsActive: boolean;
  submitting: boolean;
  canUpdate: boolean;
  codeRef: { current: import("react-native").TextInput | null };
  slugRef: { current: import("react-native").TextInput | null };
  addressRef: { current: import("react-native").TextInput | null };
  logoRef: { current: import("react-native").TextInput | null };
  descriptionRef: { current: import("react-native").TextInput | null };
  onCloseEditor: () => void;
  onSubmit: () => void;
  onToggleActive: () => void;
  onFormChange: (field: keyof StoreForm, value: StoreForm[keyof StoreForm]) => void;
};

export function StoreListView({
  stores,
  loading,
  error,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  canCreate,
  onBack,
  onStorePress,
  onFetchStores,
  onResetFilters,
  onOpenCreateModal,
  editorOpen,
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
  onCloseEditor,
  onSubmit,
  onToggleActive,
  onFormChange,
}: StoreListViewProps) {
  const activeFilterLabel = useMemo(() => {
    if (statusFilter === "true") return "Aktif magazalar";
    if (statusFilter === "false") return "Pasif magazalar";
    return "Tum magazalar";
  }, [statusFilter]);

  const hasFilters = Boolean(search.trim() || statusFilter !== "all");

  return (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <ScreenHeader
          title="Magazalar"
          subtitle="Scope ve operasyon ayarlarini mobilde takip et"
          onBack={onBack}
          action={
            <Button
              label="Yenile"
              onPress={onFetchStores}
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
              placeholder="Magaza adi, kod veya slug ara"
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
          data={stores}
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
                  <Text style={styles.detailValue}>{stores.length}</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.detailLabel}>Arama</Text>
                  <Text style={styles.detailValue}>
                    {search.trim() ? `"${search.trim()}"` : "Tum magazalar"}
                  </Text>
                </View>
              </View>
            </Card>
          }
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={`${item.code || "-"} • ${formatStoreType(item.storeType)}`}
              caption={`${item.currency ?? "TRY"} • ${item.slug || "slug yok"}`}
              badgeLabel={item.isActive ? "aktif" : "pasif"}
              badgeTone={item.isActive ? "positive" : "neutral"}
              onPress={() => onStorePress(item.id)}
              icon={
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={20}
                  color={mobileTheme.colors.brand.primary}
                />
              }
            />
          )}
          ListEmptyComponent={
            error ? (
              <EmptyStateWithAction
                title="Magaza listesi yuklenemedi."
                subtitle="Baglanti problemi olabilir. Listeyi yeniden sorgula."
                actionLabel="Tekrar dene"
                onAction={onFetchStores}
              />
            ) : (
              <EmptyStateWithAction
                title={hasFilters ? "Filtreye uygun magaza yok." : "Magaza bulunamadi."}
                subtitle={
                  hasFilters
                    ? "Aramayi temizleyip durum filtresini genislet."
                    : "Yeni magaza ekleyerek scope yonetimini mobilde de acabilirsin."
                }
                actionLabel={hasFilters ? "Filtreyi temizle" : canCreate ? "Yeni magaza" : "Listeyi yenile"}
                onAction={() => {
                  if (hasFilters) {
                    trackEvent("empty_state_action_clicked", {
                      screen: "stores",
                      target: "reset_filters",
                    });
                    onResetFilters();
                    return;
                  }
                  if (canCreate) {
                    onOpenCreateModal();
                    return;
                  }
                  onFetchStores();
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
            label="Yeni magaza"
            onPress={onOpenCreateModal}
            icon={<MaterialCommunityIcons name="plus-circle-outline" size={16} color="#FFFFFF" />}
          />
        ) : (
          <Button label="Listeyi yenile" onPress={onFetchStores} variant="secondary" />
        )}
      </StickyActionBar>

      <StoreFormSheet
        visible={editorOpen}
        form={form}
        formError={formError}
        nameError={nameError}
        editingStoreId={editingStoreId}
        editingStoreIsActive={editingStoreIsActive}
        submitting={submitting}
        canUpdate={canUpdate}
        codeRef={codeRef}
        slugRef={slugRef}
        addressRef={addressRef}
        logoRef={logoRef}
        descriptionRef={descriptionRef}
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
