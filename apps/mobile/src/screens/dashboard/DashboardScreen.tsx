import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import {
  AppScreen,
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  SectionTitle,
} from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { trackEvent } from "@/src/lib/analytics";
import type { SalesDraftSeed, StockFocusSeed } from "@/src/lib/workflows";
import { formatCount, formatCurrency } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";
import { useDashboardData } from "./hooks/useDashboardData";
import { DashboardMetricsSection } from "./views/DashboardMetricsSection";
import { DashboardRecentSection } from "./views/DashboardRecentSection";

type DashboardScreenProps = {
  isActive?: boolean;
  onOpenSalesComposer?: (seed?: SalesDraftSeed) => void;
  onOpenSaleDetail?: (saleId: string) => void;
  onOpenStockFocus?: (seed: StockFocusSeed) => void;
  onOpenCustomers?: () => void;
  onOpenProducts?: () => void;
};

export default function DashboardScreen({
  isActive = true,
  onOpenCustomers,
  onOpenProducts,
  onOpenSaleDetail,
  onOpenSalesComposer,
  onOpenStockFocus,
}: DashboardScreenProps = {}) {
  const { user } = useAuth();

  const {
    state,
    fetchDashboard,
    pendingCollectionsTotal,
    pendingCollectionCurrency,
    topSeller,
    mostUrgentLowStock,
    nextCollection,
    hasDashboardData,
  } = useDashboardData({ isActive });

  const quickActionButtons = (
    <View style={styles.quickActions}>
      <Button
        label="Yeni satis"
        onPress={() => {
          trackEvent("sale_started", { source: "dashboard" });
          onOpenSalesComposer?.();
        }}
        icon={<MaterialCommunityIcons name="plus-circle-outline" size={16} color="#FFFFFF" />}
      />
      <Button
        label={nextCollection ? "Tahsilat al" : "Musteri ekle"}
        onPress={() => {
          if (nextCollection?.id) {
            onOpenSaleDetail?.(nextCollection.id);
            return;
          }
          onOpenCustomers?.();
        }}
        variant="secondary"
        icon={
          <MaterialCommunityIcons
            name={nextCollection ? "cash-fast" : "account-plus-outline"}
            size={16}
            color={mobileTheme.colors.dark.text}
          />
        }
      />
      <Button
        label={mostUrgentLowStock?.productVariantId ? "Kritik stogu besle" : "Stok kontrol"}
        onPress={() => {
          if (mostUrgentLowStock?.productVariantId) {
            onOpenStockFocus?.({
              productVariantId: mostUrgentLowStock.productVariantId,
              productName: mostUrgentLowStock.productName ?? undefined,
              variantName: mostUrgentLowStock.variantName ?? undefined,
              operation: "receive",
            });
            return;
          }
          onOpenStockFocus?.({});
        }}
        variant="secondary"
        icon={
          <MaterialCommunityIcons
            name={mostUrgentLowStock?.productVariantId ? "alert-box-outline" : "warehouse"}
            size={16}
            color={mobileTheme.colors.dark.text}
          />
        }
      />
      <Button
        label={topSeller?.productVariantId ? "Cok satanla satis" : "Urunleri ac"}
        onPress={() => {
          if (topSeller?.productVariantId) {
            trackEvent("sale_started", { source: "dashboard_top_seller" });
            onOpenSalesComposer?.({
              variantId: topSeller.productVariantId,
              variantLabel: topSeller.variantName ?? topSeller.productName ?? "Varyant",
              unitPrice:
                topSeller.avgUnitPrice != null
                  ? String(topSeller.avgUnitPrice)
                  : undefined,
            });
            return;
          }
          onOpenProducts?.();
        }}
        variant="ghost"
        icon={
          <MaterialCommunityIcons
            name={topSeller?.productVariantId ? "trending-up" : "package-variant-closed"}
            size={16}
            color={mobileTheme.colors.dark.text}
          />
        }
      />
    </View>
  );

  const heroMetrics = [
    {
      key: "satis",
      label: "Haftalik satis",
      value: formatCurrency(state.salesSummary?.totals?.totalLineTotal, "TRY"),
      hint: `Iptal orani %${Number(state.salesSummary?.totals?.cancelRate ?? 0).toFixed(1)}`,
    },
    {
      key: "tahsilat",
      label: "Bekleyen tahsilat",
      value: pendingCollectionsTotal > 0
        ? formatCurrency(pendingCollectionsTotal, pendingCollectionCurrency)
        : "Yok",
      hint: `${state.pendingCollections.length} adet acik fiş`,
    },
    {
      key: "stok",
      label: "Kritik stok",
      value: formatCount(state.lowStock.length),
      hint: state.lowStock.length > 0
        ? (mostUrgentLowStock?.variantName ?? mostUrgentLowStock?.productName ?? "urun kritik")
        : "Stok normal",
    },
  ];

  const detailMetrics = [
    {
      key: "siparis",
      label: "Onayli siparis",
      value: formatCount(state.confirmedOrders?.totals?.orderCount),
      hint: formatCurrency(state.confirmedOrders?.totals?.totalLineTotal, "TRY"),
    },
    {
      key: "iade",
      label: "Iade",
      value: formatCount(state.returns?.totals?.orderCount),
      hint: formatCurrency(state.returns?.totals?.totalLineTotal, "TRY"),
    },
    {
      key: "stok-toplam",
      label: "Toplam stok",
      value: formatCount(state.stockTotal?.totals?.todayTotalQuantity),
      hint: `Degisim %${Number(state.stockTotal?.comparison?.changePercent ?? 0).toFixed(1)}`,
    },
  ];

  if (!state.loading && state.error && !hasDashboardData) {
    return (
      <AppScreen
        title={user?.name ? `Merhaba, ${user.name}` : "Merhaba"}
        subtitle="Bugunun tahsilat, stok ve satis onceliklerini buradan yonet"
        action={<Button label="Yenile" onPress={() => void fetchDashboard()} variant="secondary" size="sm" fullWidth={false} />}
      >
        <Card>
          <SectionTitle title="Hizli aksiyonlar" />
          {quickActionButtons}
        </Card>
        <EmptyStateWithAction
          title="Dashboard verisi simdilik getirilemedi."
          subtitle="Rapor servisleri yanit vermiyor olabilir. Tekrar deneyebilir veya dogrudan satis ve stok akislarini acabilirsin."
          actionLabel="Tekrar dene"
          onAction={() => void fetchDashboard()}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen
      title={user?.name ? `Merhaba, ${user.name}` : "Merhaba"}
      subtitle="Bugunun tahsilat, stok ve satis onceliklerini buradan yonet"
      action={<Button label="Yenile" onPress={() => void fetchDashboard()} variant="secondary" size="sm" fullWidth={false} />}
    >
      {state.error ? <Banner text={state.error} /> : null}

      {/* ─── Quick Actions ─────────────────────────────────────────────────── */}
      <Card>
        <SectionTitle title="Hizli aksiyonlar" />
        {quickActionButtons}
      </Card>

      {/* ─── Hero Metrics + Detailed Metrics + Charts ──────────────────────── */}
      <DashboardMetricsSection
        state={state}
        heroMetrics={heroMetrics}
        detailMetrics={detailMetrics}
        detailsExpanded={true}
        onOpenSalesComposer={onOpenSalesComposer}
        onOpenProducts={onOpenProducts}
      />

      {/* ─── Work List ─────────────────────────────────────────────────────── */}
      <DashboardRecentSection
        state={state}
        onOpenSalesComposer={onOpenSalesComposer}
        onOpenSaleDetail={onOpenSaleDetail}
        onOpenStockFocus={onOpenStockFocus}
      />

    </AppScreen>
  );
}

const styles = StyleSheet.create({
  quickActions: {
    marginTop: 12,
    gap: 10,
  },
});
