import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ProductPackage } from "@gase/core";
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
import { mobileTheme } from "@/src/theme";
import { type StatusFilter, statusOptions } from "../hooks/usePackageList";

type PackageListViewProps = {
  packages: ProductPackage[];
  loading: boolean;
  error: string;
  search: string;
  statusFilter: StatusFilter;
  activeFilterLabel: string;
  hasFilters: boolean;
  canCreate: boolean;
  onBack?: () => void;
  onChangeSearch: (value: string) => void;
  onChangeStatusFilter: (value: StatusFilter) => void;
  onPackagePress: (packageId: string) => void;
  onFetchPackages: () => void;
  onResetFilters: () => void;
  onResetFiltersWithTracking: () => void;
  onCreatePress: () => void;
};

export function PackageListView({
  packages,
  loading,
  error,
  search,
  statusFilter,
  activeFilterLabel,
  hasFilters,
  canCreate,
  onBack,
  onChangeSearch,
  onChangeStatusFilter,
  onPackagePress,
  onFetchPackages,
  onResetFilters,
  onResetFiltersWithTracking,
  onCreatePress,
}: PackageListViewProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <ScreenHeader
          title="Urun paketleri"
          subtitle="Toptan satis icin paket tanimlarini mobilde yonet"
          onBack={onBack}
          action={
            <Button
              label="Yenile"
              onPress={onFetchPackages}
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
              onChangeText={onChangeSearch}
              placeholder="Paket adi veya kod ara"
            />
            <FilterTabs
              value={statusFilter}
              options={statusOptions}
              onChange={onChangeStatusFilter}
            />
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
          data={packages}
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
                  <Text style={styles.detailValue}>{packages.length}</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.detailLabel}>Arama</Text>
                  <Text style={styles.detailValue}>
                    {search.trim() ? `"${search.trim()}"` : "Tum paketler"}
                  </Text>
                </View>
              </View>
            </Card>
          }
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={`${item.code} • ${item.items?.length ?? 0} kalem`}
              caption={item.description ?? "Aciklama yok"}
              badgeLabel={item.isActive === false ? "pasif" : "aktif"}
              badgeTone={item.isActive === false ? "neutral" : "positive"}
              onPress={() => onPackagePress(item.id)}
              icon={
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={20}
                  color={mobileTheme.colors.brand.primary}
                />
              }
            />
          )}
          ListEmptyComponent={
            error ? (
              <EmptyStateWithAction
                title="Paket listesi yuklenemedi."
                subtitle="Baglanti problemi olabilir. Listeyi yeniden sorgula."
                actionLabel="Tekrar dene"
                onAction={onFetchPackages}
              />
            ) : (
              <EmptyStateWithAction
                title={hasFilters ? "Filtreye uygun paket yok." : "Paket bulunamadi."}
                subtitle={
                  hasFilters
                    ? "Aramayi temizleyip durum filtresini genislet."
                    : "Toptan satis akisi icin yeni paket olusturabilirsin."
                }
                actionLabel={
                  hasFilters ? "Filtreyi temizle" : canCreate ? "Yeni paket" : "Listeyi yenile"
                }
                onAction={() => {
                  if (hasFilters) {
                    onResetFiltersWithTracking();
                    return;
                  }
                  if (canCreate) {
                    onCreatePress();
                    return;
                  }
                  onFetchPackages();
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
            label="Yeni paket"
            onPress={onCreatePress}
            icon={<MaterialCommunityIcons name="plus-circle-outline" size={16} color="#FFFFFF" />}
          />
        ) : (
          <Button label="Listeyi yenile" onPress={onFetchPackages} variant="secondary" />
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
    paddingBottom: 12,
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
