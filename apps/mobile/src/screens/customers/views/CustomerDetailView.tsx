import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Customer, CustomerBalance } from "@gase/core";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  InlineStat,
  ScreenHeader,
  SectionTitle,
  SkeletonBlock,
  StickyActionBar,
} from "@/src/components/ui";
import { trackEvent } from "@/src/lib/analytics";
import { formatCount, formatCurrency } from "@/src/lib/format";
import type { SalesDraftSeed } from "@/src/lib/workflows";
import { mobileTheme } from "@/src/theme";

type CustomerDetailViewProps = {
  selectedCustomer: Customer;
  balance: CustomerBalance | null;
  balanceLoading: boolean;
  error: string;
  onBack: () => void;
  onStartSale?: (seed?: SalesDraftSeed) => void;
  openCustomer: (customer: Customer) => Promise<void>;
};

export function CustomerDetailView({
  selectedCustomer,
  balance,
  balanceLoading,
  error,
  onBack,
  onStartSale,
  openCustomer,
}: CustomerDetailViewProps) {
  const fullName = `${selectedCustomer.name} ${selectedCustomer.surname}`.trim();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <ScreenHeader
          title={fullName}
          subtitle="Bakiye ve satis ozeti"
          onBack={onBack}
        />

        {error ? <Banner text={error} /> : null}

        <Card>
          <SectionTitle title="Musteri profili" />
          <View style={styles.detailStats}>
            <View style={styles.detailStat}>
              <Text style={styles.detailLabel}>Iletisim</Text>
              <Text style={styles.detailValue}>
                {selectedCustomer.phoneNumber ?? selectedCustomer.email ?? "Kayitli bilgi yok"}
              </Text>
            </View>
            <View style={styles.detailStat}>
              <Text style={styles.detailLabel}>Durum</Text>
              <Text style={styles.detailValue}>
                {selectedCustomer.isActive === false ? "Pasif musteri" : "Aktif musteri"}
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <SectionTitle title="Bakiye ozeti" />
          {balanceLoading ? (
            <View style={styles.loadingList}>
              <SkeletonBlock height={18} />
              <SkeletonBlock height={18} width="80%" />
              <SkeletonBlock height={18} width="60%" />
            </View>
          ) : balance ? (
            <View style={styles.balanceGrid}>
              <InlineStat label="Toplam satis" value={formatCount(balance.totalSalesCount)} />
              <InlineStat label="Toplam tutar" value={formatCurrency(balance.totalSaleAmount, "TRY")} />
              <InlineStat label="Odenen" value={formatCurrency(balance.totalPaidAmount, "TRY")} />
              <InlineStat label="Iade" value={formatCurrency(balance.totalReturnAmount, "TRY")} />
              <InlineStat label="Bakiye" value={formatCurrency(balance.balance, "TRY")} />
            </View>
          ) : (
            <EmptyStateWithAction
              title="Bakiye getirilemedi."
              subtitle="Musteri hesabini yeniden sorgula."
              actionLabel="Tekrar dene"
              onAction={() => void openCustomer(selectedCustomer)}
            />
          )}
        </Card>
      </ScrollView>

      <StickyActionBar>
        <Button
          label="Listeye don"
          onPress={onBack}
          variant="ghost"
        />
        <Button
          label="Satis baslat"
          onPress={() => {
            trackEvent("sale_started", { source: "customer_detail", customerId: selectedCustomer.id });
            onStartSale?.({
              customerId: selectedCustomer.id,
              customerLabel: fullName,
            });
          }}
          icon={<MaterialCommunityIcons name="cart-plus" size={16} color="#FFFFFF" />}
        />
      </StickyActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: mobileTheme.colors.dark.bg,
  },
  screenContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
    paddingBottom: 120,
  },
  detailStats: {
    marginTop: 12,
    gap: 12,
  },
  detailStat: {
    gap: 4,
  },
  detailLabel: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  detailValue: {
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
  balanceGrid: {
    marginTop: 12,
    gap: 14,
  },
  loadingList: {
    gap: 12,
  },
});
