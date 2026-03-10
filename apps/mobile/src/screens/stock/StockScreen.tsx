import { useMemo, useRef, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { toNumber } from "@/src/lib/format";
import type { RequestEnvelope, StockRequest } from "@/src/lib/workflows";
import { useStockData } from "./hooks/useStockData";
import { useStockFiltering } from "./hooks/useStockFiltering";
import { useOperationForm } from "./hooks/useOperationForm";
import { useStockOperations, type ActiveOperation } from "./hooks/useStockOperations";
import { ProductListView } from "./views/ProductListView";
import { ProductDetailView } from "./views/ProductDetailView";
import { VariantDetailView } from "./views/VariantDetailView";

type StockScreenProps = {
  isActive?: boolean;
  request?: RequestEnvelope<StockRequest> | null;
};

export default function StockScreen({
  isActive = true,
  request,
}: StockScreenProps = {}) {
  const { storeIds } = useAuth();
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "low">("all");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  // activeOperation lifted here to break the circular dep between useOperationForm and useStockOperations
  const [activeOperation, setActiveOperation] = useState<ActiveOperation | null>(null);
  const debouncedSearch = useDebouncedValue(search, 350);

  const scopedStoreIds = useMemo(
    () => (selectedStoreId ? [selectedStoreId] : storeIds.length ? storeIds : undefined),
    [selectedStoreId, storeIds],
  );

  const {
    products,
    variantStores,
    stores,
    suppliers,
    loading,
    error,
    setError,
    fetchStock,
    resolveVariantStores,
  } = useStockData({ isActive, debouncedSearch, scopedStoreIds });

  const {
    filteredProducts,
    visibleVariantCount,
    criticalQueue,
    criticalQueuePreview,
  } = useStockFiltering({ products, priorityFilter });

  const {
    receiveForm,
    setReceiveForm,
    transferForm,
    setTransferForm,
    adjustForm,
    setAdjustForm,
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
  } = useOperationForm({ activeOperation });

  // Use a ref so submitOperation always reads the latest canSubmitOperation without
  // needing to be in its dependency array (avoids stale closure on the async path)
  const canSubmitOperationRef = useRef(canSubmitOperation);
  canSubmitOperationRef.current = canSubmitOperation;

  const {
    selectedProduct,
    setSelectedProduct,
    selectedVariant,
    setSelectedVariant,
    storePickerOpen,
    setStorePickerOpen,
    openOperation,
    openVariantDetail,
    submitOperation,
  } = useStockOperations({
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
  });

  const selectedStoreName = useMemo(
    () => stores.find((item) => item.id === selectedStoreId)?.name ?? "Tum magazalar",
    [selectedStoreId, stores],
  );

  // Store-lookup memos that need both activeOperation and form values
  const receiveStore = useMemo(
    () =>
      activeOperation?.kind === "receive"
        ? activeOperation.stores.find((store) => store.storeId === receiveForm.storeId)
        : undefined,
    [activeOperation, receiveForm.storeId],
  );
  const adjustStore = useMemo(
    () =>
      activeOperation?.kind === "adjust"
        ? activeOperation.stores.find((store) => store.storeId === adjustForm.storeId)
        : undefined,
    [activeOperation, adjustForm.storeId],
  );

  const resetFilters = () => {
    setSearch("");
    setPriorityFilter("all");
    setSelectedStoreId("");
  };

  const operationSheetProps = {
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
    receiveStoreQuantity: toNumber(receiveStore?.quantity),
    transferSourceQuantity: toNumber(transferSourceStore?.quantity),
    adjustStoreQuantity: toNumber(adjustStore?.quantity),
    submitting,
    canSubmit: canSubmitOperation,
    onSubmit: submitOperation,
  };

  if (selectedVariant && selectedProduct) {
    const storesForVariant = variantStores[selectedVariant.productVariantId] ?? selectedVariant.stores ?? [];
    return (
      <VariantDetailView
        selectedProduct={selectedProduct}
        selectedVariant={selectedVariant}
        storesForVariant={storesForVariant}
        selectedStoreId={selectedStoreId}
        error={error}
        onBack={() => setSelectedVariant(null)}
        onReceive={() => void openOperation("receive", selectedVariant, selectedProduct.productName)}
        onTransfer={() => void openOperation("transfer", selectedVariant, selectedProduct.productName)}
        onAdjust={() => void openOperation("adjust", selectedVariant, selectedProduct.productName)}
        onResolveVariantStores={(variant) => void resolveVariantStores(variant)}
        {...operationSheetProps}
      />
    );
  }

  if (selectedProduct) {
    return (
      <ProductDetailView
        selectedProduct={selectedProduct}
        error={error}
        onBack={() => setSelectedProduct(null)}
        onVariantPress={(product, variant) => void openVariantDetail(product, variant)}
      />
    );
  }

  return (
    <ProductListView
      filteredProducts={filteredProducts}
      loading={loading}
      error={error}
      search={search}
      setSearch={setSearch}
      priorityFilter={priorityFilter}
      setPriorityFilter={setPriorityFilter}
      selectedStoreId={selectedStoreId}
      selectedStoreName={selectedStoreName}
      visibleVariantCount={visibleVariantCount}
      criticalQueue={criticalQueue}
      criticalQueuePreview={criticalQueuePreview}
      storePickerOpen={storePickerOpen}
      setStorePickerOpen={setStorePickerOpen}
      stores={stores}
      setSelectedStoreId={setSelectedStoreId}
      onProductPress={(product) => setSelectedProduct(product)}
      onOpenVariantDetail={(product, variant) => void openVariantDetail(product, variant)}
      onOpenOperation={(kind, variant, productName) => void openOperation(kind, variant, productName)}
      onFetchStock={() => void fetchStock()}
      onResetFilters={resetFilters}
      {...operationSheetProps}
    />
  );
}
