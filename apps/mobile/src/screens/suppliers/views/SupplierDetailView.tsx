import { type Supplier } from "@gase/core";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  ScreenHeader,
  SectionTitle,
  SkeletonBlock,
  StatusBadge,
  StickyActionBar,
} from "@/src/components/ui";
import { formatDate } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";

type SupplierDetailViewProps = {
  selectedSupplier: Supplier | null;
  detailLoading: boolean;
  error: string;
  toggling: boolean;
  canUpdate: boolean;
  onBack: () => void;
  onEdit: (supplier: Supplier) => void;
  onToggleActive: () => void;
};

export function SupplierDetailView({
  selectedSupplier,
  detailLoading,
  error,
  toggling,
  canUpdate,
  onBack,
  onEdit,
  onToggleActive,
}: SupplierDetailViewProps) {
  const fullName =
    [selectedSupplier?.name, selectedSupplier?.surname]
      .filter(Boolean)
      .join(" ")
      .trim() || "Tedarikci detayi";

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title={fullName}
          subtitle="Iletisim ve durum ozeti"
          onBack={onBack}
          action={
            canUpdate && selectedSupplier ? (
              <Button
                label="Duzenle"
                onPress={() => onEdit(selectedSupplier)}
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
            <SkeletonBlock height={92} />
            <SkeletonBlock height={84} />
          </View>
        ) : selectedSupplier ? (
          <>
            <Card>
              <SectionTitle title="Tedarikci profili" />
              <View style={styles.detailStats}>
                <View style={styles.detailStat}>
                  <Text style={styles.detailLabel}>Durum</Text>
                  <StatusBadge
                    label={selectedSupplier.isActive === false ? "pasif" : "aktif"}
                    tone={selectedSupplier.isActive === false ? "neutral" : "positive"}
                  />
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailLabel}>Telefon</Text>
                  <Text style={styles.detailValue}>
                    {selectedSupplier.phoneNumber ?? "Kayitli telefon yok"}
                  </Text>
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailLabel}>E-posta</Text>
                  <Text style={styles.detailValue}>
                    {selectedSupplier.email ?? "Kayitli e-posta yok"}
                  </Text>
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailLabel}>Adres</Text>
                  <Text style={styles.detailValue}>
                    {selectedSupplier.address ?? "Kayitli adres yok"}
                  </Text>
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailLabel}>Kayit tarihi</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedSupplier.createdAt)}
                  </Text>
                </View>
              </View>
            </Card>

            <Card>
              <SectionTitle title="Operasyon notu" />
              <Text style={styles.mutedText}>
                Stok alim ekraninda bu tedarikci artik secilebilir. Guncel iletisim ve durum bilgisi burada takip edilir.
              </Text>
            </Card>
          </>
        ) : (
          <EmptyStateWithAction
            title="Tedarikci detayi getirilemedi."
            subtitle="Listeye donup tedarikciyi yeniden ac."
            actionLabel="Listeye don"
            onAction={onBack}
          />
        )}
      </ScrollView>

      <StickyActionBar>
        <Button label="Listeye don" onPress={onBack} variant="ghost" />
        {canUpdate && selectedSupplier ? (
          <Button
            label={selectedSupplier.isActive === false ? "Aktif et" : "Pasife al"}
            onPress={onToggleActive}
            variant={selectedSupplier.isActive === false ? "secondary" : "danger"}
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
  mutedText: {
    marginTop: 12,
    color: mobileTheme.colors.dark.text2,
    fontSize: 13,
    lineHeight: 19,
  },
});
