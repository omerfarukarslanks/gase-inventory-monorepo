import { FlatList, StyleSheet, View } from "react-native";
import { type Unit } from "@gase/core";
import {
  Banner,
  EmptyStateWithAction,
  FilterTabs,
  ListRow,
  ScreenHeader,
  SearchBar,
  SkeletonBlock,
  StickyActionBar,
  Button,
} from "@/src/components/ui";
import { mobileTheme } from "@/src/theme";

type StatusFilter = "all" | "active" | "passive";

const statusOptions = [
  { label: "Tum", value: "all" as const },
  { label: "Aktif", value: "active" as const },
  { label: "Pasif", value: "passive" as const },
];

type UnitListViewProps = {
  search: string;
  statusFilter: StatusFilter;
  units: Unit[];
  loading: boolean;
  error: string;
  activeFilterLabel: string;
  hasFilters: boolean;
  canCreate: boolean;
  onBack?: () => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onUnitPress: (unitId: string) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  onCreatePress: () => void;
};

export function UnitListView({
  search,
  statusFilter,
  units,
  loading,
  error,
  activeFilterLabel,
  hasFilters,
  canCreate,
  onBack,
  onSearchChange,
  onStatusFilterChange,
  onUnitPress,
  onResetFilters,
  onRefresh,
  onCreatePress,
}: UnitListViewProps) {
  const colors = mobileTheme.colors.dark;

  return (
    <View style={styles.container}>
      <FlatList
        data={loading ? [] : units}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader title="Birimler" subtitle="Ölçü birimi yönetimi" onBack={onBack} />
            {error ? <Banner text={error} /> : null}
            <SearchBar
              value={search}
              onChangeText={onSearchChange}
              placeholder="Birim ara..."
            />
            <FilterTabs
              options={statusOptions}
              selected={statusFilter}
              onSelect={onStatusFilterChange}
            />
            {hasFilters && (
              <View style={styles.filterRow}>
                <SkeletonBlock height={0} />
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.name}
            subtitle={item.abbreviation}
            caption={item.isDefault ? "Varsayılan birim" : undefined}
            badgeLabel={item.isActive ? "aktif" : "pasif"}
            badgeTone={item.isActive ? "positive" : "neutral"}
            onPress={() => onUnitPress(item.id)}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonList}>
              <SkeletonBlock height={64} />
              <SkeletonBlock height={64} />
              <SkeletonBlock height={64} />
            </View>
          ) : (
            <EmptyStateWithAction
              title={hasFilters ? "Filtrele uygun birim yok." : "Henüz birim eklenmemiş."}
              subtitle={hasFilters ? "Filtreleri temizleyerek tüm birimleri görebilirsiniz." : "Yeni birim eklemek için butona dokunun."}
              actionLabel={hasFilters ? "Filtreleri temizle" : (canCreate ? "Yeni birim" : undefined)}
              onAction={hasFilters ? onResetFilters : (canCreate ? onCreatePress : undefined)}
            />
          )
        }
        onRefresh={onRefresh}
        refreshing={loading}
      />

      <StickyActionBar>
        {hasFilters && (
          <Button label={`Filtre: ${activeFilterLabel}`} onPress={onResetFilters} variant="ghost" />
        )}
        {canCreate && (
          <Button label="Yeni birim" onPress={onCreatePress} variant="primary" />
        )}
      </StickyActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: mobileTheme.colors.dark.bg },
  content: { paddingHorizontal: 20, paddingBottom: 100, gap: 8 },
  header: { gap: 12, paddingTop: 20, paddingBottom: 8 },
  filterRow: { flexDirection: "row", gap: 8 },
  skeletonList: { gap: 8, paddingTop: 8 },
});
