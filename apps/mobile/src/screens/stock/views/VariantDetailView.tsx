import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  type Currency,
  type InventoryProductStockItem,
  type InventoryStoreStockItem,
  type InventoryVariantStockItem,
  type Store,
  type Supplier,
} from "@gase/core";
import type { Dispatch, SetStateAction } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  ListRow,
  SectionTitle,
  StickyActionBar,
  ScreenHeader,
} from "@/src/components/ui";
import { formatCount, formatCurrency, toNumber } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";
import type { ActiveOperation } from "../hooks/useStockOperations";
import type { ReceiveForm, TransferForm, AdjustForm } from "../hooks/useOperationForm";
import { OperationSheet } from "./OperationSheet";

type VariantDetailViewProps = {
  selectedProduct: InventoryProductStockItem;
  selectedVariant: InventoryVariantStockItem;
  storesForVariant: InventoryStoreStockItem[];
  selectedStoreId: string;
  error: string;
  onBack: () => void;
  onReceive: () => void;
  onTransfer: () => void;
  onAdjust: () => void;
  onResolveVariantStores: (variant: InventoryVariantStockItem) => void;
  // OperationSheet props
  activeOperation: ActiveOperation | null;
  setActiveOperation: Dispatch<SetStateAction<ActiveOperation | null>>;
  setOperationAttempted: Dispatch<SetStateAction<boolean>>;
  operationError: string;
  setOperationError: Dispatch<SetStateAction<string>>;
  stores: Store[];
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
};

export function VariantDetailView({
  selectedProduct,
  selectedVariant,
  storesForVariant,
  selectedStoreId,
  error,
  onBack,
  onReceive,
  onTransfer,
  onAdjust,
  onResolveVariantStores,
  activeOperation,
  setActiveOperation,
  setOperationAttempted,
  operationError,
  setOperationError,
  stores,
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
}: VariantDetailViewProps) {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <ScreenHeader
          title={selectedVariant.variantName}
          subtitle={`${selectedProduct.productName} icin magaza bazli stok`}
          onBack={onBack}
        />

        {error ? <Banner text={error} /> : null}

        <Card>
          <SectionTitle title="Varyant ozeti" />
          <View style={styles.detailStats}>
            <View style={styles.detailStat}>
              <Text style={styles.detailLabel}>Kod</Text>
              <Text style={styles.detailValue}>{selectedVariant.variantCode ?? "-"}</Text>
            </View>
            <View style={styles.detailStat}>
              <Text style={styles.detailLabel}>Toplam stok</Text>
              <Text style={styles.detailValue}>{formatCount(selectedVariant.totalQuantity)} adet</Text>
            </View>
          </View>
        </Card>

        <Card>
          <SectionTitle title="Magaza dagilimi" />
          <View style={styles.variantList}>
            {storesForVariant.length ? (
              storesForVariant.map((store) => (
                <ListRow
                  key={`${selectedVariant.productVariantId}-${store.storeId}`}
                  title={store.storeName}
                  subtitle={`${formatCount(store.quantity)} adet`}
                  caption={formatCurrency(store.salePrice ?? store.unitPrice, (store.currency ?? "TRY") as Currency)}
                  badgeLabel={selectedStoreId === store.storeId ? "Filtrede" : "Magaza"}
                  badgeTone={selectedStoreId === store.storeId ? "info" : "neutral"}
                  icon={<MaterialCommunityIcons name="storefront-outline" size={20} color={mobileTheme.colors.brand.primary} />}
                />
              ))
            ) : (
              <EmptyStateWithAction
                title="Magaza dagilimi bulunamadi."
                subtitle="Varyant stok hareketini yeniden sorgula."
                actionLabel="Yenile"
                onAction={() => onResolveVariantStores(selectedVariant)}
              />
            )}
          </View>
        </Card>
      </ScrollView>

      <StickyActionBar>
        <Button label="Alim" onPress={onReceive} variant="secondary" />
        <Button label="Transfer" onPress={onTransfer} variant="ghost" />
        <Button label="Duzelt" onPress={onAdjust} />
      </StickyActionBar>

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
  variantList: {
    marginTop: 12,
    gap: 12,
  },
});
