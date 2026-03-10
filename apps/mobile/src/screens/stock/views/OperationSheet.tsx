import {
  type Store,
  type Supplier,
} from "@gase/core";
import type { Dispatch, SetStateAction } from "react";
import { StyleSheet, Text } from "react-native";
import {
  Banner,
  Button,
  InlineFieldError,
  ModalSheet,
  SelectionList,
  TextField,
} from "@/src/components/ui";
import { formatCount } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";
import type { ActiveOperation } from "../hooks/useStockOperations";
import type { ReceiveForm, TransferForm, AdjustForm } from "../hooks/useOperationForm";

type OperationSheetProps = {
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

export function OperationSheet({
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
}: OperationSheetProps) {
  return (
    <ModalSheet
      visible={Boolean(activeOperation)}
      title={
        activeOperation
          ? `${activeOperation.productName ?? "Varyant"} • ${activeOperation.variant.variantName}`
          : "Stok islemi"
      }
      subtitle="Islem detaylarini doldurup tamamla"
      onClose={() => {
        setActiveOperation(null);
        setOperationAttempted(false);
        setOperationError("");
      }}
    >
      {operationError ? <Banner text={operationError} /> : null}
      {activeOperation?.kind === "receive" ? (
        <>
          <Text style={styles.sheetLabel}>Magaza</Text>
          <SelectionList
            items={activeOperation.stores.map((store) => ({
              label: store.storeName,
              value: store.storeId,
              description: `Mevcut stok ${formatCount(store.quantity)}`,
            }))}
            selectedValue={receiveForm.storeId}
            onSelect={(value) => {
              setOperationError("");
              setReceiveForm((current) => ({ ...current, storeId: value }));
            }}
          />
          <InlineFieldError text={receiveStoreError} />
          <TextField
            label="Miktar"
            value={receiveForm.quantity}
            onChangeText={(value) => {
              setOperationError("");
              setReceiveForm((current) => ({ ...current, quantity: value }));
            }}
            keyboardType="numeric"
            inputMode="numeric"
            helperText={`Secili magazada mevcut stok ${formatCount(receiveStoreQuantity)} adet.`}
            errorText={receiveQuantityError}
          />
          <TextField
            label="Birim fiyat"
            value={receiveForm.unitPrice}
            onChangeText={(value) => {
              setOperationError("");
              setReceiveForm((current) => ({ ...current, unitPrice: value }));
            }}
            keyboardType="numeric"
            inputMode="decimal"
            helperText="Bos birakirsan 0 olarak gonderilir."
            errorText={receiveUnitPriceError}
          />
          <Text style={styles.sheetLabel}>Tedarikci</Text>
          <SelectionList
            items={[
              { label: "Secmeden devam et", value: "none", description: "Tedarikci zorunlu degil" },
              ...suppliers.map((supplier) => ({
                label: `${supplier.name}${supplier.surname ? ` ${supplier.surname}` : ""}`,
                value: supplier.id,
                description: supplier.phoneNumber ?? supplier.email ?? "",
              })),
            ]}
            selectedValue={receiveForm.supplierId || "none"}
            onSelect={(value) => {
              setOperationError("");
              setReceiveForm((current) => ({
                ...current,
                supplierId: value === "none" ? "" : value,
              }));
            }}
          />
          <TextField label="Not" value={receiveForm.note} onChangeText={(value) => setReceiveForm((current) => ({ ...current, note: value }))} multiline />
        </>
      ) : null}

      {activeOperation?.kind === "transfer" ? (
        <>
          <Text style={styles.sheetLabel}>Cikis magazasi</Text>
          <SelectionList
            items={activeOperation.stores.map((store) => ({
              label: store.storeName,
              value: store.storeId,
              description: `Mevcut stok ${formatCount(store.quantity)}`,
            }))}
            selectedValue={transferForm.fromStoreId}
            onSelect={(value) => {
              setOperationError("");
              setTransferForm((current) => ({ ...current, fromStoreId: value }));
            }}
          />
          <InlineFieldError text={transferFromStoreError} />
          <Text style={styles.sheetLabel}>Hedef magazasi</Text>
          <SelectionList
            items={stores
              .filter((store) => store.id !== transferForm.fromStoreId)
              .map((store) => ({
                label: store.name,
                value: store.id,
                description: store.code,
              }))}
            selectedValue={transferForm.toStoreId}
            onSelect={(value) => {
              setOperationError("");
              setTransferForm((current) => ({ ...current, toStoreId: value }));
            }}
          />
          <InlineFieldError text={transferToStoreError} />
          <TextField
            label="Miktar"
            value={transferForm.quantity}
            onChangeText={(value) => {
              setOperationError("");
              setTransferForm((current) => ({ ...current, quantity: value }));
            }}
            keyboardType="numeric"
            inputMode="numeric"
            helperText={`Cikis magazasinda ${formatCount(transferSourceQuantity)} adet var.`}
            errorText={transferQuantityError}
          />
          <TextField label="Not" value={transferForm.note} onChangeText={(value) => setTransferForm((current) => ({ ...current, note: value }))} multiline />
        </>
      ) : null}

      {activeOperation?.kind === "adjust" ? (
        <>
          <Text style={styles.sheetLabel}>Magaza</Text>
          <SelectionList
            items={activeOperation.stores.map((store) => ({
              label: store.storeName,
              value: store.storeId,
              description: `Mevcut stok ${formatCount(store.quantity)}`,
            }))}
            selectedValue={adjustForm.storeId}
            onSelect={(value) => {
              setOperationError("");
              setAdjustForm((current) => ({ ...current, storeId: value }));
            }}
          />
          <InlineFieldError text={adjustStoreError} />
          <TextField
            label="Yeni stok miktari"
            value={adjustForm.newQuantity}
            onChangeText={(value) => {
              setOperationError("");
              setAdjustForm((current) => ({ ...current, newQuantity: value }));
            }}
            keyboardType="numeric"
            inputMode="numeric"
            helperText={`Mevcut stok ${formatCount(adjustStoreQuantity)} adet.`}
            errorText={adjustQuantityError}
          />
          <TextField label="Not" value={adjustForm.note} onChangeText={(value) => setAdjustForm((current) => ({ ...current, note: value }))} multiline />
        </>
      ) : null}

      <Button
        label="Islemi tamamla"
        onPress={() => void onSubmit()}
        loading={submitting}
        disabled={operationAttempted ? !canSubmit : false}
      />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  sheetLabel: {
    color: mobileTheme.colors.dark.text,
    fontSize: 13,
    fontWeight: "700",
  },
});
