import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ProductPackage } from "@gase/core";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  ListRow,
  ScreenHeader,
  SectionTitle,
  SkeletonBlock,
  StatusBadge,
  StickyActionBar,
} from "@/src/components/ui";
import { formatCurrency, formatDate } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";

type PackageDetailViewProps = {
  selectedPackage: ProductPackage | null;
  detailLoading: boolean;
  error: string;
  toggling: boolean;
  canUpdate: boolean;
  onBack: () => void;
  onEditPress: (packageId: string) => void;
  onToggleActive: () => void;
};

export function PackageDetailView({
  selectedPackage,
  detailLoading,
  error,
  toggling,
  canUpdate,
  onBack,
  onEditPress,
  onToggleActive,
}: PackageDetailViewProps) {
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.screenContent}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader
          title={selectedPackage?.name ?? "Paket detayi"}
          subtitle="Paket icerigi ve operasyon bilgisi"
          onBack={onBack}
          action={
            canUpdate && selectedPackage ? (
              <Button
                label="Duzenle"
                onPress={() => onEditPress(selectedPackage.id)}
                variant="secondary"
                size="sm"
                fullWidth={false}
              />
            ) : undefined
          }
        />

        {error ? <Banner text={error} /> : null}

        {detailLoading ? (
          <View style={styles.loadingList}>
            <SkeletonBlock height={96} />
            <SkeletonBlock height={88} />
            <SkeletonBlock height={88} />
          </View>
        ) : selectedPackage ? (
          <>
            <Card>
              <SectionTitle title="Paket ozeti" />
              <View style={styles.detailStats}>
                <View style={styles.detailStat}>
                  <Text style={styles.detailLabel}>Durum</Text>
                  <StatusBadge
                    label={selectedPackage.isActive === false ? "pasif" : "aktif"}
                    tone={selectedPackage.isActive === false ? "neutral" : "positive"}
                  />
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailLabel}>Kod</Text>
                  <Text style={styles.detailValue}>{selectedPackage.code}</Text>
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailLabel}>Aciklama</Text>
                  <Text style={styles.detailValue}>
                    {selectedPackage.description ?? "Aciklama yok"}
                  </Text>
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailLabel}>Satis fiyati</Text>
                  <Text style={styles.detailValue}>
                    {selectedPackage.defaultSalePrice != null
                      ? formatCurrency(
                          selectedPackage.defaultSalePrice,
                          (selectedPackage.defaultCurrency as "TRY" | "USD" | "EUR" | undefined) ??
                            "TRY",
                        )
                      : "Tanimli degil"}
                  </Text>
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailLabel}>Varyant sayisi</Text>
                  <Text style={styles.detailValue}>{selectedPackage.items?.length ?? 0}</Text>
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailLabel}>Kayit tarihi</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedPackage.createdAt)}</Text>
                </View>
              </View>
            </Card>

            <Card>
              <SectionTitle title={`Paket kalemleri (${selectedPackage.items?.length ?? 0})`} />
              {(selectedPackage.items ?? []).length ? (
                <View style={styles.list}>
                  {(selectedPackage.items ?? []).map((item) => (
                    <ListRow
                      key={item.id}
                      title={item.productVariant.name}
                      subtitle={item.productVariant.code}
                      caption={`${item.quantity} adet / paket`}
                      badgeLabel={item.productVariant.isActive === false ? "pasif" : "aktif"}
                      badgeTone={item.productVariant.isActive === false ? "neutral" : "info"}
                      icon={
                        <MaterialCommunityIcons
                          name="package-variant"
                          size={20}
                          color={mobileTheme.colors.brand.primary}
                        />
                      }
                    />
                  ))}
                </View>
              ) : (
                <EmptyStateWithAction
                  title="Paket kalemi yok."
                  subtitle="Duzenleme ekranindan bu pakete varyant ekleyebilirsin."
                  actionLabel="Duzenle"
                  onAction={() => onEditPress(selectedPackage.id)}
                />
              )}
            </Card>
          </>
        ) : (
          <EmptyStateWithAction
            title="Paket detayi getirilemedi."
            subtitle="Listeye donup paketi yeniden ac."
            actionLabel="Listeye don"
            onAction={onBack}
          />
        )}
      </ScrollView>

      <StickyActionBar>
        <Button label="Listeye don" onPress={onBack} variant="ghost" />
        {canUpdate && selectedPackage ? (
          <Button
            label={selectedPackage.isActive === false ? "Aktif et" : "Pasife al"}
            onPress={onToggleActive}
            variant={selectedPackage.isActive === false ? "secondary" : "danger"}
            loading={toggling}
          />
        ) : null}
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
  },
  loadingList: {
    gap: 12,
    paddingBottom: 12,
  },
  list: {
    gap: 12,
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
});
