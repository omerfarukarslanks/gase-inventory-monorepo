import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Banner, Card, EmptyStateWithAction, ListRow, SectionTitle } from "@/src/components/ui";
import { mobileTheme } from "@/src/theme";
import { StyleSheet, Text, View } from "react-native";
import { formatCount, formatCurrency, toNumber } from "@/src/lib/format";
import type { Store } from "@gase/core";
import type { useSalesComposer } from "../hooks/useSalesComposer";

type ComposerReviewStepProps = {
  composer: ReturnType<typeof useSalesComposer>;
  visibleStores: Store[];
};

const styles = StyleSheet.create({
  summaryGrid: { marginTop: 12, gap: 12 },
  summaryItem: { gap: 4 },
  summaryLabel: { color: mobileTheme.colors.dark.text2, fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
  summaryValue: { color: mobileTheme.colors.dark.text, fontSize: 15, fontWeight: "700" },
  list: { marginTop: 12, gap: 12 },
});

export function ComposerReviewStep({ composer, visibleStores }: ComposerReviewStepProps) {
  const { draft, validLines, draftTotal, stepErrors, changeStep } = composer;

  return (
    <>
      {stepErrors.review ? <Banner text={stepErrors.review} /> : null}
      <Card>
        <SectionTitle title="Satis ozeti" />
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Musteri</Text>
            <Text style={styles.summaryValue}>{draft.customerLabel}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Magaza</Text>
            <Text style={styles.summaryValue}>
              {visibleStores.find((store) => store.id === draft.storeId)?.name ?? "-"}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Satir sayisi</Text>
            <Text style={styles.summaryValue}>{formatCount(validLines.length)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Toplam</Text>
            <Text style={styles.summaryValue}>{formatCurrency(draftTotal, "TRY")}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Ilk odeme</Text>
            <Text style={styles.summaryValue}>{formatCurrency(draft.paymentAmount, "TRY")}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <SectionTitle title="Satir kontrolu" />
        {validLines.length ? (
          <View style={styles.list}>
            {validLines.map((line) => (
              <ListRow
                key={line.id}
                title={line.label}
                subtitle={`${formatCount(line.quantity)} adet`}
                caption={formatCurrency(toNumber(line.quantity) * toNumber(line.unitPrice), line.currency)}
                badgeLabel={line.currency}
                badgeTone="info"
                icon={<MaterialCommunityIcons name="package-variant" size={20} color={mobileTheme.colors.brand.primary} />}
              />
            ))}
          </View>
        ) : (
          <EmptyStateWithAction
            title="Satir hazir degil."
            subtitle="Urun ekleyip miktar ve fiyat bilgisini tamamla."
            actionLabel="Urunlere don"
            onAction={() => changeStep("items")}
          />
        )}
      </Card>
    </>
  );
}
