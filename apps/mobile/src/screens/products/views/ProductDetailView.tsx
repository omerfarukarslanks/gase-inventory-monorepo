import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Product, ProductVariant } from "@gase/core";
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
import { trackEvent } from "@/src/lib/analytics";
import { formatCurrency } from "@/src/lib/format";
import type { SalesDraftSeed, StockFocusSeed } from "@/src/lib/workflows";
import { mobileTheme } from "@/src/theme";
import type { ProductDetailState } from "../hooks/useProductDetail";

type ProductDetailViewProps = {
  detail: ProductDetailState;
  error: string;
  selectedId: string | null;
  onClose: () => void;
  onRetry: (id: string) => void;
  onOpenSalesDraft?: (seed?: SalesDraftSeed) => void;
  onOpenStockFocus?: (seed: StockFocusSeed) => void;
};

export function ProductDetailView({
  detail,
  error,
  selectedId,
  onClose,
  onRetry,
  onOpenSalesDraft,
  onOpenStockFocus,
}: ProductDetailViewProps) {
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.screenContent}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader
          title={detail.product?.name ?? "Urun detayi"}
          subtitle="Varyantlari incele ve ilgili operasyona gec"
          onBack={onClose}
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
                    onPress={onClose}
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
                            Kod: {variant.code ?? "-"} •{" "}
                            {formatCurrency(
                              variant.unitPrice ?? detail.product?.unitPrice,
                              detail.product?.currency ?? "TRY",
                            )}
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
                          icon={
                            <MaterialCommunityIcons
                              name="cart-plus"
                              size={16}
                              color={mobileTheme.colors.dark.text}
                            />
                          }
                          onPress={() => {
                            trackEvent("sale_started", {
                              source: "product_detail",
                              variantId: variant.id,
                            });
                            onOpenSalesDraft?.({
                              variantId: variant.id,
                              variantLabel: variant.name,
                              unitPrice: String(
                                variant.unitPrice ?? detail.product?.unitPrice ?? "",
                              ),
                              currency: detail.product?.currency ?? "TRY",
                            });
                          }}
                        />
                        <Button
                          label="Stokta ac"
                          variant="ghost"
                          icon={
                            <MaterialCommunityIcons
                              name="warehouse"
                              size={16}
                              color={mobileTheme.colors.dark.text}
                            />
                          }
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
                    onAction={onClose}
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
                onRetry(selectedId);
                return;
              }
              onClose();
            }}
          />
        )}
      </ScrollView>

      <StickyActionBar>
        <Button
          label="Stok odak"
          variant="ghost"
          icon={
            <MaterialCommunityIcons
              name="warehouse"
              size={16}
              color={mobileTheme.colors.dark.text}
            />
          }
          onPress={() => {
            if (detail.product) {
              onOpenStockFocus?.({
                productId: detail.product.id,
                productName: detail.product.name,
              });
            }
          }}
        />
        <Button
          label="Satis baslat"
          variant="secondary"
          icon={
            <MaterialCommunityIcons
              name="cart-plus"
              size={16}
              color={mobileTheme.colors.dark.text}
            />
          }
          onPress={() => {
            trackEvent("sale_started", { source: "product_detail_bar" });
            onOpenSalesDraft?.();
          }}
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
    paddingBottom: 120,
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
