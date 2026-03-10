import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import {
  BarList,
  Button,
  Card,
  EmptyStateWithAction,
  ListRow,
  MetricCard,
  SectionTitle,
  SkeletonBlock,
} from "@/src/components/ui";
import { trackEvent } from "@/src/lib/analytics";
import { formatCount, formatCurrency } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";
import type { DashboardState } from "../hooks/useDashboardData";

type Props = {
  state: DashboardState;
  heroMetrics: Array<{ key: string; label: string; value: string; hint: string }>;
  detailMetrics: Array<{ key: string; label: string; value: string; hint: string }>;
  detailsExpanded: boolean;
  onOpenSalesComposer?: () => void;
  onOpenProducts?: () => void;
};

export function DashboardMetricsSection({
  state,
  heroMetrics,
  detailMetrics,
  detailsExpanded,
  onOpenSalesComposer,
  onOpenProducts,
}: Props) {
  return (
    <>
      {/* ─── Hero Metrics (always visible) ────────────────────────────────── */}
      <View style={styles.metricGrid}>
        {heroMetrics.map((metric) => (
          <View key={metric.key} style={styles.metricItem}>
            {state.loading ? (
              <Card style={styles.metricSkeletonCard}>
                <SkeletonBlock width="45%" />
                <SkeletonBlock height={28} width="65%" style={styles.skeletonGap} />
                <SkeletonBlock width="55%" />
              </Card>
            ) : (
              <MetricCard label={metric.label} value={metric.value} hint={metric.hint} />
            )}
          </View>
        ))}
      </View>

      {/* ─── Detailed Content (charts + secondary metrics) ─────────────────── */}
      {detailsExpanded ? (
        <>
          {/* Secondary metric cards */}
          <View style={styles.metricGrid}>
            {detailMetrics.map((metric) => (
              <View key={metric.key} style={styles.metricItem}>
                {state.loading ? (
                  <Card style={styles.metricSkeletonCard}>
                    <SkeletonBlock width="45%" />
                    <SkeletonBlock height={28} width="65%" style={styles.skeletonGap} />
                    <SkeletonBlock width="55%" />
                  </Card>
                ) : (
                  <MetricCard label={metric.label} value={metric.value} hint={metric.hint} />
                )}
              </View>
            ))}
          </View>

          {/* Revenue trend */}
          <Card>
            <SectionTitle
              title="Gelir trendi"
              action={
                onOpenProducts ? (
                  <Button label="Urunlere git" onPress={onOpenProducts} variant="ghost" size="sm" fullWidth={false} />
                ) : null
              }
            />
            {state.loading ? (
              <View style={styles.loadingList}>
                <SkeletonBlock height={18} />
                <SkeletonBlock height={18} width="80%" />
                <SkeletonBlock height={18} width="72%" />
              </View>
            ) : state.revenueTrend.length ? (
              <BarList
                items={state.revenueTrend.map((item, index) => ({
                  key: `${item.period ?? index}`,
                  label: item.period ?? `Gun ${index + 1}`,
                  value: Number(item.totalRevenue ?? 0),
                }))}
                formatter={(value) => formatCurrency(value, "TRY")}
              />
            ) : (
              <EmptyStateWithAction
                title="Trend verisi yok."
                subtitle="Filtrelenmis satis verisi olustugunda burada gorunecek."
                actionLabel="Yeni satis ac"
                onAction={() => {
                  trackEvent("empty_state_action_clicked", { screen: "dashboard", target: "sales" });
                  onOpenSalesComposer?.();
                }}
              />
            )}
          </Card>

          {/* Top sellers */}
          <Card>
            <SectionTitle title="En cok satanlar" />
            {state.loading ? (
              <View style={styles.loadingList}>
                <SkeletonBlock height={72} />
                <SkeletonBlock height={72} />
              </View>
            ) : state.productSales.length ? (
              <View style={styles.list}>
                {state.productSales.map((item, index) => (
                  <ListRow
                    key={`${item.productVariantId ?? index}`}
                    title={item.variantName ?? item.productName ?? `Urun ${index + 1}`}
                    subtitle={formatCurrency(item.lineTotal ?? 0, "TRY")}
                    caption={`${formatCount(item.quantity)} adet satis`}
                    badgeLabel="Satis"
                    badgeTone="info"
                    onPress={onOpenProducts}
                    icon={<MaterialCommunityIcons name="trending-up" size={20} color={mobileTheme.colors.brand.primary} />}
                  />
                ))}
              </View>
            ) : (
              <EmptyStateWithAction
                title="Urun satis verisi yok."
                subtitle="Satis olustukca burada en cok satan varyantlar listelenecek."
                actionLabel="Urunleri ac"
                onAction={() => {
                  trackEvent("empty_state_action_clicked", { screen: "dashboard", target: "products" });
                  onOpenProducts?.();
                }}
              />
            )}
          </Card>
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricItem: {
    flexBasis: "47%",
    flexGrow: 1,
    minWidth: 150,
  },
  metricSkeletonCard: {
    minHeight: 132,
    gap: 8,
  },
  skeletonGap: {
    marginVertical: 6,
  },
  loadingList: {
    marginTop: 12,
    gap: 12,
  },
  list: {
    marginTop: 12,
    gap: 12,
  },
});
