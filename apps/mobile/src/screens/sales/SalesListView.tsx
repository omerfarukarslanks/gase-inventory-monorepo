import type { ReactNode } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  FilterTabs,
  ListRow,
  SearchBar,
  SectionTitle,
  SkeletonBlock,
  StickyActionBar,
  TextField,
} from "@/src/components/ui";
import { mobileTheme } from "@/src/theme";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
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

  const hasActiveFilters = !!receiptNo || !!customerName;

  return (
    <View style={styles.screen}>
      {/* Segment control pinned at top — doesn't scroll */}
      {segmentControl ? (
        <View style={styles.segmentWrap}>{segmentControl}</View>
      ) : null}

      <FlatList
        data={loading ? [] : sales}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        onRefresh={() => void refetch()}
        refreshing={loading}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {error ? <Banner text={error} /> : null}

            <SearchBar value={customerName} onChangeText={setCustomerName} placeholder="Musteri ara" />
            <TextField label="Fis no" value={receiptNo} onChangeText={setReceiptNo} placeholder="ORN-001" />
            <FilterTabs value={statusFilter} options={saleStatusOptions} onChange={setStatusFilter} />

            {(composer.canResumeDraft || recentCustomers.length) ? (
              <Card style={styles.quickCard}>
                <SectionTitle title="Hizli baslat" />
                <View style={styles.quickList}>
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

            {loading ? (
              <View style={styles.skeletonGroup}>
                <SkeletonBlock height={84} />
                <SkeletonBlock height={84} />
                <SkeletonBlock height={84} />
              </View>
            ) : null}
          </View>
        }
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
          !loading ? (
            <EmptyStateWithAction
              title="Satis bulunamadi."
              subtitle="Filtreleri temizle veya yeni satis baslat."
              actionLabel="Yeni satis"
              onAction={() => composer.open(undefined, { reset: true })}
            />
          ) : null
        }
      />

      {hasActiveFilters ? (
        <StickyActionBar>
          <Button label="Filtreyi temizle" onPress={clearFilters} variant="ghost" />
        </StickyActionBar>
      ) : null}

      {/* FAB — Yeni Satış */}
      <Pressable
        style={styles.fab}
        onPress={() => composer.open(undefined, { reset: true })}
        hitSlop={8}
      >
        <MaterialCommunityIcons name="cart-plus" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: mobileTheme.colors.dark.bg,
  },
  segmentWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 12,
  },
  listHeader: {
    paddingTop: 16,
    gap: 12,
    marginBottom: 8,
  },
  quickCard: {
    marginTop: 4,
  },
  quickList: {
    marginTop: 12,
    gap: 12,
  },
  skeletonGroup: {
    gap: 12,
    marginTop: 4,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: mobileTheme.colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: mobileTheme.colors.brand.primary,
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
});
