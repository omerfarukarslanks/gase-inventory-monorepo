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
import { useUnitList } from "./hooks/useUnitList";
import { useUnitForm } from "./hooks/useUnitForm";
import { UnitListView } from "./views/UnitListView";
import { UnitFormSheet } from "./views/UnitFormSheet";

type UnitsScreenProps = {
  isActive?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  onBack?: () => void;
};

export default function UnitsScreen({
  isActive = true,
  canCreate = false,
  canUpdate = false,
  onBack,
}: UnitsScreenProps = {}) {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    units,
    loading,
    error,
    setError,
    selectedUnit,
    setSelectedUnit,
    detailLoading,
    activeFilterLabel,
    hasFilters,
    fetchUnits,
    openUnit,
    resetFilters,
  } = useUnitList({ isActive });

  const {
    editorOpen,
    editingUnitId,
    editingUnitIsDefault,
    editingUnitIsActive,
    setEditingUnitIsActive,
    submitting,
    toggling,
    form,
    formError,
    nameError,
    abbreviationError,
    resetEditor,
    openCreateModal,
    openEditModal,
    handleFormChange,
    submitUnit,
    toggleUnitActive,
  } = useUnitForm({ fetchUnits, setSelectedUnit });

  if (selectedUnit || detailLoading) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title={selectedUnit?.name ?? "Birim detayi"}
            subtitle="Ad, kisaltma ve durum ozeti"
            onBack={() => {
              setSelectedUnit(null);
              setError("");
            }}
            action={
              canUpdate && selectedUnit ? (
                <Button
                  label="Duzenle"
                  onPress={() => openEditModal(selectedUnit)}
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
              <SkeletonBlock height={92} />
              <SkeletonBlock height={88} />
            </View>
          ) : selectedUnit ? (
            <>
              <Card>
                <SectionTitle title="Birim profili" />
                <View style={styles.detailStats}>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Durum</Text>
                    <StatusBadge
                      label={selectedUnit.isActive ? "aktif" : "pasif"}
                      tone={selectedUnit.isActive ? "positive" : "neutral"}
                    />
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Kisaltma</Text>
                    <Text style={styles.detailValue}>{selectedUnit.abbreviation}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Varsayilan</Text>
                    <Text style={styles.detailValue}>{selectedUnit.isDefault ? "Evet" : "Hayir"}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Kayit tarihi</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedUnit.createdAt)}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Guncelleme</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedUnit.updatedAt)}</Text>
                  </View>
                </View>
              </Card>
            </>
          ) : (
            <EmptyStateWithAction
              title="Birim detayi getirilemedi."
              subtitle="Listeye donup birimi yeniden ac."
              actionLabel="Listeye don"
              onAction={() => setSelectedUnit(null)}
            />
          )}
        </ScrollView>

        <StickyActionBar>
          <Button
            label="Listeye don"
            onPress={() => {
              setSelectedUnit(null);
              setError("");
            }}
            variant="ghost"
          />
          {canUpdate && selectedUnit && !selectedUnit.isDefault ? (
            <Button
              label={selectedUnit.isActive ? "Pasife al" : "Aktif et"}
              onPress={() => void toggleUnitActive(selectedUnit, setError)}
              variant={selectedUnit.isActive ? "danger" : "secondary"}
              loading={toggling}
            />
          ) : null}
        </StickyActionBar>

        <UnitFormSheet
          visible={editorOpen}
          form={form}
          formError={formError}
          nameError={nameError}
          abbreviationError={abbreviationError}
          editingUnitId={editingUnitId}
          editingUnitIsDefault={editingUnitIsDefault}
          editingUnitIsActive={editingUnitIsActive}
          submitting={submitting}
          canUpdate={canUpdate}
          onClose={resetEditor}
          onSubmit={() => void submitUnit()}
          onToggleActive={(value) => setEditingUnitIsActive(value)}
          onChange={handleFormChange}
        />
      </View>
    );
  }

  return (
    <>
      <UnitListView
        search={search}
        statusFilter={statusFilter}
        units={units}
        loading={loading}
        error={error}
        activeFilterLabel={activeFilterLabel}
        hasFilters={hasFilters}
        canCreate={canCreate}
        onBack={onBack}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onUnitPress={(unitId) => void openUnit(unitId)}
        onResetFilters={resetFilters}
        onRefresh={() => void fetchUnits()}
        onCreatePress={openCreateModal}
      />

      <UnitFormSheet
        visible={editorOpen}
        form={form}
        formError={formError}
        nameError={nameError}
        abbreviationError={abbreviationError}
        editingUnitId={editingUnitId}
        editingUnitIsDefault={editingUnitIsDefault}
        editingUnitIsActive={editingUnitIsActive}
        submitting={submitting}
        canUpdate={canUpdate}
        onClose={resetEditor}
        onSubmit={() => void submitUnit()}
        onToggleActive={(value) => setEditingUnitIsActive(value)}
        onChange={handleFormChange}
      />
    </>
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
});
