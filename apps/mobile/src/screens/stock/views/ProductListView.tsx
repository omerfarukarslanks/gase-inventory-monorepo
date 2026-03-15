import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  type InventoryProductStockItem,
  type InventoryVariantStockItem,
  type Store,
  type Supplier,
} from "@gase/core";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  FilterTabs,
  ListRow,
  ModalSheet,
  ScreenHeader,
  SearchBar,
  SectionTitle,
  SelectionList,
  SkeletonBlock,
  StickyActionBar,
} from "@/src/components/ui";
import { trackEvent } from "@/src/lib/analytics";
import { formatCount, toNumber } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";
import type { ActiveOperation } from "../hooks/useStockOperations";
import type { ReceiveForm, TransferForm, AdjustForm } from "../hooks/useOperationForm";
import type { CriticalQueueItem } from "../hooks/useStockFiltering";
import { OperationSheet } from "./OperationSheet";

const LOW_STOCK_THRESHOLD = 50;

const priorityOptions = [
  { label: "Tum", value: "all" as const },
  { label: "Dusuk stok", value: "low" as const },
];

type ProductListViewProps = {
  filteredProducts: InventoryProductStockItem[];
  loading: boolean;
  error: string;
  search: string;
  setSearch: (value: string) => void;
  priorityFilter: "all" | "low";
  setPriorityFilter: (value: "all" | "low") => void;
  selectedStoreId: string;
  selectedStoreName: string;
  visibleVariantCount: number;
  criticalQueue: CriticalQueueItem[];
  criticalQueuePreview: CriticalQueueItem[];
  storePickerOpen: boolean;
  setStorePickerOpen: (value: boolean) => void;
  stores: Store[];
  setSelectedStoreId: (value: string) => void;
  onProductPress: (product: InventoryProductStockItem) => void;
  onOpenVariantDetail: (product: InventoryProductStockItem, variant: InventoryVariantStockItem) => void;
  onOpenOperation: (kind: "receive" | "transfer" | "adjust", variant: InventoryVariantStockItem, productName?: string) => void;
  onFetchStock: () => void;
  onResetFilters: () => void;
  segmentControl?: ReactNode;
  // OperationSheet props
  activeOperation: ActiveOperation | null;
  setActiveOperation: Dispatch<SetStateAction<ActiveOperation | null>>;
  setOperationAttempted: Dispatch<SetStateAction<boolean>>;
  operationError: string;
  setOperationError: Dispatch<SetStateAction<string>>;
  suppliers: Supplier[];
  receiveForm: ReceiveForm;
  setReceiveForm: Dispatch<SetStateAction<ReceiveForm>>;
  transferForm: TransferForm;
  setTransferForm: Dispatch<SetStateAction<TransferForm>>;
  adjustForm: AdjustForm;
  setAdjustForm: Dispatch<SetStateAction<AdjustForm>>;
  operationAttempted: boolean;
  receiveStoreError: string;
  receiveQuantityError: string;
  receiveUnitPriceError: string;
  transferFromStoreError: string;
  transferToStoreError: string;
  transferQuantityError: string;
  adjustStoreError: string;
  adjustQuantityError: string;
  receiveStoreQuantity: number;
  transferSourceQuantity: number;
  adjustStoreQuantity: number;
  submitting: boolean;
  canSubmit: boolean;
  onSubmit: () => Promise<void>;
  segmentControl?: ReactNode;
};

export function ProductListView({
  filteredProducts,
  loading,
  error,
  search,
  setSearch,
  priorityFilter,
  setPriorityFilter,
  selectedStoreName,
  visibleVariantCount,
  criticalQueue,
  criticalQueuePreview,
  storePickerOpen,
  setStorePickerOpen,
  stores,
  selectedStoreId,
  setSelectedStoreId,
  onProductPress,
  onOpenVariantDetail,
  onOpenOperation,
  onFetchStock,
  onResetFilters,
  segmentControl,
  activeOperation,
  setActiveOperation,
  setOperationAttempted,
  operationError,
  setOperationError,
  suppliers,
  receiveForm,
  setReceiveForm,
  transferForm,
  setTransferForm,
  adjustForm,
  setAdjustForm,
  operationAttempted,
  receiveStoreError,
  receiveQuantityError,
  receiveUnitPriceError,
  transferFromStoreError,
  transferToStoreError,
  transferQuantityError,
  adjustStoreError,
  adjustQuantityError,
  receiveStoreQuantity,
  transferSourceQuantity,
  adjustStoreQuantity,
  submitting,
  canSubmit,
  onSubmit,
  segmentControl,
}: ProductListViewProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        {segmentControl}
        <ScreenHeader
          title="Stok"
          subtitle="Urunu sec, varyanti ac, sonra operasyonu baslat"
          action={<Button label="Yenile" onPress={onFetchStock} variant="secondary" size="sm" fullWidth={false} />}
        />

        {error ? <Banner text={error} /> : null}

        <Card>
          <View style={styles.filterStack}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Urun, varyant veya barkod ara"
            />
            <FilterTabs value={priorityFilter} options={priorityOptions} onChange={setPriorityFilter} />
            <Button
              label={`Magaza: ${selectedStoreName}`}
              onPress={() => setStorePickerOpen(true)}
              variant="ghost"
              icon={<MaterialCommunityIcons name="storefront-outline" size={16} color={mobileTheme.colors.dark.text} />}
            />
          </View>
        </Card>
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
          data={filteredProducts}
          keyExtractor={(item) => item.productId}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Card>
                <SectionTitle title="Stok baglami" />
                <View style={styles.contextStats}>
                  <View style={styles.contextStat}>
                    <Text style={styles.detailLabel}>Magaza</Text>
                    <Text style={styles.detailValue}>{selectedStoreName}</Text>
                  </View>
                  <View style={styles.contextStat}>
                    <Text style={styles.detailLabel}>Urun</Text>
                    <Text style={styles.detailValue}>{formatCount(filteredProducts.length)}</Text>
                  </View>
                  <View style={styles.contextStat}>
                    <Text style={styles.detailLabel}>Varyant</Text>
                    <Text style={styles.detailValue}>{formatCount(visibleVariantCount)}</Text>
                  </View>
                  <View style={styles.contextStat}>
                    <Text style={styles.detailLabel}>Kritik</Text>
                    <Text style={styles.detailValue}>{formatCount(criticalQueue.length)}</Text>
                  </View>
                </View>
              </Card>

              {criticalQueuePreview.length ? (
                <Card>
                  <SectionTitle
                    title="Kritik stok kuyrugu"
                    action={
                      <Button
                        label={priorityFilter === "low" ? "Tumunu goster" : "Sadece kritik"}
                        onPress={() =>
                          setPriorityFilter(priorityFilter === "low" ? "all" : "low")
                        }
                        variant="secondary"
                        size="sm"
                        fullWidth={false}
                      />
                    }
                  />
                  <View style={styles.queueList}>
                    {criticalQueuePreview.map((item) => (
                      <Card
                        key={`${item.product.productId}-${item.variant.productVariantId}`}
                        style={styles.queueCard}
                      >
                        <Text style={styles.queueTitle}>{item.variant.variantName}</Text>
                        <Text style={styles.queueSubtitle}>{item.product.productName}</Text>
                        <Text style={styles.queueMeta}>
                          {`${formatCount(item.variant.totalQuantity)} adet • Kod: ${
                            item.variant.variantCode ?? "-"
                          }`}
                        </Text>
                        <View style={styles.queueActions}>
                          <Button
                            label="Detay"
                            onPress={() => onOpenVariantDetail(item.product, item.variant)}
                            variant="ghost"
                            size="sm"
                            fullWidth={false}
                          />
                          <Button
                            label="Alim"
                            onPress={() =>
                              onOpenOperation("receive", item.variant, item.product.productName)
                            }
                            variant="secondary"
                            size="sm"
                            fullWidth={false}
                          />
                          <Button
                            label="Duzelt"
                            onPress={() =>
                              onOpenOperation("adjust", item.variant, item.product.productName)
                            }
                            size="sm"
                            fullWidth={false}
                          />
                        </View>
                      </Card>
                    ))}
                  </View>
                </Card>
              ) : null}
            </View>
          }
          renderItem={({ item }) => {
            const lowVariantCount = (item.variants ?? []).filter(
              (variant) => Number(variant.totalQuantity ?? 0) <= LOW_STOCK_THRESHOLD,
            ).length;
            return (
              <ListRow
                title={item.productName}
                subtitle={`Toplam ${formatCount(item.totalQuantity)} adet`}
                caption={`${formatCount(item.variants?.length ?? 0)} varyant • ${lowVariantCount ? `${lowVariantCount} kritik varyant` : "kritik varyant yok"}`}
                badgeLabel={lowVariantCount ? "Oncelik" : "Normal"}
                badgeTone={lowVariantCount ? "warning" : "positive"}
                onPress={() => onProductPress(item)}
                icon={<MaterialCommunityIcons name="warehouse" size={20} color={mobileTheme.colors.brand.primary} />}
              />
            );
          }}
          ListEmptyComponent={
            <EmptyStateWithAction
              title="Stok verisi bulunamadi."
              subtitle="Aramayi temizle veya magaza filtresini genislet."
              actionLabel="Filtreyi temizle"
              onAction={() => {
                trackEvent("empty_state_action_clicked", { screen: "stock", target: "reset_filters" });
                onResetFilters();
              }}
            />
          }
        />
      )}

      <StickyActionBar>
        <Button label="Filtreyi temizle" onPress={onResetFilters} variant="ghost" />
        <Button label="Magaza sec" onPress={() => setStorePickerOpen(true)} variant="secondary" />
      </StickyActionBar>

      <ModalSheet
        visible={storePickerOpen}
        title="Magaza filtresi"
        subtitle="Stok ozetini belirli magazaya daralt"
        onClose={() => setStorePickerOpen(false)}
      >
        <SelectionList
          items={[
            { label: "Tum magazalar", value: "all", description: "Tum stoklar gorunur" },
            ...stores.map((store) => ({
              label: store.name,
              value: store.id,
              description: store.code,
            })),
          ]}
          selectedValue={selectedStoreId || "all"}
          onSelect={(value) => {
            setSelectedStoreId(value === "all" ? "" : value);
            setStorePickerOpen(false);
          }}
        />
      </ModalSheet>

      <OperationSheet
        activeOperation={activeOperation}
        setActiveOperation={setActiveOperation}
        setOperationAttempted={setOperationAttempted}
        operationError={operationError}
        setOperationError={setOperationError}
        stores={stores}
        suppliers={suppliers}
        receiveForm={receiveForm}
        setReceiveForm={setReceiveForm}
        transferForm={transferForm}
        setTransferForm={setTransferForm}
        adjustForm={adjustForm}
        setAdjustForm={setAdjustForm}
        operationAttempted={operationAttempted}
        receiveStoreError={receiveStoreError}
        receiveQuantityError={receiveQuantityError}
        receiveUnitPriceError={receiveUnitPriceError}
        transferFromStoreError={transferFromStoreError}
        transferToStoreError={transferToStoreError}
        transferQuantityError={transferQuantityError}
        adjustStoreError={adjustStoreError}
        adjustQuantityError={adjustQuantityError}
        receiveStoreQuantity={receiveStoreQuantity}
        transferSourceQuantity={transferSourceQuantity}
        adjustStoreQuantity={adjustStoreQuantity}
        submitting={submitting}
        canSubmit={canSubmit}
        onSubmit={onSubmit}
      />
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
  filterStack: {
    gap: 12,
  },
  listWrap: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 12,
  },
  listHeader: {
    gap: 12,
    marginBottom: 12,
  },
  loadingList: {
    gap: 12,
    paddingBottom: 120,
  },
  contextStats: {
    marginTop: 12,
    gap: 12,
  },
  contextStat: {
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
  queueList: {
    marginTop: 12,
    gap: 12,
  },
  queueCard: {
    gap: 10,
  },
  queueTitle: {
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
  queueSubtitle: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 13,
    lineHeight: 18,
  },
  queueMeta: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
    lineHeight: 18,
  },
  queueActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
