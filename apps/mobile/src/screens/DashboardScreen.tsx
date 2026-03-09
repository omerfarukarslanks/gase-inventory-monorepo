import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getSales,
  getReportCancellations,
  getReportConfirmedOrders,
  getReportLowStock,
  getReportReturns,
  getReportRevenueTrend,
  getReportSalesByProduct,
  getReportSalesSummary,
  getReportStockTotal,
  normalizeSalesResponse,
  type CancellationItem,
  type ConfirmedOrdersResponse,
  type LowStockItem,
  type ReturnsResponse,
  type RevenueTrendItem,
  type SaleListItem,
  type SalesByProductItem,
  type SalesSummaryResponse,
  type StockTotalResponse,
} from "@gase/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  AppScreen,
  Banner,
  BarList,
  Button,
  Card,
  EmptyStateWithAction,
  ListRow,
  MetricCard,
  SectionTitle,
  SkeletonBlock,
} from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { trackEvent } from "@/src/lib/analytics";
import type { SalesDraftSeed, StockFocusSeed } from "@/src/lib/workflows";
import { formatCount, formatCurrency, formatDate } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";

type DashboardState = {
  loading: boolean;
  error: string;
  salesSummary: SalesSummaryResponse | null;
  stockTotal: StockTotalResponse | null;
  confirmedOrders: ConfirmedOrdersResponse | null;
  returns: ReturnsResponse | null;
  revenueTrend: RevenueTrendItem[];
  productSales: SalesByProductItem[];
  lowStock: LowStockItem[];
  cancellations: CancellationItem[];
  pendingCollections: SaleListItem[];
};

type DashboardScreenProps = {
  isActive?: boolean;
  onOpenSalesComposer?: (seed?: SalesDraftSeed) => void;
  onOpenSaleDetail?: (saleId: string) => void;
  onOpenStockFocus?: (seed: StockFocusSeed) => void;
  onOpenCustomers?: () => void;
  onOpenProducts?: () => void;
};

const initialState: DashboardState = {
  loading: true,
  error: "",
  salesSummary: null,
  stockTotal: null,
  confirmedOrders: null,
  returns: null,
  revenueTrend: [],
  productSales: [],
  lowStock: [],
  cancellations: [],
  pendingCollections: [],
};

export default function DashboardScreen({
  isActive = true,
  onOpenCustomers,
  onOpenProducts,
  onOpenSaleDetail,
  onOpenSalesComposer,
  onOpenStockFocus,
}: DashboardScreenProps = {}) {
  const { storeIds, user } = useAuth();
  const [state, setState] = useState<DashboardState>(initialState);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const scope = storeIds.length ? { storeIds } : {};

    try {
      const [
        salesSummary,
        stockTotal,
        confirmedOrders,
        returns,
        revenueTrend,
        productSales,
        lowStock,
        cancellations,
        recentSales,
      ] = await Promise.all([
        getReportSalesSummary({ ...scope, startDate: weekAgo, endDate: today }),
        getReportStockTotal({ ...scope, compareDate: weekAgo }),
        getReportConfirmedOrders({ ...scope, startDate: weekAgo, endDate: today, compareDate: weekAgo }),
        getReportReturns({ ...scope, startDate: weekAgo, endDate: today }),
        getReportRevenueTrend({ ...scope, groupBy: "day", startDate: weekAgo, endDate: today }),
        getReportSalesByProduct({ ...scope, startDate: weekAgo, endDate: today, limit: 5 }),
        getReportLowStock({ ...scope, threshold: 50, limit: 6 }),
        getReportCancellations({ ...scope, startDate: weekAgo, endDate: today, limit: 5 }),
        getSales({ ...scope, page: 1, limit: 12, status: ["CONFIRMED"] }),
      ]);

      const pendingCollections = normalizeSalesResponse(recentSales).data
        .filter(
          (item) =>
            Number(item.remainingAmount ?? 0) > 0 &&
            item.status !== "CANCELLED" &&
            item.id,
        )
        .sort(
          (left, right) =>
            Number(right.remainingAmount ?? 0) - Number(left.remainingAmount ?? 0),
        )
        .slice(0, 4);

      setState({
        loading: false,
        error: "",
        salesSummary,
        stockTotal,
        confirmedOrders,
        returns,
        revenueTrend: revenueTrend.data ?? [],
        productSales: productSales.data ?? [],
        lowStock: lowStock.data ?? [],
        cancellations: cancellations.data ?? [],
        pendingCollections,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : "Dashboard yuklenemedi.",
      }));
    }
  }, [storeIds]);

  useEffect(() => {
    if (!isActive) return;
    void fetchDashboard();
  }, [fetchDashboard, isActive]);

  const pendingCollectionsTotal = useMemo(
    () =>
      state.pendingCollections.reduce(
        (sum, item) => sum + Number(item.remainingAmount ?? 0),
        0,
      ),
    [state.pendingCollections],
  );

  const pendingCollectionCurrency = useMemo(() => {
    const currencies = Array.from(
      new Set(
        state.pendingCollections
          .map((item) => item.currency)
          .filter((value): value is "TRY" | "USD" | "EUR" => Boolean(value)),
      ),
    );
    return currencies.length === 1 ? currencies[0] : ("TRY" as const);
  }, [state.pendingCollections]);

  const topSeller = state.productSales[0];
  const mostUrgentLowStock = state.lowStock[0];
  const nextCollection = state.pendingCollections[0];

  const hasDashboardData = useMemo(
    () =>
      Boolean(
        state.salesSummary ||
          state.stockTotal ||
          state.confirmedOrders ||
          state.returns ||
          state.revenueTrend.length ||
          state.productSales.length ||
          state.lowStock.length ||
          state.cancellations.length ||
          state.pendingCollections.length,
      ),
    [
      state.cancellations.length,
      state.confirmedOrders,
      state.lowStock.length,
      state.pendingCollections.length,
      state.productSales.length,
      state.revenueTrend.length,
      state.returns,
      state.salesSummary,
      state.stockTotal,
    ],
  );

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

  // ─── Hero Metrics (3 above-the-fold) ──────────────────────────────────────

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

  // ─── Detailed Metrics (below the fold) ────────────────────────────────────

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

      {/* ─── Work List (always visible — primary operational content) ─────── */}
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

      {/* ─── Detailed View Toggle ──────────────────────────────────────────── */}
      <Pressable
        onPress={() => setDetailsExpanded((prev) => !prev)}
        style={styles.detailsToggle}
      >
        <Text style={styles.detailsToggleLabel}>
          {detailsExpanded ? "Ozet gorünume don" : "Ayrintili gorunum"}
        </Text>
        <MaterialCommunityIcons
          name={detailsExpanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={mobileTheme.colors.dark.text2}
        />
      </Pressable>

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
                    icon={<MaterialCommunityIcons name="trending-up" size={20} color={brand.primary} />}
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
    </AppScreen>
  );
}

const brand = mobileTheme.colors.brand;

const styles = StyleSheet.create({
  quickActions: {
    marginTop: 12,
    gap: 10,
  },
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
  detailsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  detailsToggleLabel: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 13,
    fontWeight: "500",
  },
});
