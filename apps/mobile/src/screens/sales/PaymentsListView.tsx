import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlatList, StyleSheet, Text, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  EmptyState,
  ListRow,
  ScreenHeader,
  SearchBar,
  SkeletonBlock,
} from "@/src/components/ui";
import { formatCurrency, formatDate } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";
import { useAuth } from "@/src/context/AuthContext";
import { usePaymentsList } from "./hooks/usePaymentsList";

type PaymentsListViewProps = {
  isActive?: boolean;
  onOpenSaleDetail?: (saleId: string) => void;
};

const colors = mobileTheme.colors.dark;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  listContent: { paddingHorizontal: 20, paddingBottom: 120, gap: 12 },
  loadingList: { gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 },
  rightWrap: { alignItems: "flex-end", gap: 2 },
  rightAmount: { color: colors.text, fontSize: 14, fontWeight: "700" },
  rightCaption: { color: colors.muted, fontSize: 11 },
});

export function PaymentsListView({
  isActive = true,
  onOpenSaleDetail,
}: PaymentsListViewProps) {
  const { storeIds } = useAuth();
  const list = usePaymentsList({ isActive, storeIds });
  const { sales, loading, error, customerName, setCustomerName, refetch } = list;

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <ScreenHeader
          title="Tahsilatlar"
          subtitle="Kismi odeme durumundaki satislar"
          action={
            <Button
              label="Yenile"
              onPress={() => void refetch()}
              variant="secondary"
              size="sm"
              fullWidth={false}
            />
          }
        />

        {error ? <Banner text={error} /> : null}

        <Card>
          <SearchBar
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Musteri ara"
          />
        </Card>
      </View>

      {loading ? (
        <View style={styles.loadingList}>
          <SkeletonBlock height={84} />
          <SkeletonBlock height={84} />
          <SkeletonBlock height={84} />
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const currency = item.currency ?? "TRY";
            const label =
              [item.name, item.surname].filter(Boolean).join(" ") || "Bilinmeyen musteri";
            const caption = `${formatCurrency(item.total, currency)} • ${formatDate(item.createdAt)}`;
            const right = formatCurrency(item.remainingAmount, currency);

            return (
              <ListRow
                title={label}
                caption={caption}
                right={
                  <View style={styles.rightWrap}>
                    <Text style={styles.rightAmount}>{right}</Text>
                    <Text style={styles.rightCaption}>Kalan</Text>
                  </View>
                }
                onPress={onOpenSaleDetail ? () => onOpenSaleDetail(item.id) : undefined}
                icon={
                  <MaterialCommunityIcons
                    name="cash-clock"
                    size={20}
                    color={colors.muted}
                  />
                }
              />
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title="Bekleyen tahsilat yok"
              subtitle="Kismi odemeli satis bulunamadi"
            />
          }
        />
      )}
    </View>
  );
}
