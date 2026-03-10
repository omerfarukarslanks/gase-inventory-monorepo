import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { toNumber, formatCount } from "@/src/lib/format";
import type { ActiveOperation } from "./useStockOperations";

export const emptyReceive = {
  storeId: "",
  quantity: "",
  unitPrice: "",
  supplierId: "",
  note: "",
};

export const emptyTransfer = {
  fromStoreId: "",
  toStoreId: "",
  quantity: "",
  note: "",
};

export const emptyAdjust = {
  storeId: "",
  newQuantity: "",
  note: "",
};

export function validatePositiveQuantity(value: string, label: string) {
  if (!value.trim()) return `${label} zorunlu.`;
  const amount = toNumber(value, Number.NaN);
  if (!Number.isFinite(amount)) return "Gecerli bir sayi girin.";
  return amount > 0 ? "" : `${label} sifirdan buyuk olmali.`;
}

export function validateNonNegativeQuantity(value: string, label: string) {
  if (!value.trim()) return `${label} zorunlu.`;
  const amount = toNumber(value, Number.NaN);
  if (!Number.isFinite(amount)) return "Gecerli bir sayi girin.";
  return amount >= 0 ? "" : `${label} negatif olamaz.`;
}

export type ReceiveForm = typeof emptyReceive;
export type TransferForm = typeof emptyTransfer;
export type AdjustForm = typeof emptyAdjust;

type UseOperationFormParams = {
  activeOperation: ActiveOperation | null;
};

export function useOperationForm({ activeOperation }: UseOperationFormParams) {
  const [receiveForm, setReceiveForm] = useState<ReceiveForm>(emptyReceive);
  const [transferForm, setTransferForm] = useState<TransferForm>(emptyTransfer);
  const [adjustForm, setAdjustForm] = useState<AdjustForm>(emptyAdjust);
  const [operationAttempted, setOperationAttempted] = useState(false);
  const [operationError, setOperationError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const transferSourceStore = useMemo(
    () =>
      activeOperation?.kind === "transfer"
        ? activeOperation.stores.find((store) => store.storeId === transferForm.fromStoreId)
        : undefined,
    [activeOperation, transferForm.fromStoreId],
  );

  const rawReceiveStoreError = useMemo(
    () => (receiveForm.storeId ? "" : "Magaza secin."),
    [receiveForm.storeId],
  );
  const rawReceiveQuantityError = useMemo(
    () => validatePositiveQuantity(receiveForm.quantity, "Miktar"),
    [receiveForm.quantity],
  );
  const rawReceiveUnitPriceError = useMemo(() => {
    if (!receiveForm.unitPrice.trim()) return "";
    const amount = toNumber(receiveForm.unitPrice, Number.NaN);
    if (!Number.isFinite(amount)) return "Gecerli bir birim fiyat girin.";
    return amount >= 0 ? "" : "Birim fiyat negatif olamaz.";
  }, [receiveForm.unitPrice]);
  const rawTransferFromStoreError = useMemo(
    () => (transferForm.fromStoreId ? "" : "Cikis magazasi secin."),
    [transferForm.fromStoreId],
  );
  const rawTransferToStoreError = useMemo(() => {
    if (!transferForm.toStoreId) return "Hedef magazasi secin.";
    if (transferForm.toStoreId === transferForm.fromStoreId) {
      return "Hedef magaza cikis magazasiyla ayni olamaz.";
    }
    return "";
  }, [transferForm.fromStoreId, transferForm.toStoreId]);
  const rawTransferQuantityError = useMemo(() => {
    const baseError = validatePositiveQuantity(transferForm.quantity, "Miktar");
    if (baseError) return baseError;
    const quantity = toNumber(transferForm.quantity);
    const available = toNumber(transferSourceStore?.quantity);
    if (transferSourceStore && quantity > available) {
      return `En fazla ${formatCount(available)} adet transfer edilebilir.`;
    }
    return "";
  }, [transferForm.quantity, transferSourceStore]);
  const rawAdjustStoreError = useMemo(
    () => (adjustForm.storeId ? "" : "Magaza secin."),
    [adjustForm.storeId],
  );
  const rawAdjustQuantityError = useMemo(
    () => validateNonNegativeQuantity(adjustForm.newQuantity, "Yeni stok"),
    [adjustForm.newQuantity],
  );

  const receiveStoreError = useMemo(
    () => (operationAttempted ? rawReceiveStoreError : ""),
    [operationAttempted, rawReceiveStoreError],
  );
  const receiveQuantityError = useMemo(
    () =>
      operationAttempted || receiveForm.quantity.trim() ? rawReceiveQuantityError : "",
    [operationAttempted, rawReceiveQuantityError, receiveForm.quantity],
  );
  const receiveUnitPriceError = useMemo(
    () => (receiveForm.unitPrice.trim() ? rawReceiveUnitPriceError : ""),
    [rawReceiveUnitPriceError, receiveForm.unitPrice],
  );
  const transferFromStoreError = useMemo(
    () => (operationAttempted ? rawTransferFromStoreError : ""),
    [operationAttempted, rawTransferFromStoreError],
  );
  const transferToStoreError = useMemo(
    () => (operationAttempted ? rawTransferToStoreError : ""),
    [operationAttempted, rawTransferToStoreError],
  );
  const transferQuantityError = useMemo(
    () =>
      operationAttempted || transferForm.quantity.trim() ? rawTransferQuantityError : "",
    [operationAttempted, rawTransferQuantityError, transferForm.quantity],
  );
  const adjustStoreError = useMemo(
    () => (operationAttempted ? rawAdjustStoreError : ""),
    [operationAttempted, rawAdjustStoreError],
  );
  const adjustQuantityError = useMemo(
    () =>
      operationAttempted || adjustForm.newQuantity.trim() ? rawAdjustQuantityError : "",
    [adjustForm.newQuantity, operationAttempted, rawAdjustQuantityError],
  );
  const canSubmitOperation = useMemo(() => {
    if (!activeOperation) return false;
    if (activeOperation.kind === "receive") {
      return !rawReceiveStoreError && !rawReceiveQuantityError && !rawReceiveUnitPriceError;
    }
    if (activeOperation.kind === "transfer") {
      return !rawTransferFromStoreError && !rawTransferToStoreError && !rawTransferQuantityError;
    }
    return !rawAdjustStoreError && !rawAdjustQuantityError;
  }, [
    activeOperation,
    rawAdjustQuantityError,
    rawAdjustStoreError,
    rawReceiveQuantityError,
    rawReceiveStoreError,
    rawReceiveUnitPriceError,
    rawTransferFromStoreError,
    rawTransferQuantityError,
    rawTransferToStoreError,
  ]);

  return {
    receiveForm,
    setReceiveForm: setReceiveForm as Dispatch<SetStateAction<ReceiveForm>>,
    transferForm,
    setTransferForm: setTransferForm as Dispatch<SetStateAction<TransferForm>>,
    adjustForm,
    setAdjustForm: setAdjustForm as Dispatch<SetStateAction<AdjustForm>>,
    operationAttempted,
    setOperationAttempted,
    operationError,
    setOperationError,
    submitting,
    setSubmitting,
    transferSourceStore,
    receiveStoreError,
    receiveQuantityError,
    receiveUnitPriceError,
    transferFromStoreError,
    transferToStoreError,
    transferQuantityError,
    adjustStoreError,
    adjustQuantityError,
    canSubmitOperation,
    rawReceiveStoreError,
    rawReceiveQuantityError,
    rawReceiveUnitPriceError,
    rawTransferFromStoreError,
    rawTransferToStoreError,
    rawTransferQuantityError,
    rawAdjustStoreError,
    rawAdjustQuantityError,
  };
}
