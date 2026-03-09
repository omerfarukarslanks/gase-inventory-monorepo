import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  adjustInventory,
  getAllSuppliers,
  getStores,
  getTenantStockSummary,
  getVariantStockByStore,
  normalizeProducts,
  normalizeStoreItems,
  receiveInventory,
  transferInventory,
  type Currency,
  type InventoryProductStockItem,
  type InventoryStoreStockItem,
  type InventoryVariantStockItem,
  type Store,
  type Supplier,
} from "@gase/core";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  FilterTabs,
  InlineFieldError,
  ListRow,
  ModalSheet,
  ScreenHeader,
  SearchBar,
  SectionTitle,
  SelectionList,
  SkeletonBlock,
  StickyActionBar,
  TextField,
} from "@/src/components/ui";
import { trackEvent } from "@/src/lib/analytics";
import type { RequestEnvelope, StockOperationKind, StockRequest } from "@/src/lib/workflows";
import { useAuth } from "@/src/context/AuthContext";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { formatCount, formatCurrency, toNumber } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";

type PriorityFilter = "all" | "low";

type StockScreenProps = {
  isActive?: boolean;
  request?: RequestEnvelope<StockRequest> | null;
};

type ActiveOperation = {
  kind: StockOperationKind;
  variant: InventoryVariantStockItem;
  productName?: string;
  stores: InventoryStoreStockItem[];
};

type CriticalQueueItem = {
  product: InventoryProductStockItem;
  variant: InventoryVariantStockItem;
};

const emptyReceive = {
  storeId: "",
  quantity: "",
  unitPrice: "",
  supplierId: "",
  note: "",
};

const emptyTransfer = {
  fromStoreId: "",
  toStoreId: "",
  quantity: "",
  note: "",
};

const emptyAdjust = {
  storeId: "",
  newQuantity: "",
  note: "",
};

const priorityOptions = [
  { label: "Tum", value: "all" as const },
  { label: "Dusuk stok", value: "low" as const },
];

const LOW_STOCK_THRESHOLD = 50;

function validatePositiveQuantity(value: string, label: string) {
  if (!value.trim()) return `${label} zorunlu.`;
  const amount = toNumber(value, Number.NaN);
  if (!Number.isFinite(amount)) return "Gecerli bir sayi girin.";
  return amount > 0 ? "" : `${label} sifirdan buyuk olmali.`;
}

function validateNonNegativeQuantity(value: string, label: string) {
  if (!value.trim()) return `${label} zorunlu.`;
  const amount = toNumber(value, Number.NaN);
  if (!Number.isFinite(amount)) return "Gecerli bir sayi girin.";
  return amount >= 0 ? "" : `${label} negatif olamaz.`;
}

export default function StockScreen({
  isActive = true,
  request,
}: StockScreenProps = {}) {
  const handledRequestId = useRef<number | null>(null);
  const { storeIds } = useAuth();
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [storePickerOpen, setStorePickerOpen] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<InventoryProductStockItem[]>([]);
  const [variantStores, setVariantStores] = useState<Record<string, InventoryStoreStockItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<InventoryProductStockItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<InventoryVariantStockItem | null>(null);
  const [activeOperation, setActiveOperation] = useState<ActiveOperation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [operationAttempted, setOperationAttempted] = useState(false);
  const [operationError, setOperationError] = useState("");
  const [receiveForm, setReceiveForm] = useState(emptyReceive);
  const [transferForm, setTransferForm] = useState(emptyTransfer);
  const [adjustForm, setAdjustForm] = useState(emptyAdjust);
  const debouncedSearch = useDebouncedValue(search, 350);
  const scopedStoreIds = useMemo(
    () => (selectedStoreId ? [selectedStoreId] : storeIds.length ? storeIds : undefined),
    [selectedStoreId, storeIds],
  );

  const loadReferenceData = useCallback(async () => {
    try {
      const [storesResponse, suppliersResponse] = await Promise.all([
        getStores({ page: 1, limit: 100 }),
        getAllSuppliers({ isActive: true }),
      ]);
      setStores(storesResponse.data ?? []);
      setSuppliers(suppliersResponse);
    } catch {
      setStores([]);
      setSuppliers([]);
    }
  }, []);

  const fetchStock = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getTenantStockSummary({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
        storeIds: scopedStoreIds,
      });
      const normalized = normalizeProducts(response);
      setProducts(normalized);
      const nextVariantStores: Record<string, InventoryStoreStockItem[]> = {};
      normalized.forEach((product) => {
        product.variants?.forEach((variant) => {
          nextVariantStores[variant.productVariantId] = variant.stores ?? [];
        });
      });
      setVariantStores(nextVariantStores);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Stok ozetleri yuklenemedi.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, scopedStoreIds]);

  useEffect(() => {
    if (!isActive) return;
    void loadReferenceData();
  }, [isActive, loadReferenceData]);

  useEffect(() => {
    if (!isActive) return;
    void fetchStock();
  }, [fetchStock, isActive]);

  const filteredProducts = useMemo(() => {
    if (priorityFilter === "all") return products;
    return products.filter((product) =>
      (product.variants ?? []).some(
        (variant) => Number(variant.totalQuantity ?? 0) <= LOW_STOCK_THRESHOLD,
      ),
    );
  }, [priorityFilter, products]);

  const visibleVariantCount = useMemo(
    () => filteredProducts.reduce((sum, product) => sum + (product.variants?.length ?? 0), 0),
    [filteredProducts],
  );

  const criticalQueue = useMemo<CriticalQueueItem[]>(
    () =>
      filteredProducts
        .flatMap((product) =>
          (product.variants ?? []).map((variant) => ({
            product,
            variant,
          })),
        )
        .filter((item) => Number(item.variant.totalQuantity ?? 0) <= LOW_STOCK_THRESHOLD)
        .sort(
          (left, right) =>
            Number(left.variant.totalQuantity ?? 0) - Number(right.variant.totalQuantity ?? 0),
        ),
    [filteredProducts],
  );

  const criticalQueuePreview = useMemo(() => criticalQueue.slice(0, 5), [criticalQueue]);

  const selectedStoreName = useMemo(
    () => stores.find((item) => item.id === selectedStoreId)?.name ?? "Tum magazalar",
    [selectedStoreId, stores],
  );
  const receiveStore = useMemo(
    () =>
      activeOperation?.kind === "receive"
        ? activeOperation.stores.find((store) => store.storeId === receiveForm.storeId)
        : undefined,
    [activeOperation, receiveForm.storeId],
  );
  const transferSourceStore = useMemo(
    () =>
      activeOperation?.kind === "transfer"
        ? activeOperation.stores.find((store) => store.storeId === transferForm.fromStoreId)
        : undefined,
    [activeOperation, transferForm.fromStoreId],
  );
  const adjustStore = useMemo(
    () =>
      activeOperation?.kind === "adjust"
        ? activeOperation.stores.find((store) => store.storeId === adjustForm.storeId)
        : undefined,
    [activeOperation, adjustForm.storeId],
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

  const resolveVariantStores = useCallback(async (variant: InventoryVariantStockItem) => {
    const existing = variantStores[variant.productVariantId] ?? [];
    if (existing.length) return existing;

    const response = await getVariantStockByStore(variant.productVariantId);
    const normalized = normalizeStoreItems(response);
    setVariantStores((current) => ({
      ...current,
      [variant.productVariantId]: normalized,
    }));
    return normalized;
  }, [variantStores]);

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
  }, [resolveVariantStores, selectedStoreId, stores]);

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

  const submitOperation = async () => {
    if (!activeOperation) return;

    setOperationAttempted(true);

    if (!canSubmitOperation) {
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
  };

  const resetFilters = () => {
    setSearch("");
    setPriorityFilter("all");
    setSelectedStoreId("");
  };

  if (selectedVariant && selectedProduct) {
    const storesForVariant = variantStores[selectedVariant.productVariantId] ?? selectedVariant.stores ?? [];

    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.screenContent}>
          <ScreenHeader
            title={selectedVariant.variantName}
            subtitle={`${selectedProduct.productName} icin magaza bazli stok`}
            onBack={() => setSelectedVariant(null)}
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
                  onAction={() => void resolveVariantStores(selectedVariant)}
                />
              )}
            </View>
          </Card>
        </ScrollView>

        <StickyActionBar>
          <Button label="Alim" onPress={() => void openOperation("receive", selectedVariant, selectedProduct.productName)} variant="secondary" />
          <Button label="Transfer" onPress={() => void openOperation("transfer", selectedVariant, selectedProduct.productName)} variant="ghost" />
          <Button label="Duzelt" onPress={() => void openOperation("adjust", selectedVariant, selectedProduct.productName)} />
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
          receiveStoreQuantity={toNumber(receiveStore?.quantity)}
          transferSourceQuantity={toNumber(transferSourceStore?.quantity)}
          adjustStoreQuantity={toNumber(adjustStore?.quantity)}
          submitting={submitting}
          canSubmit={canSubmitOperation}
          onSubmit={submitOperation}
        />
      </View>
    );
  }

  if (selectedProduct) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.screenContent}>
          <ScreenHeader
            title={selectedProduct.productName}
            subtitle="Varyant sec ve stok operasyonuna gec"
            onBack={() => setSelectedProduct(null)}
          />

          {error ? <Banner text={error} /> : null}

          <Card>
            <SectionTitle title="Urun ozeti" />
            <View style={styles.detailStats}>
              <View style={styles.detailStat}>
                <Text style={styles.detailLabel}>Toplam stok</Text>
                <Text style={styles.detailValue}>{formatCount(selectedProduct.totalQuantity)} adet</Text>
              </View>
              <View style={styles.detailStat}>
                <Text style={styles.detailLabel}>Varyant sayisi</Text>
                <Text style={styles.detailValue}>{formatCount(selectedProduct.variants?.length ?? 0)}</Text>
              </View>
            </View>
          </Card>

          <Card>
            <SectionTitle title="Varyantlar" />
            <View style={styles.variantList}>
              {(selectedProduct.variants ?? []).length ? (
                (selectedProduct.variants ?? []).map((variant) => (
                  <ListRow
                    key={variant.productVariantId}
                    title={variant.variantName}
                    subtitle={`${formatCount(variant.totalQuantity)} adet`}
                    caption={`Kod: ${variant.variantCode ?? "-"}`}
                    badgeLabel={
                      Number(variant.totalQuantity ?? 0) <= LOW_STOCK_THRESHOLD
                        ? "Dusuk stok"
                        : "Normal"
                    }
                    badgeTone={
                      Number(variant.totalQuantity ?? 0) <= LOW_STOCK_THRESHOLD
                        ? "warning"
                        : "positive"
                    }
                    onPress={() => void openVariantDetail(selectedProduct, variant)}
                    icon={<MaterialCommunityIcons name="barcode" size={20} color={mobileTheme.colors.brand.primary} />}
                  />
                ))
              ) : (
                <EmptyStateWithAction
                  title="Varyant bulunamadi."
                  subtitle="Bu urunde stok islenebilir varyant yok."
                  actionLabel="Listeye don"
                  onAction={() => setSelectedProduct(null)}
                />
              )}
            </View>
          </Card>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <ScreenHeader
          title="Stok"
          subtitle="Urunu sec, varyanti ac, sonra operasyonu baslat"
          action={<Button label="Yenile" onPress={() => void fetchStock()} variant="secondary" size="sm" fullWidth={false} />}
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
                          setPriorityFilter((current) => (current === "low" ? "all" : "low"))
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
                            onPress={() => void openVariantDetail(item.product, item.variant)}
                            variant="ghost"
                            size="sm"
                            fullWidth={false}
                          />
                          <Button
                            label="Alim"
                            onPress={() =>
                              void openOperation("receive", item.variant, item.product.productName)
                            }
                            variant="secondary"
                            size="sm"
                            fullWidth={false}
                          />
                          <Button
                            label="Duzelt"
                            onPress={() =>
                              void openOperation("adjust", item.variant, item.product.productName)
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
                onPress={() => setSelectedProduct(item)}
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
                resetFilters();
              }}
            />
          }
        />
      )}

      <StickyActionBar>
        <Button label="Filtreyi temizle" onPress={resetFilters} variant="ghost" />
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
        receiveStoreQuantity={toNumber(receiveStore?.quantity)}
        transferSourceQuantity={toNumber(transferSourceStore?.quantity)}
        adjustStoreQuantity={toNumber(adjustStore?.quantity)}
        submitting={submitting}
        canSubmit={canSubmitOperation}
        onSubmit={submitOperation}
      />
    </View>
  );
}

function OperationSheet({
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
}: {
  activeOperation: ActiveOperation | null;
  setActiveOperation: (value: ActiveOperation | null) => void;
  setOperationAttempted: Dispatch<SetStateAction<boolean>>;
  operationError: string;
  setOperationError: Dispatch<SetStateAction<string>>;
  stores: Store[];
  suppliers: Supplier[];
  receiveForm: typeof emptyReceive;
  setReceiveForm: Dispatch<SetStateAction<typeof emptyReceive>>;
  transferForm: typeof emptyTransfer;
  setTransferForm: Dispatch<SetStateAction<typeof emptyTransfer>>;
  adjustForm: typeof emptyAdjust;
  setAdjustForm: Dispatch<SetStateAction<typeof emptyAdjust>>;
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
}) {
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
  sheetLabel: {
    color: mobileTheme.colors.dark.text,
    fontSize: 13,
    fontWeight: "700",
  },
});
