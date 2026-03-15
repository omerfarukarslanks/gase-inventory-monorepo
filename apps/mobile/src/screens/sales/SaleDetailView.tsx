import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  ListRow,
  ScreenHeader,
  SectionTitle,
  SkeletonBlock,
  StickyActionBar,
} from "@/src/components/ui";
import { mobileTheme } from "@/src/theme";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { formatCount, formatCurrency, formatDate } from "@/src/lib/format";
import type { useSaleDetail } from "./hooks/useSaleDetail";
import type { usePaymentEditor } from "./hooks/usePaymentEditor";
import type { useCancelSale } from "./hooks/useCancelSale";
import type { useReturnSale } from "./hooks/useReturnSale";
import { PaymentEditorModal } from "./modals/PaymentEditorModal";
import { CancelSaleModal } from "./modals/CancelSaleModal";
import { ReturnSaleModal } from "./modals/ReturnSaleModal";
import { downloadSaleReceipt } from "@gase/core";
import { useAuth } from "@/src/context/AuthContext";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

type SaleDetailViewProps = {
  detail: ReturnType<typeof useSaleDetail>;
  paymentEditor: ReturnType<typeof usePaymentEditor>;
  cancelSale: ReturnType<typeof useCancelSale>;
  returnSale: ReturnType<typeof useReturnSale>;
  onBack: () => void;
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: mobileTheme.colors.dark.bg },
  screenContent: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  loadingList: { gap: 12, paddingBottom: 120 },
  list: { marginTop: 12, gap: 12 },
  summaryGrid: { marginTop: 12, gap: 12 },
  summaryItem: { gap: 4 },
  summaryLabel: { color: mobileTheme.colors.dark.text2, fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
  summaryValue: { color: mobileTheme.colors.dark.text, fontSize: 15, fontWeight: "700" },
});

export function SaleDetailView({
  detail,
  paymentEditor,
  cancelSale,
  returnSale,
  onBack,
}: SaleDetailViewProps) {
  const { data, payments, loading, error, remainingAmount } = detail;
  const { token } = useAuth();
  const [shareLoading, setShareLoading] = useState(false);

  const shareReceipt = async () => {
    if (!data?.id) return;
    setShareLoading(true);
    try {
      const blob = await downloadSaleReceipt(data.id, token ?? undefined);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(",")[1];
          const fileUri = `${FileSystem.cacheDirectory}fis-${data.receiptNo ?? data.id}.pdf`;
          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(fileUri, {
              mimeType: "application/pdf",
              dialogTitle: `Fis ${data.receiptNo ?? ""}`,
              UTI: "com.adobe.pdf",
            });
          } else {
            Alert.alert("Paylasim desteklenmiyor", "Cihaziniz dosya paylasimini desteklemiyor.");
          }
        } catch {
          Alert.alert("Hata", "Fis paylasilamadi.");
        } finally {
          setShareLoading(false);
        }
      };
      reader.onerror = () => {
        Alert.alert("Hata", "Fis okunamadi.");
        setShareLoading(false);
      };
      reader.readAsDataURL(blob);
    } catch {
      Alert.alert("Hata", "Fis indirilemedi.");
      setShareLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <ScreenHeader
          title={data?.receiptNo ?? "Satis detayi"}
          subtitle={data ? `${data.name ?? "-"} ${data.surname ?? ""}`.trim() : "Satis ozeti"}
          onBack={onBack}
        />

        {error ? <Banner text={error} /> : null}

        {loading ? (
          <View style={styles.loadingList}>
            <SkeletonBlock height={96} />
            <SkeletonBlock height={84} />
            <SkeletonBlock height={84} />
          </View>
        ) : data ? (
          <>
            <Card>
              <SectionTitle title="Satis ozeti" />
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Magaza</Text>
                  <Text style={styles.summaryValue}>{data.storeName ?? "-"}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Toplam</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(data.lineTotal, data.currency ?? "TRY")}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Odenen</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(data.paidAmount, data.currency ?? "TRY")}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Kalan</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(data.remainingAmount, data.currency ?? "TRY")}</Text>
                </View>
              </View>
            </Card>

            <Card>
              <SectionTitle title={`Satirlar (${data.lines.length})`} />
              <View style={styles.list}>
                {data.lines.map((line) => (
                  <ListRow
                    key={line.id}
                    title={line.productVariantName ?? line.productName ?? "-"}
                    subtitle={`${formatCount(line.quantity)} adet`}
                    caption={formatCurrency(line.lineTotal, line.currency ?? data.currency ?? "TRY")}
                    badgeLabel={`Iade ${formatCount(line.returnedQuantity)}`}
                    badgeTone="warning"
                    icon={<MaterialCommunityIcons name="package-variant" size={20} color={mobileTheme.colors.brand.primary} />}
                  />
                ))}
              </View>
            </Card>

            <Card>
              <SectionTitle
                title={`Odemeler (${payments.length})`}
                action={
                  <Button
                    label={remainingAmount > 0 ? "Kalani tahsil et" : "Odeme ekle"}
                    onPress={() => paymentEditor.open(data.id, undefined, remainingAmount > 0 ? String(remainingAmount) : undefined)}
                    variant="secondary"
                    size="sm"
                    fullWidth={false}
                  />
                }
              />
              <View style={styles.list}>
                {payments.length ? (
                  payments.map((payment) => (
                    <ListRow
                      key={payment.id}
                      title={payment.paymentMethod ?? "PAYMENT"}
                      subtitle={formatCurrency(payment.amount, (payment.currency as "TRY" | "USD" | "EUR" | undefined) ?? "TRY")}
                      caption={formatDate(payment.paidAt ?? payment.createdAt)}
                      badgeLabel={payment.status ?? "ACTIVE"}
                      badgeTone="positive"
                      onPress={() => paymentEditor.open(data.id, payment)}
                      icon={<MaterialCommunityIcons name="cash" size={20} color={mobileTheme.colors.brand.primary} />}
                    />
                  ))
                ) : (
                  <EmptyStateWithAction
                    title="Odeme bulunamadi."
                    subtitle="Bu satis icin odeme ekleyebilirsin."
                    actionLabel="Odeme ekle"
                    onAction={() => paymentEditor.open(data.id)}
                  />
                )}
              </View>
            </Card>
          </>
        ) : (
          <EmptyStateWithAction
            title="Detay getirilemedi."
            subtitle="Satis listesinden tekrar dene."
            actionLabel="Listeye don"
            onAction={onBack}
          />
        )}
      </ScrollView>

      {data ? (
        <StickyActionBar>
          <Button
            label={remainingAmount > 0 ? "Kalani tahsil et" : "Odeme"}
            onPress={() => paymentEditor.open(data.id, undefined, remainingAmount > 0 ? String(remainingAmount) : undefined)}
            variant="secondary"
          />
          <Button label="Fis" onPress={() => void shareReceipt()} variant="ghost" loading={shareLoading} />
          <Button label="Iade" onPress={returnSale.prepare} variant="ghost" />
          <Button label="Iptal" onPress={cancelSale.openModal} variant="danger" />
        </StickyActionBar>
      ) : null}

      <PaymentEditorModal paymentEditor={paymentEditor} />
      <CancelSaleModal cancelSale={cancelSale} />
      <ReturnSaleModal returnSale={returnSale} />
    </View>
  );
}
