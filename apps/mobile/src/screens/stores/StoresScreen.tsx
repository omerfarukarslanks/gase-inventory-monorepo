import { updateStore, type Store } from "@gase/core";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  ScreenHeader,
  SectionTitle,
  SkeletonBlock,
  StatusBadge,
  StickyActionBar,
} from "@/src/components/ui";
import { formatDate } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";
import { useStoreList } from "./hooks/useStoreList";
import { useStoreForm } from "./hooks/useStoreForm";
import { StoreListView } from "./views/StoreListView";
import { StoreFormSheet } from "./views/StoreFormSheet";

type StoresScreenProps = {
  isActive?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  onBack?: () => void;
};

function formatStoreType(value: string | null | undefined) {
  return value === "WHOLESALE" ? "Toptan" : "Perakende";
}

export default function StoresScreen({
  isActive = true,
  canCreate = false,
  canUpdate = false,
  onBack,
}: StoresScreenProps = {}) {
  const [toggling, setToggling] = useState(false);

  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    stores,
    loading,
    error,
    setError,
    selectedStore,
    setSelectedStore,
    detailLoading,
    fetchStores,
    openStore,
    resetFilters,
  } = useStoreList({ isActive });

  const {
    editorOpen,
    editingStoreId,
    editingStoreIsActive,
    setEditingStoreIsActive,
    submitting,
    form,
    formError,
    nameError,
    codeRef,
    slugRef,
    addressRef,
    logoRef,
    descriptionRef,
    openCreateModal,
    openEditModal,
    closeEditor,
    submitStore,
    handleFormChange,
  } = useStoreForm({ fetchStores, setSelectedStore });

  const toggleStoreActive = async () => {
    if (!selectedStore) return;

    setToggling(true);
    setError("");
    try {
      const updated = await updateStore(selectedStore.id, {
        name: selectedStore.name,
        code: selectedStore.code || undefined,
        address: selectedStore.address || undefined,
        slug: selectedStore.slug || undefined,
        logo: selectedStore.logo || undefined,
        description: selectedStore.description || undefined,
        isActive: !selectedStore.isActive,
      });
      setSelectedStore(updated);
      await fetchStores();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Magaza durumu guncellenemedi.",
      );
    } finally {
      setToggling(false);
    }
  };

  if (selectedStore || detailLoading) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title={selectedStore?.name ?? "Magaza detayi"}
            subtitle="Scope, iletisim ve operasyon bilgisi"
            onBack={() => {
              setSelectedStore(null);
              setError("");
            }}
            action={
              canUpdate && selectedStore ? (
                <Button
                  label="Duzenle"
                  onPress={() => openEditModal(selectedStore)}
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                />
              ) : undefined
            }
          />

          {error ? <Banner text={error} /> : null}

          {detailLoading ? (
            <View style={styles.loadingList}>
              <SkeletonBlock height={96} />
              <SkeletonBlock height={88} />
            </View>
          ) : selectedStore ? (
            <>
              <Card>
                <SectionTitle title="Magaza profili" />
                <View style={styles.detailStats}>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Durum</Text>
                    <StatusBadge
                      label={selectedStore.isActive ? "aktif" : "pasif"}
                      tone={selectedStore.isActive ? "positive" : "neutral"}
                    />
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Kod</Text>
                    <Text style={styles.detailValue}>{selectedStore.code || "-"}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Tip</Text>
                    <Text style={styles.detailValue}>{formatStoreType(selectedStore.storeType)}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Para birimi</Text>
                    <Text style={styles.detailValue}>{selectedStore.currency ?? "TRY"}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Slug</Text>
                    <Text style={styles.detailValue}>{selectedStore.slug || "-"}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Adres</Text>
                    <Text style={styles.detailValue}>{selectedStore.address ?? "Kayitli adres yok"}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Aciklama</Text>
                    <Text style={styles.detailValue}>
                      {selectedStore.description ?? "Kayitli aciklama yok"}
                    </Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Kayit tarihi</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedStore.createdAt)}</Text>
                  </View>
                </View>
              </Card>

              <Card>
                <SectionTitle title="Operator notu" />
                <Text style={styles.mutedText}>
                  Stok ve satis akislarinda bu magaza scope olarak kullanilir. Kod, slug ve para birimi operasyonel tutarlilik icin guncel tutulmalidir.
                </Text>
              </Card>
            </>
          ) : (
            <EmptyStateWithAction
              title="Magaza detayi getirilemedi."
              subtitle="Listeye donup magazayi yeniden ac."
              actionLabel="Listeye don"
              onAction={() => setSelectedStore(null)}
            />
          )}
        </ScrollView>

        <StickyActionBar>
          <Button
            label="Listeye don"
            onPress={() => {
              setSelectedStore(null);
              setError("");
            }}
            variant="ghost"
          />
          {canUpdate && selectedStore ? (
            <Button
              label={selectedStore.isActive ? "Pasife al" : "Aktif et"}
              onPress={() => void toggleStoreActive()}
              variant={selectedStore.isActive ? "danger" : "secondary"}
              loading={toggling}
            />
          ) : null}
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
          onClose={closeEditor}
          onSubmit={() => void submitStore()}
          onToggleActive={() => setEditingStoreIsActive((current) => !current)}
          onChange={handleFormChange}
        />
      </View>
    );
  }

  return (
    <StoreListView
      stores={stores}
      loading={loading}
      error={error}
      search={search}
      setSearch={setSearch}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      canCreate={canCreate}
      onBack={onBack}
      onStorePress={(storeId) => void openStore(storeId)}
      onFetchStores={() => void fetchStores()}
      onResetFilters={resetFilters}
      onOpenCreateModal={openCreateModal}
      editorOpen={editorOpen}
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
      onCloseEditor={closeEditor}
      onSubmit={() => void submitStore()}
      onToggleActive={() => setEditingStoreIsActive((current) => !current)}
      onFormChange={handleFormChange}
    />
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
  loadingList: {
    gap: 12,
    paddingBottom: 120,
  },
  detailStats: {
    marginTop: 12,
    gap: 12,
  },
  detailStat: {
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
  mutedText: {
    marginTop: 12,
    color: mobileTheme.colors.dark.text2,
    fontSize: 13,
    lineHeight: 19,
  },
});
