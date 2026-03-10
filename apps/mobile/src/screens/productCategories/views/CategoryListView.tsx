import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ProductCategory } from "@gase/core";
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

type StatusFilter = "all" | "true" | "false";

const statusOptions = [
  { label: "Tum", value: "all" as const },
  { label: "Aktif", value: "true" as const },
  { label: "Pasif", value: "false" as const },
];

type CategoryListViewProps = {
  search: string;
  statusFilter: StatusFilter;
  categories: ProductCategory[];
  loading: boolean;
  error: string;
  activeFilterLabel: string;
  hasFilters: boolean;
  parentNameMap: Map<string, string>;
  canCreate: boolean;
  onBack?: () => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onCategoryPress: (categoryId: string) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  onCreatePress: () => void;
};

export function CategoryListView({
  search,
  statusFilter,
  categories,
  loading,
  error,
  activeFilterLabel,
  hasFilters,
  parentNameMap,
  canCreate,
  onBack,
  onSearchChange,
  onStatusFilterChange,
  onCategoryPress,
  onResetFilters,
  onRefresh,
  onCreatePress,
}: CategoryListViewProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <ScreenHeader
          title="Urun kategorileri"
          subtitle="Urun hiyerarsisini mobilde yonet"
          onBack={onBack}
          action={
            <Button
              label="Yenile"
              onPress={onRefresh}
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
              onChangeText={onSearchChange}
              placeholder="Kategori adi veya slug ara"
            />
            <FilterTabs value={statusFilter} options={statusOptions} onChange={onStatusFilterChange} />
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
          data={categories}
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
                  <Text style={styles.detailValue}>{categories.length}</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.detailLabel}>Arama</Text>
                  <Text style={styles.detailValue}>
                    {search.trim() ? `"${search.trim()}"` : "Tum kategoriler"}
                  </Text>
                </View>
              </View>
            </Card>
          }
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={
                item.parent?.name ??
                (item.parentId ? parentNameMap.get(item.parentId) : undefined) ??
                "Kok kategori"
              }
              caption={[
                item.slug ? `Slug: ${item.slug}` : "Slug yok",
                `${item.children?.length ?? 0} alt kategori`,
              ].join(" • ")}
              badgeLabel={item.isActive === false ? "pasif" : "aktif"}
              badgeTone={item.isActive === false ? "neutral" : "positive"}
              onPress={() => onCategoryPress(item.id)}
              icon={
                <MaterialCommunityIcons
                  name="shape-outline"
                  size={20}
                  color={mobileTheme.colors.brand.primary}
                />
              }
            />
          )}
          ListEmptyComponent={
            error ? (
              <EmptyStateWithAction
                title="Kategori listesi yuklenemedi."
                subtitle="Baglanti problemi olabilir. Listeyi yeniden sorgula."
                actionLabel="Tekrar dene"
                onAction={onRefresh}
              />
            ) : (
              <EmptyStateWithAction
                title={hasFilters ? "Filtreye uygun kategori yok." : "Kategori bulunamadi."}
                subtitle={
                  hasFilters
                    ? "Aramayi temizleyip durum filtresini genislet."
                    : "Yeni kategori ekleyerek urun hiyerarsisini mobilde de kurabilirsin."
                }
                actionLabel={hasFilters ? "Filtreyi temizle" : canCreate ? "Yeni kategori" : "Listeyi yenile"}
                onAction={() => {
                  if (hasFilters) {
                    trackEvent("empty_state_action_clicked", {
                      screen: "product_categories",
                      target: "reset_filters",
                    });
                    onResetFilters();
                    return;
                  }
                  if (canCreate) {
                    onCreatePress();
                    return;
                  }
                  onRefresh();
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
            label="Yeni kategori"
            onPress={onCreatePress}
            icon={<MaterialCommunityIcons name="plus-circle-outline" size={16} color="#FFFFFF" />}
          />
        ) : (
          <Button
            label="Listeyi yenile"
            onPress={onRefresh}
            variant="secondary"
          />
        )}
      </StickyActionBar>
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
