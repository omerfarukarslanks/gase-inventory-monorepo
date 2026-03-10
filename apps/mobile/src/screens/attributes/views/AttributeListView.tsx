import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type Attribute } from "@gase/core";
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
import { formatDate } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";

type StatusFilter = "all" | "true" | "false";

const statusOptions = [
  { label: "Tum", value: "all" as const },
  { label: "Aktif", value: "true" as const },
  { label: "Pasif", value: "false" as const },
];

type AttributeListViewProps = {
  search: string;
  statusFilter: StatusFilter;
  attributes: Attribute[];
  loading: boolean;
  error: string;
  activeFilterLabel: string;
  hasFilters: boolean;
  canCreate: boolean;
  onBack?: () => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onAttributePress: (attributeId: string) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  onCreatePress: () => void;
};

export function AttributeListView({
  search,
  statusFilter,
  attributes,
  loading,
  error,
  activeFilterLabel,
  hasFilters,
  canCreate,
  onBack,
  onSearchChange,
  onStatusFilterChange,
  onAttributePress,
  onResetFilters,
  onRefresh,
  onCreatePress,
}: AttributeListViewProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <ScreenHeader
          title="Ozellikler"
          subtitle="Urun varyantlari icin tanim setini mobilde yonet"
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
              placeholder="Ozellik adi ara"
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
          data={attributes}
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
                  <Text style={styles.detailValue}>{attributes.length}</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.detailLabel}>Arama</Text>
                  <Text style={styles.detailValue}>
                    {search.trim() ? `"${search.trim()}"` : "Tum ozellikler"}
                  </Text>
                </View>
              </View>
            </Card>
          }
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={`${item.values?.length ?? 0} deger • ${formatDate(item.updatedAt)}`}
              caption={
                item.values?.length
                  ? item.values
                      .slice(0, 3)
                      .map((value) => value.name)
                      .filter(Boolean)
                      .join(", ")
                  : "Henuz deger yok"
              }
              badgeLabel={item.isActive ? "aktif" : "pasif"}
              badgeTone={item.isActive ? "positive" : "neutral"}
              onPress={() => onAttributePress(item.id)}
              icon={
                <MaterialCommunityIcons
                  name="tune-variant"
                  size={20}
                  color={mobileTheme.colors.brand.primary}
                />
              }
            />
          )}
          ListEmptyComponent={
            error ? (
              <EmptyStateWithAction
                title="Ozellik listesi yuklenemedi."
                subtitle="Baglanti problemi olabilir. Listeyi yeniden sorgula."
                actionLabel="Tekrar dene"
                onAction={onRefresh}
              />
            ) : (
              <EmptyStateWithAction
                title={hasFilters ? "Filtreye uygun ozellik yok." : "Ozellik bulunamadi."}
                subtitle={
                  hasFilters
                    ? "Aramayi temizleyip durum filtresini genislet."
                    : "Yeni ozellik ekleyerek varyant tanimlarini mobilde de acabilirsin."
                }
                actionLabel={hasFilters ? "Filtreyi temizle" : canCreate ? "Yeni ozellik" : "Listeyi yenile"}
                onAction={() => {
                  if (hasFilters) {
                    trackEvent("empty_state_action_clicked", {
                      screen: "attributes",
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
            label="Yeni ozellik"
            onPress={onCreatePress}
            icon={<MaterialCommunityIcons name="plus-circle-outline" size={16} color="#FFFFFF" />}
          />
        ) : (
          <Button label="Listeyi yenile" onPress={onRefresh} variant="secondary" />
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
