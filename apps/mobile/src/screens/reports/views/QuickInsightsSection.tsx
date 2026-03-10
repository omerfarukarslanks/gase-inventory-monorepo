import { View } from "react-native";
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
import { formatCount, formatCurrency, formatDate } from "@/src/lib/format";
import { type ReportDetailKey, type ReportMetric, type ReportsState } from "../types";
import { reportStyles as styles } from "../styles";

type Props = {
  state: ReportsState;
  metricCards: ReportMetric[];
  storeScopeLabel: string;
  canReadFinancial: boolean;
  canReadSales: boolean;
  canReadStock: boolean;
  onDetailClick: (key: ReportDetailKey) => void;
  onRefresh: () => void;
};

export function QuickInsightsSection({
  state,
  metricCards,
  storeScopeLabel,
  canReadFinancial,
  canReadSales,
  canReadStock,
  onDetailClick,
  onRefresh,
}: Props) {
  return (
    <>
      <View style={styles.metricGrid}>
        {metricCards.map((metric) => (
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

      {canReadFinancial ? (
        <Card>
          <SectionTitle
            title="Gelir trendi"
            action={
              <Button
                label="Detay"
                onPress={() => onDetailClick("revenue-trend")}
                variant="ghost"
                size="sm"
                fullWidth={false}
              />
            }
          />
          {state.loading ? (
            <View style={styles.loadingList}>
              <SkeletonBlock height={18} />
              <SkeletonBlock height={18} width="80%" />
              <SkeletonBlock height={18} width="68%" />
            </View>
          ) : state.revenueTrend.length ? (
            <BarList
              items={state.revenueTrend.map((item, index) => ({
                key: `${item.period ?? index}`,
                label: item.period ?? `${index + 1}`,
                value: Number(item.totalRevenue ?? 0),
              }))}
              formatter={(value) => formatCurrency(value, "TRY")}
            />
          ) : (
            <EmptyStateWithAction
              title="Trend verisi yok."
              subtitle="Secili donem icin gelir kaydi bulunamadi."
              actionLabel="Yenile"
              onAction={onRefresh}
            />
          )}
        </Card>
      ) : null}

      {canReadSales ? (
        <Card>
          <SectionTitle
            title="En cok satanlar"
            action={
              <Button
                label="Detay"
                onPress={() => onDetailClick("product-performance")}
                variant="ghost"
                size="sm"
                fullWidth={false}
              />
            }
          />
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
                  title={item.variantName ?? item.productName ?? `Kalem ${index + 1}`}
                  subtitle={`${formatCount(item.quantity)} adet`}
                  caption={formatCurrency(item.lineTotal, "TRY")}
                  badgeLabel="satis"
                  badgeTone="info"
                />
              ))}
            </View>
          ) : (
            <EmptyStateWithAction
              title="Urun satis verisi yok."
              subtitle="Secili donem icinde satis kaydi olustugunda burada gorunecek."
              actionLabel="Yenile"
              onAction={onRefresh}
            />
          )}
        </Card>
      ) : null}

      {canReadStock ? (
        <Card>
          <SectionTitle
            title="Kritik stoklar"
            action={
              <Button
                label="Detay"
                onPress={() => onDetailClick("low-stock")}
                variant="ghost"
                size="sm"
                fullWidth={false}
              />
            }
          />
          {state.loading ? (
            <View style={styles.loadingList}>
              <SkeletonBlock height={72} />
              <SkeletonBlock height={72} />
            </View>
          ) : state.lowStock.length ? (
            <View style={styles.list}>
              {state.lowStock.map((item, index) => (
                <ListRow
                  key={`${item.productVariantId ?? index}-${item.storeId ?? "scope"}`}
                  title={item.variantName ?? item.productName ?? "Dusuk stok"}
                  subtitle={item.storeName ?? storeScopeLabel}
                  caption={`${formatCount(item.quantity)} adet kaldi`}
                  badgeLabel="kritik"
                  badgeTone="warning"
                />
              ))}
            </View>
          ) : (
            <EmptyStateWithAction
              title="Kritik stok yok."
              subtitle="Secili donem ve scope icin kritik stok kalemi bulunmadi."
              actionLabel="Yenile"
              onAction={onRefresh}
            />
          )}
        </Card>
      ) : null}

      {canReadSales ? (
        <Card>
          <SectionTitle
            title="Son iptaller"
            action={
              <Button
                label="Detay"
                onPress={() => onDetailClick("cancellations")}
                variant="ghost"
                size="sm"
                fullWidth={false}
              />
            }
          />
          {state.loading ? (
            <View style={styles.loadingList}>
              <SkeletonBlock height={72} />
              <SkeletonBlock height={72} />
            </View>
          ) : state.cancellations.length ? (
            <View style={styles.list}>
              {state.cancellations.map((item, index) => (
                <ListRow
                  key={`${item.id ?? item.receiptNo ?? index}`}
                  title={item.receiptNo ?? "Iptal edilen fis"}
                  subtitle={`${item.name ?? "-"} ${item.surname ?? ""}`.trim()}
                  caption={`${formatDate(item.cancelledAt ?? item.createdAt)} • ${formatCurrency(item.lineTotal ?? item.unitPrice, "TRY")}`}
                  badgeLabel="iptal"
                  badgeTone="danger"
                />
              ))}
            </View>
          ) : (
            <EmptyStateWithAction
              title="Iptal kaydi yok."
              subtitle="Secili donemde iptal edilen satis bulunmadi."
              actionLabel="Yenile"
              onAction={onRefresh}
            />
          )}
        </Card>
      ) : null}
    </>
  );
}
