import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type User } from "@gase/core";
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
import type { StatusFilter } from "../hooks/useUserList";

const statusOptions = [
  { label: "Tum", value: "all" as const },
  { label: "Aktif", value: "true" as const },
  { label: "Pasif", value: "false" as const },
];

type UserListViewProps = {
  users: User[];
  loading: boolean;
  error: string;
  search: string;
  setSearch: (value: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
  activeFilterLabel: string;
  hasFilters: boolean;
  canCreate: boolean;
  onBack?: () => void;
  onUserPress: (userId: string) => void;
  onCreatePress: () => void;
  onResetFilters: () => void;
  onRefresh: () => void;
};

export function UserListView({
  users,
  loading,
  error,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  activeFilterLabel,
  hasFilters,
  canCreate,
  onBack,
  onUserPress,
  onCreatePress,
  onResetFilters,
  onRefresh,
}: UserListViewProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <ScreenHeader
          title="Kullanicilar"
          subtitle="Rol ve magaza kapsamini mobilde yonet"
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
              onChangeText={setSearch}
              placeholder="Ad, soyad veya e-posta ara"
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
          data={users}
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
                  <Text style={styles.detailValue}>{users.length}</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.detailLabel}>Arama</Text>
                  <Text style={styles.detailValue}>
                    {search.trim() ? `"${search.trim()}"` : "Tum kullanicilar"}
                  </Text>
                </View>
              </View>
            </Card>
          }
          renderItem={({ item }) => (
            <ListRow
              title={`${item.name} ${item.surname}`.trim()}
              subtitle={item.email}
              caption={
                item.userStores?.length
                  ? item.userStores.map((entry) => entry.store.name).join(", ")
                  : "Magaza atamasi yok"
              }
              badgeLabel={item.isActive === false ? "pasif" : item.role.toLowerCase()}
              badgeTone={item.isActive === false ? "neutral" : "info"}
              onPress={() => onUserPress(item.id)}
              icon={
                <MaterialCommunityIcons
                  name="account-badge-outline"
                  size={20}
                  color={mobileTheme.colors.brand.primary}
                />
              }
            />
          )}
          ListEmptyComponent={
            error ? (
              <EmptyStateWithAction
                title="Kullanici listesi yuklenemedi."
                subtitle="Baglanti problemi olabilir. Listeyi yeniden sorgula."
                actionLabel="Tekrar dene"
                onAction={onRefresh}
              />
            ) : (
              <EmptyStateWithAction
                title={hasFilters ? "Filtreye uygun kullanici yok." : "Kullanici bulunamadi."}
                subtitle={
                  hasFilters
                    ? "Aramayi temizleyip durum filtresini genislet."
                    : "Yeni kullanici ekleyerek rol ve operasyon kapsamlarini yonetebilirsin."
                }
                actionLabel={hasFilters ? "Filtreyi temizle" : canCreate ? "Yeni kullanici" : "Listeyi yenile"}
                onAction={() => {
                  if (hasFilters) {
                    trackEvent("empty_state_action_clicked", {
                      screen: "users",
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
            label="Yeni kullanici"
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
