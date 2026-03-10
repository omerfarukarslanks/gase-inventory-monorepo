import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import {
  Card,
  EmptyStateWithAction,
  ListRow,
  SectionTitle,
  SkeletonBlock,
} from "@/src/components/ui";
import { trackEvent } from "@/src/lib/analytics";
import { formatCount, formatCurrency, formatDate } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";
import type { StockFocusSeed } from "@/src/lib/workflows";
import type { DashboardState } from "../hooks/useDashboardData";

type Props = {
  state: DashboardState;
  onOpenSalesComposer?: () => void;
  onOpenSaleDetail?: (saleId: string) => void;
  onOpenStockFocus?: (seed: StockFocusSeed) => void;
};

const brand = mobileTheme.colors.brand;

export function DashboardRecentSection({
  state,
  onOpenSalesComposer,
  onOpenSaleDetail,
  onOpenStockFocus,
}: Props) {
  return (
    <Card>
      <SectionTitle title="Is listesi" />
      {state.loading ? (
        <View style={styles.loadingList}>
          <SkeletonBlock height={72} />
          <SkeletonBlock height={72} />
          <SkeletonBlock height={72} />
        </View>
      ) : state.pendingCollections.length || state.lowStock.length || state.cancellations.length ? (
        <View style={styles.list}>
          {state.pendingCollections.slice(0, 2).map((item) => (
            <ListRow
              key={`collection-${item.id}`}
              title={item.receiptNo ?? item.id}
              subtitle={`${item.name ?? "-"} ${item.surname ?? ""}`.trim()}
              caption={`${formatCurrency(item.remainingAmount, item.currency ?? "TRY")} tahsil edilecek • ${formatDate(item.createdAt)}`}
              badgeLabel="Tahsilat"
              badgeTone="info"
              onPress={item.id ? () => onOpenSaleDetail?.(item.id) : undefined}
              icon={<MaterialCommunityIcons name="cash-fast" size={20} color={brand.primary} />}
            />
          ))}

          {state.lowStock.slice(0, 3).map((item) => (
            <ListRow
              key={`${item.productVariantId}-${item.storeName}`}
              title={item.variantName ?? item.productName ?? "Dusuk stok"}
              subtitle={`${item.storeName ?? "Tum magazalar"} icin stok kritik seviyede`}
              caption={`Kalan miktar: ${formatCount(item.quantity)} adet`}
              badgeLabel="Oncelikli"
              badgeTone="warning"
              onPress={
                item.productVariantId
                  ? () => onOpenStockFocus?.({
                      productVariantId: item.productVariantId,
                      productName: item.productName ?? undefined,
                      variantName: item.variantName ?? undefined,
                      operation: "receive",
                    })
                  : undefined
              }
              icon={<MaterialCommunityIcons name="alert-outline" size={20} color={brand.warning} />}
            />
          ))}

          {state.cancellations.slice(0, 2).map((item) => {
            const saleId = item.id;
            return (
              <ListRow
                key={item.id ?? item.receiptNo}
                title={item.receiptNo ?? "Iptal edilen fis"}
                subtitle={`${item.name ?? "-"} ${item.surname ?? ""}`.trim()}
                caption={`${formatDate(item.cancelledAt ?? item.createdAt)} • ${formatCurrency(item.lineTotal ?? item.unitPrice, "TRY")}`}
                badgeLabel="Incele"
                badgeTone="danger"
                onPress={saleId ? () => onOpenSaleDetail?.(saleId) : undefined}
                icon={<MaterialCommunityIcons name="close-circle-outline" size={20} color={brand.error} />}
              />
            );
          })}
        </View>
      ) : (
        <EmptyStateWithAction
          title="Bugun icin oncelikli aksiyon yok."
          subtitle="Operasyon sakin. Yeni satis baslatabilir veya urun listesini kontrol edebilirsin."
          actionLabel="Yeni satis baslat"
          onAction={() => {
            trackEvent("empty_state_action_clicked", { screen: "dashboard", target: "sale" });
            onOpenSalesComposer?.();
          }}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  loadingList: {
    marginTop: 12,
    gap: 12,
  },
  list: {
    marginTop: 12,
    gap: 12,
  },
});
