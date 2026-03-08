import {
  getReportCancellations,
  getReportConfirmedOrders,
  getReportLowStock,
  getReportReturns,
  getReportRevenueTrend,
  getReportSalesByProduct,
  getReportSalesSummary,
  getReportStockTotal,
  type CancellationItem,
  type LowStockItem,
  type RevenueTrendItem,
  type SalesByProductItem,
  type StockTotalResponse,
  type SalesSummaryResponse,
  type ConfirmedOrdersResponse,
  type ReturnsResponse,
} from "@gase/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  AppScreen,
  Banner,
  BarList,
  Button,
  Card,
  EmptyState,
  MetricCard,
  SectionTitle,
  StatusBadge,
} from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
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
};

export default function DashboardScreen() {
  const { signOut, storeIds, user } = useAuth();
  const [state, setState] = useState<DashboardState>(initialState);

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
      ] = await Promise.all([
        getReportSalesSummary({ ...scope, startDate: weekAgo, endDate: today }),
        getReportStockTotal({ ...scope, compareDate: weekAgo }),
        getReportConfirmedOrders({ ...scope, startDate: weekAgo, endDate: today, compareDate: weekAgo }),
        getReportReturns({ ...scope, startDate: weekAgo, endDate: today }),
        getReportRevenueTrend({ ...scope, groupBy: "day", startDate: weekAgo, endDate: today }),
        getReportSalesByProduct({ ...scope, startDate: weekAgo, endDate: today, limit: 5 }),
        getReportLowStock({ ...scope, threshold: 50, limit: 6 }),
        getReportCancellations({ ...scope, startDate: weekAgo, endDate: today, limit: 5 }),
      ]);

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
    void fetchDashboard();
  }, [fetchDashboard]);

  const metricCards = useMemo(() => ([
    {
      label: "Haftalik satis",
      value: formatCurrency(state.salesSummary?.totals?.totalLineTotal, "TRY"),
      hint: `Iptal orani %${Number(state.salesSummary?.totals?.cancelRate ?? 0).toFixed(1)}`,
    },
    {
      label: "Toplam stok",
      value: formatCount(state.stockTotal?.totals?.todayTotalQuantity),
      hint: `Degisim %${Number(state.stockTotal?.comparison?.changePercent ?? 0).toFixed(1)}`,
    },
    {
      label: "Onayli siparis",
      value: formatCount(state.confirmedOrders?.totals?.orderCount),
      hint: formatCurrency(state.confirmedOrders?.totals?.totalLineTotal, "TRY"),
    },
    {
      label: "Iade",
      value: formatCount(state.returns?.totals?.orderCount),
      hint: formatCurrency(state.returns?.totals?.totalLineTotal, "TRY"),
    },
  ]), [state.confirmedOrders, state.returns, state.salesSummary, state.stockTotal]);

  return (
    <AppScreen
      title={`Hos geldin${user?.name ? `, ${user.name}` : ""}`}
      subtitle="Son 7 gunun operasyon ozeti"
      action={<Button label="Cikis" onPress={() => void signOut()} variant="ghost" />}
    >
      {state.error ? <Banner text={state.error} /> : null}

      <View style={styles.metricGrid}>
        {metricCards.map((metric) => (
          <View key={metric.label} style={styles.metricItem}>
            <MetricCard label={metric.label} value={metric.value} hint={metric.hint} />
          </View>
        ))}
      </View>

      <Card>
        <SectionTitle
          title="Gelir trendi"
          action={<Button label="Yenile" onPress={() => void fetchDashboard()} variant="secondary" />}
        />
        {state.loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={mobileTheme.colors.brand.primary} />
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
          <EmptyState title="Gelir verisi yok." />
        )}
      </Card>

      <Card>
        <SectionTitle title="Urun bazli satis" />
        {state.loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={mobileTheme.colors.brand.primary} />
          </View>
        ) : state.productSales.length ? (
          <BarList
            items={state.productSales.map((item, index) => ({
              key: `${item.productVariantId ?? index}`,
              label: item.variantName ?? item.productName ?? `Urun ${index + 1}`,
              value: Number(item.lineTotal ?? 0),
            }))}
            formatter={(value) => formatCurrency(value, "TRY")}
          />
        ) : (
          <EmptyState title="Satis verisi yok." />
        )}
      </Card>

      <Card>
        <SectionTitle title="Dusuk stok uyarilari" />
        {state.loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={mobileTheme.colors.brand.primary} />
          </View>
        ) : state.lowStock.length ? (
          <View style={styles.list}>
            {state.lowStock.map((item, index) => (
              <View key={`${item.productVariantId ?? index}`} style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{item.variantName ?? item.productName ?? "-"}</Text>
                  <Text style={styles.rowMeta}>{item.storeName ?? "Tum magazalar"}</Text>
                </View>
                <StatusBadge label={`${formatCount(item.quantity)} adet`} tone="warning" />
              </View>
            ))}
          </View>
        ) : (
          <EmptyState title="Aktif dusuk stok uyarisi yok." />
        )}
      </Card>

      <Card>
        <SectionTitle title="Son iptaller" />
        {state.loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={mobileTheme.colors.brand.primary} />
          </View>
        ) : state.cancellations.length ? (
          <View style={styles.list}>
            {state.cancellations.map((item, index) => (
              <View key={`${item.id ?? index}`} style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{item.receiptNo ?? "Fis"}</Text>
                  <Text style={styles.rowMeta}>
                    {item.name ?? "-"} {item.surname ?? ""} • {formatDate(item.cancelledAt ?? item.createdAt)}
                  </Text>
                </View>
                <StatusBadge
                  label={formatCurrency(item.lineTotal ?? item.unitPrice, "TRY")}
                  tone="danger"
                />
              </View>
            ))}
          </View>
        ) : (
          <EmptyState title="Son 7 gunde iptal yok." />
        )}
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricItem: {
    width: "47%",
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 4,
  },
  rowCopy: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
  rowMeta: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
  },
});
