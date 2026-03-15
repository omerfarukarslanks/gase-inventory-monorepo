import type { ReactNode } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  FilterTabs,
  ListRow,
  ScreenHeader,
  SearchBar,
  SectionTitle,
  SkeletonBlock,
  StickyActionBar,
  TextField,
} from "@/src/components/ui";
import { mobileTheme } from "@/src/theme";
import { FlatList, StyleSheet, View } from "react-native";
import { formatCurrency, formatDate } from "@/src/lib/format";
import { trackEvent } from "@/src/lib/analytics";
import type { SalesRecentCustomer } from "@/src/lib/salesRecents";
import type { SalesDraftSeed } from "@/src/lib/workflows";
import type { useSalesList } from "./hooks/useSalesList";
import { saleStatusOptions } from "./hooks/validators";
import type { ComposerStep } from "./hooks/types";

type SalesListViewProps = {
  list: ReturnType<typeof useSalesList>;
  composer: {
    canResumeDraft: boolean;
    step: ComposerStep;
    open: (seed?: SalesDraftSeed, options?: { reset?: boolean; startStep?: ComposerStep }) => void;
  };
  recentCustomers: SalesRecentCustomer[];
  onOpenDetail: (saleId: string) => void;
  onResumeCompose: () => void;
  segmentControl?: ReactNode;
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: mobileTheme.colors.dark.bg },
  screenContent: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  filterStack: { gap: 12 },
  list: { marginTop: 12, gap: 12 },
  listWrap: { flex: 1, paddingHorizontal: 20 },
  listContent: { paddingHorizontal: 20, paddingBottom: 120, gap: 12 },
  loadingList: { gap: 12, paddingBottom: 120 },
});

export function SalesListView({
  list,
  composer,
  recentCustomers,
  onOpenDetail,
  onResumeCompose,
  segmentControl,
}: SalesListViewProps) {
  const {
    sales, loading, error,
    receiptNo, setReceiptNo,
    customerName, setCustomerName,
    statusFilter, setStatusFilter,
    clearFilters, refetch,
  } = list;

  return (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        {segmentControl}
        <ScreenHeader
          title="Satislar"
          subtitle="Liste, detay ve yeni satis akislarini ayri gorevler halinde yonet"
          action={<Button label="Yenile" onPress={() => void refetch()} variant="secondary" size="sm" fullWidth={false} />}
        />

        {error ? <Banner text={error} /> : null}

        <Card>
          <View style={styles.filterStack}>
            <SearchBar value={customerName} onChangeText={setCustomerName} placeholder="Musteri ara" />
            <TextField label="Fis no" value={receiptNo} onChangeText={setReceiptNo} placeholder="ORN-001" />
            <FilterTabs value={statusFilter} options={saleStatusOptions} onChange={setStatusFilter} />
          </View>
        </Card>

        {composer.canResumeDraft || recentCustomers.length ? (
          <Card>
            <SectionTitle title="Hizli baslat" />
            <View style={styles.list}>
              {composer.canResumeDraft ? (
                <ListRow
                  title="Acik satis taslagi"
                  subtitle="Yarim kalan adimdan devam et"
                  caption={composer.step === "review" ? "Onaya hazir" : "Satis akisini tamamla"}
                  onPress={() => {
                    trackEvent("empty_state_action_clicked", { screen: "sales", action: "resume_draft" });
                    onResumeCompose();
                  }}
                  icon={<MaterialCommunityIcons name="progress-clock" size={20} color={mobileTheme.colors.brand.primary} />}
                />
              ) : null}
              {recentCustomers[0] ? (
                <ListRow
                  title="Son musteri ile yeni satis"
                  subtitle={recentCustomers[0].label}
                  caption="Musteri adimini atla ve urun secimine gec"
                  onPress={() => {
                    trackEvent("empty_state_action_clicked", { screen: "sales", action: "recent_customer_start" });
                    composer.open(
                      { customerId: recentCustomers[0].id, customerLabel: recentCustomers[0].label },
                      { reset: true, startStep: "items" },
                    );
                  }}
                  icon={<MaterialCommunityIcons name="account-arrow-right-outline" size={20} color={mobileTheme.colors.brand.primary} />}
                />
              ) : null}
            </View>
          </Card>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.listWrap}>
          <View style={styles.loadingList}>
            <SkeletonBlock height={84} />
            <SkeletonBlock height={84} />
            <SkeletonBlock height={84} />
          </View>
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ListRow
              title={item.receiptNo ?? item.id}
              subtitle={`${item.name ?? "-"} ${item.surname ?? ""}`.trim()}
              caption={`${formatCurrency(item.lineTotal ?? item.total, item.currency ?? "TRY")} • ${formatDate(item.createdAt)}`}
              badgeLabel={item.status ?? "DURUM"}
              badgeTone={item.status === "CANCELLED" ? "danger" : "positive"}
              onPress={() => onOpenDetail(item.id)}
              icon={<MaterialCommunityIcons name="receipt-text-outline" size={20} color={mobileTheme.colors.brand.primary} />}
            />
          )}
          ListEmptyComponent={
            <EmptyStateWithAction
              title="Satis bulunamadi."
              subtitle="Filtreleri temizle veya yeni satis baslat."
              actionLabel="Yeni satis"
              onAction={() => composer.open(undefined, { reset: true })}
            />
          }
        />
      )}

      <StickyActionBar>
        <Button label="Filtreyi temizle" onPress={clearFilters} variant="ghost" />
        <Button
          label="Yeni satis"
          onPress={() => composer.open(undefined, { reset: true })}
          icon={<MaterialCommunityIcons name="cart-plus" size={16} color="#FFFFFF" />}
        />
      </StickyActionBar>
    </View>
  );
}
