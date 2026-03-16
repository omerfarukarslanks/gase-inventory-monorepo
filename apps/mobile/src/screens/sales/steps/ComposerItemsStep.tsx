import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Card, InlineFieldError, ListRow, SectionTitle, TextField } from "@/src/components/ui";
import { mobileTheme } from "@/src/theme";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { formatCount, formatCurrency } from "@/src/lib/format";
import type { SalesRecentVariant } from "@/src/lib/salesRecents";
import type { useSalesComposer } from "../hooks/useSalesComposer";
import { createLine, createQuickPickFromRecent } from "../hooks/validators";

type ComposerItemsStepProps = {
  composer: ReturnType<typeof useSalesComposer>;
  recentVariants: SalesRecentVariant[];
  onOpenVariantPicker: (lineId: string, initialSearch?: string) => void;
};

const styles = StyleSheet.create({
  sectionContent: { marginTop: 12, gap: 12 },
  list: { marginTop: 12, gap: 12 },
  lineCard: { gap: 10 },
  lineLabel: { color: mobileTheme.colors.dark.text, fontSize: 14, fontWeight: "700" },
});

export function ComposerItemsStep({
  composer,
  recentVariants,
  onOpenVariantPicker,
}: ComposerItemsStepProps) {
  const { draft, setDraft, attempted, lineValidation, stepErrors, applyVariantQuickPick } = composer;

  // Barkod taramasından gelen sorgu: mount'ta picker'ı otomatik aç ve sorguyu temizle
  const firstLineId = draft.lines[0]?.id;
  useEffect(() => {
    if (!draft.variantBarcodeQuery || !firstLineId) return;
    const query = draft.variantBarcodeQuery;
    setDraft((current) => ({ ...current, variantBarcodeQuery: undefined }));
    onOpenVariantPicker(firstLineId, query);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {recentVariants.length ? (
        <Card>
          <SectionTitle title="Son kullanilan varyantlar" />
          <View style={styles.list}>
            {recentVariants.map((variant) => (
              <ListRow
                key={variant.productVariantId}
                title={variant.label}
                subtitle={variant.code ?? "Hizli ekle"}
                caption={`${formatCount(variant.totalQuantity)} adet • ${formatCurrency(
                  variant.unitPrice ?? 0,
                  variant.currency,
                )}`}
                onPress={() => applyVariantQuickPick(createQuickPickFromRecent(variant))}
                icon={
                  <MaterialCommunityIcons
                    name="barcode-scan"
                    size={20}
                    color={mobileTheme.colors.brand.primary}
                  />
                }
              />
            ))}
          </View>
        </Card>
      ) : null}

      <Card>
        <SectionTitle
          title={`Satis satirlari (${draft.lines.length})`}
          action={
            <Button
              label="Satir ekle"
              onPress={() =>
                setDraft((current) => ({ ...current, lines: [...current.lines, createLine()] }))
              }
              variant="secondary"
              size="sm"
              fullWidth={false}
            />
          }
        />
        <View style={styles.sectionContent}>
          {draft.lines.map((line) => (
            <Card key={line.id} style={styles.lineCard}>
              <Text style={styles.lineLabel}>{line.label}</Text>
              <Button
                label={line.variantId ? "Varyanti degistir" : "Barkod / SKU ile sec"}
                onPress={() => onOpenVariantPicker(line.id)}
                variant="ghost"
              />
              <InlineFieldError
                text={attempted ? lineValidation[line.id]?.variant : ""}
              />
              <TextField
                label="Miktar"
                value={line.quantity}
                onChangeText={(value) =>
                  setDraft((current) => ({
                    ...current,
                    lines: current.lines.map((item) =>
                      item.id === line.id ? { ...item, quantity: value } : item,
                    ),
                  }))
                }
                keyboardType="numeric"
                inputMode="numeric"
                errorText={attempted ? lineValidation[line.id]?.quantity : ""}
              />
              <TextField
                label="Birim fiyat"
                value={line.unitPrice}
                onChangeText={(value) =>
                  setDraft((current) => ({
                    ...current,
                    lines: current.lines.map((item) =>
                      item.id === line.id ? { ...item, unitPrice: value } : item,
                    ),
                  }))
                }
                keyboardType="numeric"
                inputMode="decimal"
                helperText="Varyant secildiginde son bilinen satis fiyati onerilir."
                errorText={attempted ? lineValidation[line.id]?.unitPrice : ""}
              />
              {draft.lines.length > 1 ? (
                <Button
                  label="Satiri sil"
                  onPress={() =>
                    setDraft((current) => ({
                      ...current,
                      lines: current.lines.filter((item) => item.id !== line.id),
                    }))
                  }
                  variant="ghost"
                />
              ) : null}
            </Card>
          ))}
          <InlineFieldError text={stepErrors.items} />
        </View>
      </Card>
    </>
  );
}
