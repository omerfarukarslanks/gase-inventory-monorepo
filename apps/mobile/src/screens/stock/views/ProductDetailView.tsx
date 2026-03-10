import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  type InventoryProductStockItem,
  type InventoryVariantStockItem,
} from "@gase/core";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Banner,
  Card,
  EmptyStateWithAction,
  ListRow,
  SectionTitle,
  ScreenHeader,
} from "@/src/components/ui";
import { formatCount } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";

const LOW_STOCK_THRESHOLD = 50;

type ProductDetailViewProps = {
  selectedProduct: InventoryProductStockItem;
  error: string;
  onBack: () => void;
  onVariantPress: (product: InventoryProductStockItem, variant: InventoryVariantStockItem) => void;
};

export function ProductDetailView({
  selectedProduct,
  error,
  onBack,
  onVariantPress,
}: ProductDetailViewProps) {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <ScreenHeader
          title={selectedProduct.productName}
          subtitle="Varyant sec ve stok operasyonuna gec"
          onBack={onBack}
        />

        {error ? <Banner text={error} /> : null}

        <Card>
          <SectionTitle title="Urun ozeti" />
          <View style={styles.detailStats}>
            <View style={styles.detailStat}>
              <Text style={styles.detailLabel}>Toplam stok</Text>
              <Text style={styles.detailValue}>{formatCount(selectedProduct.totalQuantity)} adet</Text>
            </View>
            <View style={styles.detailStat}>
              <Text style={styles.detailLabel}>Varyant sayisi</Text>
              <Text style={styles.detailValue}>{formatCount(selectedProduct.variants?.length ?? 0)}</Text>
            </View>
          </View>
        </Card>

        <Card>
          <SectionTitle title="Varyantlar" />
          <View style={styles.variantList}>
            {(selectedProduct.variants ?? []).length ? (
              (selectedProduct.variants ?? []).map((variant) => (
                <ListRow
                  key={variant.productVariantId}
                  title={variant.variantName}
                  subtitle={`${formatCount(variant.totalQuantity)} adet`}
                  caption={`Kod: ${variant.variantCode ?? "-"}`}
                  badgeLabel={
                    Number(variant.totalQuantity ?? 0) <= LOW_STOCK_THRESHOLD
                      ? "Dusuk stok"
                      : "Normal"
                  }
                  badgeTone={
                    Number(variant.totalQuantity ?? 0) <= LOW_STOCK_THRESHOLD
                      ? "warning"
                      : "positive"
                  }
                  onPress={() => onVariantPress(selectedProduct, variant)}
                  icon={<MaterialCommunityIcons name="barcode" size={20} color={mobileTheme.colors.brand.primary} />}
                />
              ))
            ) : (
              <EmptyStateWithAction
                title="Varyant bulunamadi."
                subtitle="Bu urunde stok islenebilir varyant yok."
                actionLabel="Listeye don"
                onAction={onBack}
              />
            )}
          </View>
        </Card>
      </ScrollView>
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
});
