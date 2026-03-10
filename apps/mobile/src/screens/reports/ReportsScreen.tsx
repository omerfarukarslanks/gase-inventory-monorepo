import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useAuth } from "@/src/context/AuthContext";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  FilterTabs,
  ScreenHeader,
  SectionTitle,
} from "@/src/components/ui";
import { formatCount, formatCurrency } from "@/src/lib/format";
import { useReportPermissions } from "./hooks/useReportPermissions";
import { useReportData } from "./hooks/useReportData";
import { useReportDetail } from "./hooks/useReportDetail";
import { ReportDetailView } from "./views/ReportDetailView";
import { QuickInsightsSection } from "./views/QuickInsightsSection";
import { ReportCatalogSection } from "./views/ReportCatalogSection";
import { formatPercent } from "./utils/reportHelpers";
import { rangeOptions, type ReportDetailKey, type ReportMetric } from "./types";
import { reportStyles as styles } from "./styles";

export default function ReportsScreen({
  isActive = true,
  onBack,
}: {
  isActive?: boolean;
  onBack?: () => void;
}) {
  const { storeIds } = useAuth();
  const permissions = useReportPermissions();

  // detailKey lifted here so both useReportData and useReportDetail can share it
  const [detailKey, setDetailKey] = useState<ReportDetailKey | null>(null);

  const data = useReportData({ detailKey, isActive, permissions });
  const { range, setRange, state, scope, fetchReports } = data;

  const detail = useReportDetail({ isActive, range, scope, detailKey, setDetailKey });
  const { detailState, openDetail, closeDetail, loadDetail } = detail;

  const rangeLabel = range === "30d" ? "Son 30 gun" : "Son 7 gun";
  const storeScopeLabel = storeIds.length ? `${storeIds.length} magaza` : "Tum magazalar";

  const metricCards = useMemo(() => {
    const cards: ReportMetric[] = [];

    if (permissions.canReadSales || permissions.canReadFinancial) {
      cards.push({
        key: "sales",
        label: "Toplam satis",
        value: formatCurrency(state.salesSummary?.totals?.totalLineTotal, "TRY"),
        hint: `${formatCount(state.salesSummary?.totals?.saleCount)} islem`,
      });
    }

    if (permissions.canReadSales) {
      cards.push({
        key: "confirmed",
        label: "Onayli siparis",
        value: formatCount(state.confirmedOrders?.totals?.orderCount),
        hint: formatCurrency(state.confirmedOrders?.totals?.totalLineTotal, "TRY"),
      });
      cards.push({
        key: "returns",
        label: "Iade",
        value: formatCount(state.returns?.totals?.orderCount),
        hint: formatCurrency(state.returns?.totals?.totalLineTotal, "TRY"),
      });
    }

    if (permissions.canReadStock) {
      cards.push({
        key: "stock",
        label: "Toplam stok",
        value: formatCount(state.stockTotal?.totals?.todayTotalQuantity),
        hint: `Degisim ${formatPercent(state.stockTotal?.comparison?.changePercent)}`,
      });
    }

    return cards;
  }, [permissions, state.confirmedOrders, state.returns, state.salesSummary, state.stockTotal]);

  const reportCatalog = useMemo(() => {
    const groups: { title: string; items: { key: any; title: string; description: string }[] }[] = [];

    const salesItems: { key: any; title: string; description: string }[] = [];
    if (permissions.canReadSales || permissions.canReadFinancial) {
      salesItems.push({ key: "sales-summary", title: "Satis ozeti", description: "Toplam satis, sepet, onay ve iade dengesi." });
    }
    if (permissions.canReadSales) {
      salesItems.push(
        { key: "cancellations", title: "Iptaller", description: "Iptal edilen fis ve tutar hareketleri." },
        { key: "product-performance", title: "Urun performansi", description: "En iyi satis ve gelir ureten varyantlar." },
        { key: "supplier-performance", title: "Tedarikci performansi", description: "Tedarikci bazli satis ve miktar etkisi." },
      );
    }
    if (salesItems.length) groups.push({ title: "Satis", items: salesItems });

    const stockItems: { key: any; title: string; description: string }[] = [];
    if (permissions.canReadStock) {
      stockItems.push(
        { key: "stock-summary", title: "Stok ozeti", description: "Urun ve varyant bazli mevcut stok dagilimi." },
        { key: "low-stock", title: "Kritik stok", description: "Esik altina dusen varyantlarin listesi." },
      );
    }
    if (permissions.canReadInventory || permissions.canReadStock) {
      stockItems.push(
        { key: "dead-stock", title: "Dead stock", description: "Uzun suredir satilmayan stok kalemleri." },
        { key: "inventory-movements", title: "Envanter hareketleri", description: "Hareket tipi ve son stok aksiyonlari." },
        { key: "turnover", title: "Turnover", description: "Devir hizi ve supply days analizi." },
      );
    }
    if (stockItems.length) groups.push({ title: "Stok", items: stockItems });

    const financeItems: { key: any; title: string; description: string }[] = [];
    if (permissions.canReadFinancial) {
      financeItems.push(
        { key: "revenue-trend", title: "Gelir trendi", description: "Donemsel ciro ve satis ritmi." },
        { key: "profit-margin", title: "Kar marji", description: "Gelir, maliyet ve brut kar dagilimi." },
        { key: "discount-summary", title: "Indirim ozeti", description: "Kampanya ve magaza bazli indirimler." },
        { key: "vat-summary", title: "KDV ozeti", description: "Vergi orani ve brut toplam dagilimi." },
      );
    }
    if (financeItems.length) groups.push({ title: "Finans", items: financeItems });

    const peopleItems: { key: any; title: string; description: string }[] = [];
    if (permissions.canReadSales || permissions.canReadFinancial) {
      peopleItems.push({ key: "store-performance", title: "Magaza performansi", description: "Magaza bazli satis ve sepet etkisi." });
    }
    if (permissions.canReadEmployee) {
      peopleItems.push({ key: "employee-performance", title: "Calisan performansi", description: "Ekip bazli satis ve verim gorunumu." });
    }
    if (permissions.canReadCustomers) {
      peopleItems.push({ key: "customers", title: "Musteri analizi", description: "Top musteri harcama ve siparis davranisi." });
    }
    if (peopleItems.length) groups.push({ title: "Insan", items: peopleItems });

    return groups;
  }, [permissions]);

  if (detailKey) {
    return (
      <ReportDetailView
        detailKey={detailKey}
        detailState={detailState}
        range={range}
        setRange={setRange}
        rangeLabel={rangeLabel}
        storeScopeLabel={storeScopeLabel}
        onBack={closeDetail}
        onRefresh={() => void loadDetail(detailKey)}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="Quick insights"
          subtitle="Mobilde hizli rapor ozeti ve detay merkezi"
          onBack={onBack}
          action={
            <Button
              label="Yenile"
              onPress={() => void fetchReports()}
              variant="secondary"
              size="sm"
              fullWidth={false}
            />
          }
        />

        {state.error ? <Banner text={state.error} /> : null}

        <Card>
          <SectionTitle title="Rapor kapsami" />
          <View style={styles.scopeBlock}>
            <FilterTabs value={range} options={rangeOptions} onChange={setRange} />
            <View style={styles.scopeStats}>
              <View style={styles.scopeStat}>
                <Text style={styles.scopeLabel}>Donem</Text>
                <Text style={styles.scopeValue}>{rangeLabel}</Text>
              </View>
              <View style={styles.scopeStat}>
                <Text style={styles.scopeLabel}>Scope</Text>
                <Text style={styles.scopeValue}>{storeScopeLabel}</Text>
              </View>
            </View>
          </View>
        </Card>

        {!permissions.hasAnyReports ? (
          <EmptyStateWithAction
            title="Bu hesap icin desteklenen mobil rapor yok."
            subtitle="Rapor merkezi satis, stok, finans, ekip veya musteri okuma izinleriyle calisir."
            actionLabel="Geri don"
            onAction={() => onBack?.()}
          />
        ) : (
          <>
            {permissions.hasQuickInsights ? (
              <QuickInsightsSection
                state={state}
                metricCards={metricCards}
                storeScopeLabel={storeScopeLabel}
                canReadFinancial={permissions.canReadFinancial}
                canReadSales={permissions.canReadSales}
                canReadStock={permissions.canReadStock}
                onDetailClick={openDetail}
                onRefresh={() => void fetchReports()}
              />
            ) : null}

            <ReportCatalogSection catalog={reportCatalog} onSelect={openDetail} />
          </>
        )}
      </ScrollView>
    </View>
  );
}
