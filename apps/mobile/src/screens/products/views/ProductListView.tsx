import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Product } from "@gase/core";
import { FlatList, StyleSheet, Text, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  FilterTabs,
  ListRow,
  SearchBar,
  SectionTitle,
  SkeletonBlock,
  StickyActionBar,
} from "@/src/components/ui";
import { trackEvent } from "@/src/lib/analytics";
import { formatCurrency } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";
import { statusOptions } from "../hooks/useProductList";

type StatusFilter = "all" | "true" | "false";

type ProductListViewProps = {
  search: string;
  onChangeSearch: (value: string) => void;
  statusFilter: StatusFilter;
  onChangeStatusFilter: (value: StatusFilter) => void;
  products: Product[];
  loading: boolean;
  error: string;
  activeFilterLabel: string;
  hasFilters: boolean;
  onOpenProduct: (id: string) => void;
  onFetchProducts: () => void;
  onResetFilters: () => void;
};

export function ProductListView({
  search,
  onChangeSearch,
  statusFilter,
  onChangeStatusFilter,
  products,
  loading,
  error,
  activeFilterLabel,
  hasFilters,
  onOpenProduct,
  onFetchProducts,
  onResetFilters,
}: ProductListViewProps) {
  return (
    <View style={styles.screen}>
      <FlatList
        data={loading ? [] : products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        onRefresh={onFetchProducts}
        refreshing={loading}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {error ? <Banner text={error} /> : null}

            <SearchBar
              value={search}
              onChangeText={onChangeSearch}
              placeholder="Barkod, SKU veya urun ara"
              hint="Scan-first akisina hazir: barkod ve SKU aramasi ayni giriste toplanacak."
            />
            <FilterTabs
              value={statusFilter}
              options={statusOptions}
              onChange={onChangeStatusFilter}
            />

            <Card>
              <SectionTitle title="Liste baglami" />
              <View style={styles.summaryStats}>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryLabel}>Kapsam</Text>
                  <Text style={styles.summaryValue}>{activeFilterLabel}</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryLabel}>Kayit</Text>
                  <Text style={styles.summaryValue}>{products.length}</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryLabel}>Arama</Text>
                  <Text style={styles.summaryValue}>
                    {search.trim() ? `"${search.trim()}"` : "Tum urunler"}
                  </Text>
                </View>
              </View>
            </Card>

            {loading ? (
              <View style={styles.skeletonGroup}>
                <SkeletonBlock height={82} />
                <SkeletonBlock height={82} />
                <SkeletonBlock height={82} />
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.name}
            subtitle={`SKU: ${item.sku}`}
            caption={`${formatCurrency(item.unitPrice, item.currency)} • ${item.category?.name ?? "Kategori yok"}`}
            badgeLabel={`${item.variantCount ?? item.variants?.length ?? 0} varyant`}
            badgeTone={item.isActive === false ? "neutral" : "positive"}
            onPress={() => onOpenProduct(item.id)}
            icon={
              <MaterialCommunityIcons
                name="package-variant"
                size={20}
                color={mobileTheme.colors.brand.primary}
              />
            }
          />
        )}
        ListEmptyComponent={
          !loading ? (
            error ? (
              <EmptyStateWithAction
                title="Urun listesi yuklenemedi."
                subtitle="Servis yaniti alinmadi. Listeyi yeniden sorgula."
                actionLabel="Tekrar dene"
                onAction={onFetchProducts}
              />
            ) : (
              <EmptyStateWithAction
                title={hasFilters ? "Filtreye uygun urun yok." : "Urun bulunamadi."}
                subtitle={
                  hasFilters
                    ? "Aramayi temizleyip aktif/pasif filtresini genislet."
                    : "Liste bos. Veri geldiginde burada urunler gorunecek."
                }
                actionLabel={hasFilters ? "Filtreyi temizle" : "Listeyi yenile"}
                onAction={() => {
                  if (hasFilters) {
                    trackEvent("empty_state_action_clicked", { screen: "products", target: "reset_filters" });
                    onResetFilters();
                    return;
                  }
                  onFetchProducts();
                }}
              />
            )
          ) : null
        }
      />

      {hasFilters ? (
        <StickyActionBar>
          <Button label="Filtreyi temizle" onPress={onResetFilters} variant="ghost" />
        </StickyActionBar>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: mobileTheme.colors.dark.bg,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  listHeader: {
    paddingTop: 16,
    gap: 12,
    marginBottom: 8,
  },
  skeletonGroup: {
    gap: 12,
    marginTop: 4,
  },
  summaryStats: {
    marginTop: 12,
    gap: 12,
  },
  summaryStat: {
    gap: 4,
  },
  summaryLabel: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  summaryValue: {
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
});
