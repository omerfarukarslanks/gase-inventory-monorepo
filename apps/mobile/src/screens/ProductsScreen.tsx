import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getProductById,
  getProductVariants,
  getProducts,
  type Product,
  type ProductVariant,
} from "@gase/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
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
  StatusBadge,
  StickyActionBar,
} from "@/src/components/ui";
import { trackEvent } from "@/src/lib/analytics";
import type { SalesDraftSeed, StockFocusSeed } from "@/src/lib/workflows";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { formatCurrency } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";

type StatusFilter = "all" | "true" | "false";

type ProductDetailState = {
  loading: boolean;
  product: Product | null;
  variants: ProductVariant[];
};

type ProductsScreenProps = {
  isActive?: boolean;
  onOpenSalesDraft?: (seed?: SalesDraftSeed) => void;
  onOpenStockFocus?: (seed: StockFocusSeed) => void;
};

const statusOptions = [
  { label: "Tum", value: "all" as const },
  { label: "Aktif", value: "true" as const },
  { label: "Pasif", value: "false" as const },
];

const initialDetail: ProductDetailState = {
  loading: false,
  product: null,
  variants: [],
};

export default function ProductsScreen({
  isActive = true,
  onOpenSalesDraft,
  onOpenStockFocus,
}: ProductsScreenProps = {}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProductDetailState>(initialDetail);
  const debouncedSearch = useDebouncedValue(search, 350);
  const activeFilterLabel = useMemo(() => {
    if (statusFilter === "true") return "Aktif urunler";
    if (statusFilter === "false") return "Pasif urunler";
    return "Tum urunler";
  }, [statusFilter]);
  const hasProductFilters = Boolean(search.trim() || statusFilter !== "all");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getProducts({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
        isActive: statusFilter === "all" ? "all" : statusFilter === "true",
      });
      setProducts(response.data ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Urunler yuklenemedi.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    if (!isActive) return;
    void fetchProducts();
  }, [fetchProducts, isActive]);

  const openProduct = async (productId: string) => {
    setError("");
    setSelectedId(productId);
    setDetail({ loading: true, product: null, variants: [] });

    try {
      const [product, variants] = await Promise.all([
        getProductById(productId),
        getProductVariants(productId, { isActive: "all" }),
      ]);
      setDetail({ loading: false, product, variants });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Urun detayi getirilemedi.");
      setDetail({ loading: false, product: null, variants: [] });
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  if (selectedId) {
    return (
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.screenContent}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader
            title={detail.product?.name ?? "Urun detayi"}
            subtitle="Varyantlari incele ve ilgili operasyona gec"
            onBack={() => {
              setSelectedId(null);
              setDetail(initialDetail);
            }}
          />

          {error ? <Banner text={error} /> : null}

          {detail.loading ? (
            <View style={styles.loadingList}>
              <SkeletonBlock height={110} />
              <SkeletonBlock height={88} />
              <SkeletonBlock height={88} />
            </View>
          ) : detail.product ? (
            <>
              <Card>
                <SectionTitle title="Urun ozeti" />
                <View style={styles.detailStats}>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>SKU</Text>
                    <Text style={styles.detailValue}>{detail.product.sku}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Satis fiyati</Text>
                    <Text style={styles.detailValue}>
                      {formatCurrency(detail.product.unitPrice, detail.product.currency)}
                    </Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Alis fiyati</Text>
                    <Text style={styles.detailValue}>
                      {formatCurrency(detail.product.purchasePrice, detail.product.currency)}
                    </Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Kategori</Text>
                    <Text style={styles.detailValue}>{detail.product.category?.name ?? "-"}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Tedarikci</Text>
                    <Text style={styles.detailValue}>{detail.product.supplier?.name ?? "-"}</Text>
                  </View>
                </View>
              </Card>

              <Card>
                <SectionTitle
                  title={`Varyantlar (${detail.variants.length})`}
                  action={
                    <Button
                      label="Listeye don"
                      onPress={() => {
                        setSelectedId(null);
                        setDetail(initialDetail);
                      }}
                      variant="ghost"
                      size="sm"
                      fullWidth={false}
                    />
                  }
                />
                <View style={styles.variantList}>
                  {detail.variants.length ? (
                    detail.variants.map((variant) => (
                      <Card key={variant.id} style={styles.variantCard}>
                        <View style={styles.variantHeader}>
                          <View style={styles.variantCopy}>
                            <Text style={styles.variantTitle}>{variant.name}</Text>
                            <Text style={styles.variantMeta}>
                              Kod: {variant.code ?? "-"} • {formatCurrency(variant.unitPrice ?? detail.product?.unitPrice, detail.product?.currency ?? "TRY")}
                            </Text>
                          </View>
                          <StatusBadge
                            label={variant.isActive === false ? "pasif" : "aktif"}
                            tone={variant.isActive === false ? "neutral" : "positive"}
                          />
                        </View>

                        <View style={styles.variantActions}>
                          <Button
                            label="Satisa ekle"
                            variant="secondary"
                            icon={<MaterialCommunityIcons name="cart-plus" size={16} color={mobileTheme.colors.dark.text} />}
                            onPress={() => {
                              trackEvent("sale_started", { source: "product_detail", variantId: variant.id });
                              onOpenSalesDraft?.({
                                variantId: variant.id,
                                variantLabel: variant.name,
                                unitPrice: String(variant.unitPrice ?? detail.product?.unitPrice ?? ""),
                                currency: detail.product?.currency ?? "TRY",
                              });
                            }}
                          />
                          <Button
                            label="Stokta ac"
                            variant="ghost"
                            icon={<MaterialCommunityIcons name="warehouse" size={16} color={mobileTheme.colors.dark.text} />}
                            onPress={() => {
                              onOpenStockFocus?.({
                                productId: detail.product?.id,
                                productName: detail.product?.name,
                                productVariantId: variant.id,
                                variantName: variant.name,
                              });
                            }}
                          />
                        </View>
                      </Card>
                    ))
                  ) : (
                    <EmptyStateWithAction
                      title="Varyant bulunamadi."
                      subtitle="Urun varyanti olusturuldugunda burada gorunecek."
                      actionLabel="Listeye don"
                      onAction={() => setSelectedId(null)}
                    />
                  )}
                </View>
              </Card>
            </>
          ) : (
            <EmptyStateWithAction
              title={error ? "Detay getirilemedi." : "Urun detayi bulunamadi."}
              subtitle={
                error
                  ? "Baglanti veya servis hatasi olabilir. Urun detayini yeniden dene."
                  : "Listeye donup farkli bir urun sec."
              }
              actionLabel={error ? "Tekrar dene" : "Listeye don"}
              onAction={() => {
                if (selectedId && error) {
                  void openProduct(selectedId);
                  return;
                }
                setSelectedId(null);
              }}
            />
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <ScreenHeader
          title="Urunler"
          subtitle="Barkod, SKU veya urun adina gore ara"
          action={<Button label="Yenile" onPress={() => void fetchProducts()} variant="secondary" size="sm" fullWidth={false} />}
        />

        {error ? <Banner text={error} /> : null}

        <Card>
          <View style={styles.filterStack}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Barkod, SKU veya urun ara"
              hint="Scan-first akisina hazir: barkod ve SKU aramasi ayni giriste toplanacak."
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
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
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
          }
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={`SKU: ${item.sku}`}
              caption={`${formatCurrency(item.unitPrice, item.currency)} • ${item.category?.name ?? "Kategori yok"}`}
              badgeLabel={`${item.variantCount ?? item.variants?.length ?? 0} varyant`}
              badgeTone={item.isActive === false ? "neutral" : "positive"}
              onPress={() => void openProduct(item.id)}
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
            error ? (
              <EmptyStateWithAction
                title="Urun listesi yuklenemedi."
                subtitle="Servis yaniti alinmadi. Listeyi yeniden sorgula."
                actionLabel="Tekrar dene"
                onAction={() => void fetchProducts()}
              />
            ) : (
              <EmptyStateWithAction
                title={hasProductFilters ? "Filtreye uygun urun yok." : "Urun bulunamadi."}
                subtitle={
                  hasProductFilters
                    ? "Aramayi temizleyip aktif/pasif filtresini genislet."
                    : "Liste bos. Veri geldiginde burada urunler gorunecek."
                }
                actionLabel={hasProductFilters ? "Filtreyi temizle" : "Listeyi yenile"}
                onAction={() => {
                  if (hasProductFilters) {
                    trackEvent("empty_state_action_clicked", {
                      screen: "products",
                      target: "reset_filters",
                    });
                    resetFilters();
                    return;
                  }
                  void fetchProducts();
                }}
              />
            )
          }
        />
      )}

      <StickyActionBar>
        <Button label="Filtreyi temizle" onPress={resetFilters} variant="ghost" />
        <Button label="Listeyi yenile" onPress={() => void fetchProducts()} variant="secondary" />
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
  variantList: {
    marginTop: 12,
    gap: 12,
  },
  variantCard: {
    gap: 14,
  },
  variantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  variantCopy: {
    flex: 1,
    gap: 4,
  },
  variantTitle: {
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
  variantMeta: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
    lineHeight: 17,
  },
  variantActions: {
    gap: 10,
  },
});
