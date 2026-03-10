import { type AttributeDetail } from "@gase/core";
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
import { sortValues } from "../hooks/useAttributeForm";

type AttributeDetailViewProps = {
  selectedAttribute: AttributeDetail | null;
  detailLoading: boolean;
  error: string;
  canUpdate: boolean;
  canManageValues: boolean;
  togglingAttribute: boolean;
  togglingValueId: string | null;
  onBack: () => void;
  onEditPress: (attribute: AttributeDetail) => void;
  onManageValues: (attribute: AttributeDetail) => void;
  onToggleAttributeActive: (attribute: AttributeDetail) => void;
  onToggleValueActive: (value: { id: string; name: string; isActive: boolean; value?: unknown }, next: boolean) => void;
};

export function AttributeDetailView({
  selectedAttribute,
  detailLoading,
  error,
  canUpdate,
  canManageValues,
  togglingAttribute,
  togglingValueId,
  onBack,
  onEditPress,
  onManageValues,
  onToggleAttributeActive,
  onToggleValueActive,
}: AttributeDetailViewProps) {
  const sortedValues = sortValues(selectedAttribute?.values);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title={selectedAttribute?.name ?? "Ozellik detayi"}
          subtitle="Degerler ve durum yonetimi"
          onBack={onBack}
          action={
            canUpdate && selectedAttribute ? (
              <Button
                label="Duzenle"
                onPress={() => onEditPress(selectedAttribute)}
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
        ) : selectedAttribute ? (
          <>
            <Card>
              <SectionTitle title="Ozellik profili" />
              <View style={styles.detailStats}>
                <View style={styles.detailStat}>
                  <Text style={styles.detailLabel}>Durum</Text>
                  <StatusBadge
                    label={selectedAttribute.isActive ? "aktif" : "pasif"}
                    tone={selectedAttribute.isActive ? "positive" : "neutral"}
                  />
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailLabel}>Deger sayisi</Text>
                  <Text style={styles.detailValue}>{selectedAttribute.values?.length ?? 0}</Text>
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailLabel}>Deger anahtari</Text>
                  <Text style={styles.detailValue}>{String(selectedAttribute.value ?? "-")}</Text>
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailLabel}>Kayit tarihi</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedAttribute.createdAt)}</Text>
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailLabel}>Guncelleme</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedAttribute.updatedAt)}</Text>
                </View>
              </View>
            </Card>

            <Card>
              <SectionTitle title="Ozellik degerleri" />
              <View style={styles.valueList}>
                {sortedValues.length ? (
                  sortedValues.map((value) => (
                    <View key={value.id} style={styles.valueRow}>
                      <View style={styles.valueCopy}>
                        <Text style={styles.valueTitle}>{value.name}</Text>
                        <Text style={styles.valueCaption}>{`Sira: ${String(value.value)}`}</Text>
                      </View>
                      <View style={styles.valueActions}>
                        <StatusBadge
                          label={value.isActive ? "aktif" : "pasif"}
                          tone={value.isActive ? "positive" : "neutral"}
                        />
                        {canUpdate ? (
                          <Button
                            label={value.isActive ? "Pasif" : "Aktif"}
                            onPress={() => onToggleValueActive(value, !value.isActive)}
                            variant={value.isActive ? "ghost" : "secondary"}
                            size="sm"
                            fullWidth={false}
                            loading={togglingValueId === value.id}
                          />
                        ) : null}
                      </View>
                    </View>
                  ))
                ) : (
                  <EmptyStateWithAction
                    title="Bu ozellige ait deger yok."
                    subtitle="Varyant olustururken kullanmak icin deger ekleyebilirsin."
                    actionLabel={canManageValues ? "Deger ekle" : "Listeye don"}
                    onAction={() => {
                      if (canManageValues && selectedAttribute) {
                        onManageValues(selectedAttribute);
                        return;
                      }
                      onBack();
                    }}
                  />
                )}
              </View>
            </Card>

            <Card>
              <SectionTitle title="Operator notu" />
              <Text style={styles.mutedText}>
                Bu ozellik urun varyant matrisinde kullanilir. Deger setini duzenli tutmak,
                varyant secimini ve urun acilis akislarini hizlandirir.
              </Text>
            </Card>
          </>
        ) : (
          <EmptyStateWithAction
            title="Ozellik detayi getirilemedi."
            subtitle="Listeye donup ozelligi yeniden ac."
            actionLabel="Listeye don"
            onAction={onBack}
          />
        )}
      </ScrollView>

      <StickyActionBar>
        <Button label="Listeye don" onPress={onBack} variant="ghost" />
        {canManageValues && selectedAttribute ? (
          <Button
            label="Degerleri yonet"
            onPress={() => onManageValues(selectedAttribute)}
            variant="secondary"
          />
        ) : null}
        {canUpdate && selectedAttribute ? (
          <Button
            label={selectedAttribute.isActive ? "Pasife al" : "Aktif et"}
            onPress={() => onToggleAttributeActive(selectedAttribute)}
            variant={selectedAttribute.isActive ? "danger" : "secondary"}
            loading={togglingAttribute}
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
  valueList: {
    marginTop: 12,
    gap: 10,
  },
  valueRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: mobileTheme.colors.dark.border,
    backgroundColor: mobileTheme.colors.dark.surface2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  valueCopy: {
    gap: 4,
  },
  valueTitle: {
    color: mobileTheme.colors.dark.text,
    fontSize: 14,
    fontWeight: "700",
  },
  valueCaption: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
  },
  valueActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
});
