import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Customer } from "@gase/core";
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
import { formatCount } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";

type StatusFilter = "all" | "true" | "false";

const statusOptions = [
  { label: "Tum", value: "all" as const },
  { label: "Aktif", value: "true" as const },
  { label: "Pasif", value: "false" as const },
];

type CustomerListViewProps = {
  search: string;
  setSearch: (value: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
  customers: Customer[];
  loading: boolean;
  error: string;
  activeFilterLabel: string;
  hasCustomerFilters: boolean;
  fetchCustomers: () => Promise<void>;
  openCustomer: (customer: Customer) => Promise<void>;
  resetFilters: () => void;
  openComposerModal: () => void;
};

export function CustomerListView({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  customers,
  loading,
  error,
  activeFilterLabel,
  hasCustomerFilters,
  fetchCustomers,
  openCustomer,
  resetFilters,
  openComposerModal,
}: CustomerListViewProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <ScreenHeader
          title="Musteriler"
          subtitle="Arama, hizli olusturma ve satisa gecis"
          action={<Button label="Yenile" onPress={() => void fetchCustomers()} variant="secondary" size="sm" fullWidth={false} />}
        />

        {error ? <Banner text={error} /> : null}

        <Card>
          <View style={styles.filterStack}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Ad, soyad veya telefon ara"
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
          data={customers}
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
                  <Text style={styles.detailValue}>{formatCount(customers.length)}</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.detailLabel}>Arama</Text>
                  <Text style={styles.detailValue}>
                    {search.trim() ? `"${search.trim()}"` : "Tum musteriler"}
                  </Text>
                </View>
              </View>
            </Card>
          }
          renderItem={({ item }) => (
            <ListRow
              title={`${item.name} ${item.surname}`.trim()}
              subtitle={item.phoneNumber ?? item.email ?? "Iletisim bilgisi yok"}
              caption={item.isActive === false ? "Pasif kayit" : "Aktif musteri"}
              badgeLabel="Detay"
              badgeTone="info"
              onPress={() => void openCustomer(item)}
              icon={<MaterialCommunityIcons name="account-outline" size={20} color={mobileTheme.colors.brand.primary} />}
            />
          )}
          ListEmptyComponent={
            error ? (
              <EmptyStateWithAction
                title="Musteri listesi yuklenemedi."
                subtitle="Baglanti problemi olabilir. Listeyi yeniden sorgula."
                actionLabel="Tekrar dene"
                onAction={() => void fetchCustomers()}
              />
            ) : (
              <EmptyStateWithAction
                title={hasCustomerFilters ? "Filtreye uygun musteri yok." : "Musteri bulunamadi."}
                subtitle={
                  hasCustomerFilters
                    ? "Aramayi temizle veya durum filtresini genislet."
                    : "Yeni musteri olusturarak satis akisini hizlandirabilirsin."
                }
                actionLabel={hasCustomerFilters ? "Filtreyi temizle" : "Yeni musteri"}
                onAction={() => {
                  if (hasCustomerFilters) {
                    trackEvent("empty_state_action_clicked", {
                      screen: "customers",
                      target: "reset_filters",
                    });
                    resetFilters();
                    return;
                  }
                  trackEvent("empty_state_action_clicked", {
                    screen: "customers",
                    target: "create_customer",
                  });
                  openComposerModal();
                }}
              />
            )
          }
        />
      )}

      <StickyActionBar>
        <Button label="Filtreyi temizle" onPress={resetFilters} variant="ghost" />
        <Button
          label="Yeni musteri"
          onPress={openComposerModal}
          icon={<MaterialCommunityIcons name="account-plus-outline" size={16} color="#FFFFFF" />}
        />
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
  summaryStats: {
    marginTop: 12,
    gap: 12,
  },
  summaryStat: {
    gap: 4,
  },
});
