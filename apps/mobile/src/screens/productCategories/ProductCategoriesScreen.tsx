import { type ProductCategory } from "@gase/core";
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
import { useCategoryList } from "./hooks/useCategoryList";
import { useCategoryForm } from "./hooks/useCategoryForm";
import { CategoryListView } from "./views/CategoryListView";
import { CategoryFormSheet } from "./views/CategoryFormSheet";

type ProductCategoriesScreenProps = {
  isActive?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  onBack?: () => void;
};

export default function ProductCategoriesScreen({
  isActive = true,
  canCreate = false,
  canUpdate = false,
  onBack,
}: ProductCategoriesScreenProps = {}) {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    categories,
    allCategories,
    loading,
    error,
    setError,
    selectedCategory,
    setSelectedCategory,
    detailLoading,
    activeFilterLabel,
    hasFilters,
    parentNameMap,
    fetchCategories,
    fetchAllCategories,
    openCategory,
    resetFilters,
  } = useCategoryList({ isActive });

  const {
    editorOpen,
    editingCategoryId,
    editingCategoryIsActive,
    setEditingCategoryIsActive,
    submitting,
    toggling,
    form,
    formError,
    nameError,
    slugError,
    parentError,
    parentSearch,
    setParentSearch,
    selectedParentLabel,
    parentSelectionItems,
    slugRef,
    descriptionRef,
    resetEditor,
    openCreateModal,
    openEditModal,
    submitCategory,
    toggleCategoryActive,
    handleFormChange,
    handleParentSelect,
  } = useCategoryForm({
    allCategories,
    fetchCategories,
    fetchAllCategories,
    setSelectedCategory,
  });

  if (selectedCategory || detailLoading) {
    const childCategories = selectedCategory?.children ?? [];
    const parentLabel =
      selectedCategory?.parent?.name ??
      (selectedCategory?.parentId ? parentNameMap.get(selectedCategory.parentId) : undefined) ??
      "Kok kategori";

    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title={selectedCategory?.name ?? "Kategori detayi"}
            subtitle="Hiyerarsi, slug ve durum ozeti"
            onBack={() => {
              setSelectedCategory(null);
              setError("");
            }}
            action={
              canUpdate && selectedCategory ? (
                <Button
                  label="Duzenle"
                  onPress={() => openEditModal(selectedCategory)}
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
          ) : selectedCategory ? (
            <>
              <Card>
                <SectionTitle title="Kategori profili" />
                <View style={styles.detailStats}>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Durum</Text>
                    <StatusBadge
                      label={selectedCategory.isActive === false ? "pasif" : "aktif"}
                      tone={selectedCategory.isActive === false ? "neutral" : "positive"}
                    />
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Slug</Text>
                    <Text style={styles.detailValue}>{selectedCategory.slug ?? "-"}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Ust kategori</Text>
                    <Text style={styles.detailValue}>{parentLabel}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Alt kategori</Text>
                    <Text style={styles.detailValue}>{childCategories.length}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Aciklama</Text>
                    <Text style={styles.detailValue}>
                      {selectedCategory.description ?? "Kayitli aciklama yok"}
                    </Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Kayit tarihi</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedCategory.createdAt)}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Guncelleme</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedCategory.updatedAt)}</Text>
                  </View>
                </View>
              </Card>

              {childCategories.length ? (
                <Card>
                  <SectionTitle title="Alt kategoriler" />
                  <View style={styles.childList}>
                    {childCategories.map((child) => (
                      <View key={child.id} style={styles.childRow}>
                        <View style={styles.childCopy}>
                          <Text style={styles.childTitle}>{child.name}</Text>
                          <Text style={styles.childCaption}>{child.slug ?? "slug yok"}</Text>
                        </View>
                        <StatusBadge
                          label={child.isActive === false ? "pasif" : "aktif"}
                          tone={child.isActive === false ? "neutral" : "positive"}
                        />
                      </View>
                    ))}
                  </View>
                </Card>
              ) : null}

              <Card>
                <SectionTitle title="Operator notu" />
                <Text style={styles.mutedText}>
                  Urun filtreleri ve paketleme akislarinda kategori hiyerarsisi bu kayitla
                  belirlenir. Slug ve ust kategori secimini guncel tutmak raporlamayi da
                  duzgunlestirir.
                </Text>
              </Card>
            </>
          ) : (
            <EmptyStateWithAction
              title="Kategori detayi getirilemedi."
              subtitle="Listeye donup kategoriyi yeniden ac."
              actionLabel="Listeye don"
              onAction={() => setSelectedCategory(null)}
            />
          )}
        </ScrollView>

        <StickyActionBar>
          <Button
            label="Listeye don"
            onPress={() => {
              setSelectedCategory(null);
              setError("");
            }}
            variant="ghost"
          />
          {canUpdate && selectedCategory ? (
            <Button
              label={selectedCategory.isActive === false ? "Aktif et" : "Pasife al"}
              onPress={() => void toggleCategoryActive(selectedCategory, setError)}
              variant={selectedCategory.isActive === false ? "secondary" : "danger"}
              loading={toggling}
            />
          ) : null}
        </StickyActionBar>

        <CategoryFormSheet
          visible={editorOpen}
          form={form}
          formError={formError}
          nameError={nameError}
          slugError={slugError}
          parentError={parentError}
          parentSearch={parentSearch}
          parentSelectionItems={parentSelectionItems}
          selectedParentLabel={selectedParentLabel}
          editingCategoryId={editingCategoryId}
          editingCategoryIsActive={editingCategoryIsActive}
          submitting={submitting}
          canUpdate={canUpdate}
          slugRef={slugRef}
          descriptionRef={descriptionRef}
          onClose={resetEditor}
          onSubmit={() => void submitCategory()}
          onToggleActive={() => setEditingCategoryIsActive((current) => !current)}
          onParentSearchChange={setParentSearch}
          onParentSelect={handleParentSelect}
          onChange={handleFormChange}
        />
      </View>
    );
  }

  return (
    <>
      <CategoryListView
        search={search}
        statusFilter={statusFilter}
        categories={categories}
        loading={loading}
        error={error}
        activeFilterLabel={activeFilterLabel}
        hasFilters={hasFilters}
        parentNameMap={parentNameMap}
        canCreate={canCreate}
        onBack={onBack}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onCategoryPress={(categoryId) => void openCategory(categoryId)}
        onResetFilters={resetFilters}
        onRefresh={() => void Promise.all([fetchCategories(), fetchAllCategories()])}
        onCreatePress={openCreateModal}
      />

      <CategoryFormSheet
        visible={editorOpen}
        form={form}
        formError={formError}
        nameError={nameError}
        slugError={slugError}
        parentError={parentError}
        parentSearch={parentSearch}
        parentSelectionItems={parentSelectionItems}
        selectedParentLabel={selectedParentLabel}
        editingCategoryId={editingCategoryId}
        editingCategoryIsActive={editingCategoryIsActive}
        submitting={submitting}
        canUpdate={canUpdate}
        slugRef={slugRef}
        descriptionRef={descriptionRef}
        onClose={resetEditor}
        onSubmit={() => void submitCategory()}
        onToggleActive={() => setEditingCategoryIsActive((current) => !current)}
        onParentSearchChange={setParentSearch}
        onParentSelect={handleParentSelect}
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
  mutedText: {
    marginTop: 12,
    color: mobileTheme.colors.dark.text2,
    fontSize: 13,
    lineHeight: 19,
  },
  childList: {
    marginTop: 12,
    gap: 10,
  },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: mobileTheme.colors.dark.border,
    backgroundColor: mobileTheme.colors.dark.surface2,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  childCopy: {
    flex: 1,
    gap: 4,
  },
  childTitle: {
    color: mobileTheme.colors.dark.text,
    fontSize: 14,
    fontWeight: "700",
  },
  childCaption: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
  },
});
