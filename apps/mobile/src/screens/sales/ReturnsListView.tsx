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
  TextField,
} from "@/src/components/ui";
import { formatCurrency, formatDate } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useReturnsList } from "./hooks/useReturnsList";

type ReturnsListViewProps = {
  isActive?: boolean;
  onOpenSaleDetail?: (saleId: string) => void;
};

const colors = mobileTheme.colors.dark;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  listContent: { paddingHorizontal: 20, paddingBottom: 120, gap: 12 },
  loadingList: { gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 },
  filterStack: { gap: 10 },
  rightText: { color: colors.text, fontSize: 14, fontWeight: "600" },
});

export function ReturnsListView({
  isActive = true,
  onOpenSaleDetail,
}: ReturnsListViewProps) {
  const { storeIds } = useAuth();
  const list = useReturnsList({ isActive, storeIds });
  const {
    sales, loading, error,
    customerName, setCustomerName,
    receiptNo, setReceiptNo,
    refetch,
  } = list;

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <ScreenHeader
          title="Iadeler"
          subtitle="Iade edilmis satislar"
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
          <View style={styles.filterStack}>
            <SearchBar
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Musteri ara"
            />
            <TextField
              label="Fis no"
              value={receiptNo}
              onChangeText={setReceiptNo}
              placeholder="Fis no ile ara"
              returnKeyType="search"
            />
          </View>
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
            const caption = [
              item.receiptNo ? `#${item.receiptNo}` : null,
              formatDate(item.createdAt),
            ]
              .filter(Boolean)
              .join(" • ");

            return (
              <ListRow
                title={label}
                caption={caption}
                right={<Text style={styles.rightText}>{formatCurrency(item.total, currency)}</Text>}
                onPress={onOpenSaleDetail ? () => onOpenSaleDetail(item.id) : undefined}
                icon={
                  <MaterialCommunityIcons
                    name="undo-variant"
                    size={20}
                    color={colors.muted}
                  />
                }
              />
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title="Iade bulunamadi"
              subtitle="Bu filtreler icin iade kaydi yok"
            />
          }
        />
      )}
    </View>
  );
}
