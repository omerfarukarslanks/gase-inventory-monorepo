import {
  getProductById,
  getProductVariants,
  getProducts,
  type Product,
  type ProductVariant,
} from "@gase/core";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import {
  AppScreen,
  Banner,
  Button,
  Card,
  EmptyState,
  FilterTabs,
  ModalSheet,
  SectionTitle,
  StatusBadge,
  TextField,
} from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { formatCurrency } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";

type StatusFilter = "all" | "true" | "false";

const statusOptions = [
  { label: "Tum", value: "all" as const },
  { label: "Aktif", value: "true" as const },
  { label: "Pasif", value: "false" as const },
];

type ProductDetailState = {
  loading: boolean;
  product: Product | null;
  variants: ProductVariant[];
};

export default function ProductsScreen() {
  const { signOut } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProductDetailState>({
    loading: false,
    product: null,
    variants: [],
  });
  const debouncedSearch = useDebouncedValue(search, 350);

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
    void fetchProducts();
  }, [fetchProducts]);

  const openProduct = async (productId: string) => {
    setSelectedId(productId);
    setDetail({ loading: true, product: null, variants: [] });
    try {
      const [product, variants] = await Promise.all([
        getProductById(productId),
        getProductVariants(productId, { isActive: "all" }),
      ]);
      setDetail({ loading: false, product, variants });
    } catch {
      setDetail({ loading: false, product: null, variants: [] });
    }
  };

  return (
    <AppScreen
      title="Urunler"
      subtitle="Liste, filtreleme ve varyant gorunumu"
      action={<Button label="Cikis" onPress={() => void signOut()} variant="ghost" />}
    >
      {error ? <Banner text={error} /> : null}

      <Card>
        <View style={styles.filterStack}>
          <TextField
            label="Ara"
            value={search}
            onChangeText={setSearch}
            placeholder="Urun adi veya SKU"
          />
          <FilterTabs value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
        </View>
      </Card>

      <Card>
        <SectionTitle title={`Liste (${products.length})`} action={<Button label="Yenile" onPress={() => void fetchProducts()} variant="secondary" />} />
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={mobileTheme.colors.brand.primary} />
          </View>
        ) : products.length ? (
          <View style={styles.list}>
            {products.map((product) => (
              <Pressable key={product.id} style={styles.productRow} onPress={() => void openProduct(product.id)}>
                <View style={styles.productCopy}>
                  <Text style={styles.productTitle}>{product.name}</Text>
                  <Text style={styles.productMeta}>
                    SKU: {product.sku} • {formatCurrency(product.unitPrice, product.currency)}
                  </Text>
                </View>
                <StatusBadge
                  label={`${product.variantCount ?? product.variants?.length ?? 0} varyant`}
                  tone={product.isActive === false ? "neutral" : "positive"}
                />
              </Pressable>
            ))}
          </View>
        ) : (
          <EmptyState title="Urun bulunamadi." subtitle="Filtreleri degistirip tekrar dene." />
        )}
      </Card>

      <ModalSheet
        visible={Boolean(selectedId)}
        title={detail.product?.name ?? "Urun detayi"}
        subtitle={detail.product?.description ?? "Urun ve varyant bilgileri"}
        onClose={() => setSelectedId(null)}
      >
        {detail.loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={mobileTheme.colors.brand.primary} />
          </View>
        ) : detail.product ? (
          <>
            <Card>
              <View style={styles.detailGrid}>
                <View style={styles.detailStat}>
                  <Text style={styles.detailLabel}>SKU</Text>
                  <Text style={styles.detailValue}>{detail.product.sku}</Text>
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailLabel}>Satis</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(detail.product.unitPrice, detail.product.currency)}
                  </Text>
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailLabel}>Alis</Text>
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
              <SectionTitle title={`Varyantlar (${detail.variants.length})`} />
              {detail.variants.length ? (
                <View style={styles.list}>
                  {detail.variants.map((variant) => (
                    <View key={variant.id} style={styles.variantRow}>
                      <View style={styles.productCopy}>
                        <Text style={styles.productTitle}>{variant.name}</Text>
                        <Text style={styles.productMeta}>
                          Kod: {variant.code} • {formatCurrency(variant.unitPrice ?? detail.product?.unitPrice, detail.product?.currency ?? "TRY")}
                        </Text>
                      </View>
                      <StatusBadge
                        label={variant.isActive === false ? "pasif" : "aktif"}
                        tone={variant.isActive === false ? "neutral" : "positive"}
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyState title="Varyant bulunamadi." />
              )}
            </Card>
          </>
        ) : (
          <EmptyState title="Detay getirilemedi." />
        )}
      </ModalSheet>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  filterStack: {
    gap: 12,
  },
  loadingWrap: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    marginTop: 12,
    gap: 12,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: mobileTheme.colors.dark.border,
    backgroundColor: mobileTheme.colors.dark.surface2,
    padding: 14,
  },
  variantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: mobileTheme.colors.dark.border,
    backgroundColor: mobileTheme.colors.dark.surface2,
    padding: 14,
  },
  productCopy: {
    flex: 1,
    gap: 4,
  },
  productTitle: {
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
  productMeta: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
    lineHeight: 17,
  },
  detailGrid: {
    gap: 12,
  },
  detailStat: {
    gap: 4,
  },
  detailLabel: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
    fontWeight: "600",
  },
  detailValue: {
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
});
