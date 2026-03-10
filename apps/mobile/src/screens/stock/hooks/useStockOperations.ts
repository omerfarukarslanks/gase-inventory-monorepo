import {
  adjustInventory,
  receiveInventory,
  transferInventory,
  type Currency,
  type InventoryProductStockItem,
  type InventoryStoreStockItem,
  type InventoryVariantStockItem,
  type Store,
} from "@gase/core";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackEvent } from "@/src/lib/analytics";
import type { RequestEnvelope, StockOperationKind, StockRequest } from "@/src/lib/workflows";
import { toNumber } from "@/src/lib/format";
import {
  emptyReceive,
  emptyTransfer,
  emptyAdjust,
  type ReceiveForm,
  type TransferForm,
  type AdjustForm,
} from "./useOperationForm";

export type ActiveOperation = {
  kind: StockOperationKind;
  variant: InventoryVariantStockItem;
  productName?: string;
  stores: InventoryStoreStockItem[];
};

type UseStockOperationsParams = {
  products: InventoryProductStockItem[];
  stores: Store[];
  selectedStoreId: string;
  resolveVariantStores: (variant: InventoryVariantStockItem) => Promise<InventoryStoreStockItem[]>;
  fetchStock: () => Promise<void>;
  setError: (error: string) => void;
  request?: RequestEnvelope<StockRequest> | null;
  // form state (owned by useOperationForm, threaded through here)
  receiveForm: ReceiveForm;
  transferForm: TransferForm;
  adjustForm: AdjustForm;
  setReceiveForm: Dispatch<SetStateAction<ReceiveForm>>;
  setTransferForm: Dispatch<SetStateAction<TransferForm>>;
  setAdjustForm: Dispatch<SetStateAction<AdjustForm>>;
  operationAttempted: boolean;
  setOperationAttempted: Dispatch<SetStateAction<boolean>>;
  setOperationError: Dispatch<SetStateAction<string>>;
  setSubmitting: Dispatch<SetStateAction<boolean>>;
  // activeOperation is owned by the main screen and passed in both directions
  activeOperation: ActiveOperation | null;
  setActiveOperation: Dispatch<SetStateAction<ActiveOperation | null>>;
  // canSubmitOperation is read at submit time via ref to break circular dep
  canSubmitOperationRef: React.MutableRefObject<boolean>;
};

export function useStockOperations({
  products,
  stores,
  selectedStoreId,
  resolveVariantStores,
  fetchStock,
  setError,
  request,
  receiveForm,
  transferForm,
  adjustForm,
  setReceiveForm,
  setTransferForm,
  setAdjustForm,
  operationAttempted,
  setOperationAttempted,
  setOperationError,
  setSubmitting,
  activeOperation,
  setActiveOperation,
  canSubmitOperationRef,
}: UseStockOperationsParams) {
  const handledRequestId = useRef<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProductStockItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<InventoryVariantStockItem | null>(null);
  const [storePickerOpen, setStorePickerOpen] = useState(false);

  const openOperation = useCallback(async (
    kind: StockOperationKind,
    variant: InventoryVariantStockItem,
    productName?: string,
  ) => {
    try {
      const resolvedStores = await resolveVariantStores(variant);
      const preferredStoreId = selectedStoreId || resolvedStores[0]?.storeId || "";
      const preferredStore =
        resolvedStores.find((store) => store.storeId === preferredStoreId) ?? resolvedStores[0];
      const transferTargetId = stores.find((store) => store.id !== preferredStoreId)?.id ?? "";

      setOperationAttempted(false);
      setOperationError("");
      setActiveOperation({ kind, variant, productName, stores: resolvedStores });
      setReceiveForm({
        ...emptyReceive,
        storeId: preferredStoreId,
        quantity: "1",
        unitPrice: String(preferredStore?.salePrice ?? preferredStore?.unitPrice ?? ""),
      });
      setTransferForm({
        ...emptyTransfer,
        fromStoreId: preferredStoreId,
        toStoreId: transferTargetId,
        quantity: "1",
      });
      setAdjustForm({
        ...emptyAdjust,
        storeId: preferredStoreId,
        newQuantity: String(preferredStore?.quantity ?? ""),
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Varyant magaza bilgisi yuklenemedi.");
    }
  }, [resolveVariantStores, selectedStoreId, stores, setOperationAttempted, setOperationError, setActiveOperation, setReceiveForm, setTransferForm, setAdjustForm, setError]);

  const openVariantDetail = useCallback(
    async (product: InventoryProductStockItem, variant: InventoryVariantStockItem) => {
      setSelectedProduct(product);
      setSelectedVariant(variant);
      await resolveVariantStores(variant);
    },
    [resolveVariantStores],
  );

  useEffect(() => {
    if (!request || handledRequestId.current === request.id) return;
    handledRequestId.current = request.id;

    const { productVariantId, operation } = request.payload.seed;
    if (!productVariantId) {
      setSelectedProduct(null);
      setSelectedVariant(null);
      return;
    }

    const matchedProduct = products.find((product) =>
      (product.variants ?? []).some((variant) => variant.productVariantId === productVariantId),
    );
    const matchedVariant = matchedProduct?.variants?.find(
      (variant) => variant.productVariantId === productVariantId,
    );

    if (matchedProduct) setSelectedProduct(matchedProduct);
    if (matchedVariant) {
      setSelectedVariant(matchedVariant);
      if (operation) {
        void openOperation(operation, matchedVariant, matchedProduct?.productName);
      }
    }
  }, [openOperation, products, request]);

  const submitOperation = useCallback(async () => {
    if (!activeOperation) return;

    setOperationAttempted(true);

    if (!canSubmitOperationRef.current) {
      trackEvent("validation_error", { screen: "stock", operation: activeOperation.kind });
      setOperationError("Alanlari duzeltip islemi tekrar deneyin.");
      return;
    }

    setSubmitting(true);
    setOperationError("");

    try {
      if (activeOperation.kind === "receive") {
        const selectedStore = activeOperation.stores.find((store) => store.storeId === receiveForm.storeId);
        const currency = (selectedStore?.currency ?? "TRY") as Currency;
        await receiveInventory({
          storeId: receiveForm.storeId,
          productVariantId: activeOperation.variant.productVariantId,
          supplierId: receiveForm.supplierId || undefined,
          quantity: toNumber(receiveForm.quantity),
          currency,
          unitPrice: toNumber(receiveForm.unitPrice),
          meta: {
            reason: "MOBILE_RECEIVE",
            note: receiveForm.note || undefined,
          },
        });
      }

      if (activeOperation.kind === "transfer") {
        await transferInventory({
          fromStoreId: transferForm.fromStoreId,
          toStoreId: transferForm.toStoreId,
          productVariantId: activeOperation.variant.productVariantId,
          quantity: toNumber(transferForm.quantity),
          meta: {
            reason: "MOBILE_TRANSFER",
            note: transferForm.note || undefined,
          },
        });
      }

      if (activeOperation.kind === "adjust") {
        await adjustInventory({
          storeId: adjustForm.storeId,
          productVariantId: activeOperation.variant.productVariantId,
          newQuantity: toNumber(adjustForm.newQuantity),
          meta: {
            reason: "MOBILE_ADJUST",
            note: adjustForm.note || undefined,
          },
        });
      }

      trackEvent("inventory_adjusted", {
        operation: activeOperation.kind,
        variantId: activeOperation.variant.productVariantId,
      });
      setActiveOperation(null);
      setOperationAttempted(false);
      setOperationError("");
      setReceiveForm(emptyReceive);
      setTransferForm(emptyTransfer);
      setAdjustForm(emptyAdjust);
      await fetchStock();
    } catch (nextError) {
      setOperationError(
        nextError instanceof Error ? nextError.message : "Operasyon tamamlanamadi.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [activeOperation, canSubmitOperationRef, receiveForm, transferForm, adjustForm, setOperationAttempted, setOperationError, setSubmitting, setActiveOperation, setReceiveForm, setTransferForm, setAdjustForm, fetchStock]);

  return {
    selectedProduct,
    setSelectedProduct,
    selectedVariant,
    setSelectedVariant,
    storePickerOpen,
    setStorePickerOpen,
    openOperation,
    openVariantDetail,
    submitOperation,
  };
}
