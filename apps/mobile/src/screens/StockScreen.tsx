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
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  AppScreen,
  Banner,
  Button,
  Card,
  EmptyState,
  ModalSheet,
  SectionTitle,
  SelectionList,
  StatusBadge,
  TextField,
} from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { formatCount, formatCurrency, toNumber } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";

type OperationKind = "receive" | "transfer" | "adjust";

type ActiveOperation = {
  kind: OperationKind;
  variant: InventoryVariantStockItem;
  stores: InventoryStoreStockItem[];
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

export default function StockScreen() {
  const { signOut, storeIds } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<InventoryProductStockItem[]>([]);
  const [variantStores, setVariantStores] = useState<Record<string, InventoryStoreStockItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeOperation, setActiveOperation] = useState<ActiveOperation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [receiveForm, setReceiveForm] = useState(emptyReceive);
  const [transferForm, setTransferForm] = useState(emptyTransfer);
  const [adjustForm, setAdjustForm] = useState(emptyAdjust);
  const debouncedSearch = useDebouncedValue(search, 350);

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
      const scopedStoreIds =
        selectedStoreId
          ? [selectedStoreId]
          : storeIds.length
            ? storeIds
            : undefined;
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
  }, [debouncedSearch, selectedStoreId, storeIds]);

  useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    void fetchStock();
  }, [fetchStock]);

  const selectedStoreName = useMemo(
    () => stores.find((item) => item.id === selectedStoreId)?.name ?? "Tum magazalar",
    [selectedStoreId, stores],
  );

  const resolveVariantStores = async (variant: InventoryVariantStockItem) => {
    const existing = variantStores[variant.productVariantId] ?? [];
    if (existing.length) return existing;

    const response = await getVariantStockByStore(variant.productVariantId);
    const normalized = normalizeStoreItems(response);
    setVariantStores((current) => ({
      ...current,
      [variant.productVariantId]: normalized,
    }));
    return normalized;
  };

  const openOperation = async (kind: OperationKind, variant: InventoryVariantStockItem) => {
    try {
      const resolvedStores = await resolveVariantStores(variant);
      setActiveOperation({ kind, variant, stores: resolvedStores });
      setReceiveForm({
        ...emptyReceive,
        storeId: resolvedStores[0]?.storeId ?? selectedStoreId,
        unitPrice: String(resolvedStores[0]?.salePrice ?? resolvedStores[0]?.unitPrice ?? ""),
      });
      setTransferForm({
        ...emptyTransfer,
        fromStoreId: resolvedStores[0]?.storeId ?? "",
      });
      setAdjustForm({
        ...emptyAdjust,
        storeId: resolvedStores[0]?.storeId ?? "",
        newQuantity: String(resolvedStores[0]?.quantity ?? ""),
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Varyant magaza bilgisi yuklenemedi.");
    }
  };

  const submitOperation = async () => {
    if (!activeOperation) return;

    setSubmitting(true);
    setError("");

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

      setActiveOperation(null);
      setReceiveForm(emptyReceive);
      setTransferForm(emptyTransfer);
      setAdjustForm(emptyAdjust);
      await fetchStock();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Operasyon tamamlanamadi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen
      title="Stok"
      subtitle="Ozeti incele, alim, transfer ve duzeltme islemleri yap"
      action={<Button label="Cikis" onPress={() => void signOut()} variant="ghost" />}
    >
      {error ? <Banner text={error} /> : null}

      <Card>
        <View style={styles.filterStack}>
          <TextField
            label="Ara"
            value={search}
            onChangeText={setSearch}
            placeholder="Urun veya varyant ara"
          />
          <Text style={styles.filterLabel}>Magaza filtresi</Text>
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
            onSelect={(value) => setSelectedStoreId(value === "all" ? "" : value)}
          />
          <Text style={styles.helperText}>Aktif filtre: {selectedStoreName}</Text>
        </View>
      </Card>

      <Card>
        <SectionTitle title={`Stok listesi (${products.length})`} action={<Button label="Yenile" onPress={() => void fetchStock()} variant="secondary" />} />
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={mobileTheme.colors.brand.primary} />
          </View>
        ) : products.length ? (
          <View style={styles.productList}>
            {products.map((product) => (
              <View key={product.productId} style={styles.productCard}>
                <View style={styles.productHeader}>
                  <View style={styles.productCopy}>
                    <Text style={styles.productTitle}>{product.productName}</Text>
                    <Text style={styles.productMeta}>Toplam {formatCount(product.totalQuantity)} adet</Text>
                  </View>
                  <StatusBadge label={`${product.variants?.length ?? 0} varyant`} tone="positive" />
                </View>

                <View style={styles.variantList}>
                  {(product.variants ?? []).map((variant) => (
                    <View key={variant.productVariantId} style={styles.variantCard}>
                      <View style={styles.variantHeader}>
                        <View style={styles.productCopy}>
                          <Text style={styles.variantTitle}>{variant.variantName}</Text>
                          <Text style={styles.productMeta}>
                            Kod: {variant.variantCode ?? "-"} • {formatCount(variant.totalQuantity)} adet
                          </Text>
                        </View>
                        <View style={styles.operationButtons}>
                          <Button label="Alim" onPress={() => void openOperation("receive", variant)} variant="secondary" />
                          <Button label="Transfer" onPress={() => void openOperation("transfer", variant)} variant="secondary" />
                          <Button label="Duzelt" onPress={() => void openOperation("adjust", variant)} variant="secondary" />
                        </View>
                      </View>

                      <View style={styles.storeList}>
                        {(variantStores[variant.productVariantId] ?? []).map((store) => (
                          <View key={`${variant.productVariantId}-${store.storeId}`} style={styles.storeRow}>
                            <View style={styles.productCopy}>
                              <Text style={styles.storeTitle}>{store.storeName}</Text>
                              <Text style={styles.productMeta}>
                                {formatCurrency(store.salePrice ?? store.unitPrice, (store.currency ?? "TRY") as Currency)}
                              </Text>
                            </View>
                            <StatusBadge label={`${formatCount(store.quantity)} adet`} tone="warning" />
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState title="Stok verisi bulunamadi." />
        )}
      </Card>

      <ModalSheet
        visible={Boolean(activeOperation)}
        title={activeOperation ? `${activeOperation.variant.variantName} • ${activeOperation.kind}` : "Stok islemi"}
        subtitle="Formu doldurup islemi tamamla"
        onClose={() => setActiveOperation(null)}
      >
        {activeOperation?.kind === "receive" ? (
          <>
            <Text style={styles.filterLabel}>Mağaza</Text>
            <SelectionList
              items={activeOperation.stores.map((store) => ({
                label: store.storeName,
                value: store.storeId,
                description: `Mevcut stok ${formatCount(store.quantity)}`,
              }))}
              selectedValue={receiveForm.storeId}
              onSelect={(value) => setReceiveForm((current) => ({ ...current, storeId: value }))}
            />
            <TextField label="Miktar" value={receiveForm.quantity} onChangeText={(value) => setReceiveForm((current) => ({ ...current, quantity: value }))} keyboardType="numeric" />
            <TextField label="Birim fiyat" value={receiveForm.unitPrice} onChangeText={(value) => setReceiveForm((current) => ({ ...current, unitPrice: value }))} keyboardType="numeric" />
            <Text style={styles.filterLabel}>Tedarikci</Text>
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
              onSelect={(value) => setReceiveForm((current) => ({ ...current, supplierId: value === "none" ? "" : value }))}
            />
            <TextField label="Not" value={receiveForm.note} onChangeText={(value) => setReceiveForm((current) => ({ ...current, note: value }))} multiline />
          </>
        ) : null}

        {activeOperation?.kind === "transfer" ? (
          <>
            <Text style={styles.filterLabel}>Cikis magazasi</Text>
            <SelectionList
              items={activeOperation.stores.map((store) => ({
                label: store.storeName,
                value: store.storeId,
                description: `Mevcut stok ${formatCount(store.quantity)}`,
              }))}
              selectedValue={transferForm.fromStoreId}
              onSelect={(value) => setTransferForm((current) => ({ ...current, fromStoreId: value }))}
            />
            <Text style={styles.filterLabel}>Hedef magazasi</Text>
            <SelectionList
              items={stores
                .filter((store) => store.id !== transferForm.fromStoreId)
                .map((store) => ({
                  label: store.name,
                  value: store.id,
                  description: store.code,
                }))}
              selectedValue={transferForm.toStoreId}
              onSelect={(value) => setTransferForm((current) => ({ ...current, toStoreId: value }))}
            />
            <TextField label="Miktar" value={transferForm.quantity} onChangeText={(value) => setTransferForm((current) => ({ ...current, quantity: value }))} keyboardType="numeric" />
            <TextField label="Not" value={transferForm.note} onChangeText={(value) => setTransferForm((current) => ({ ...current, note: value }))} multiline />
          </>
        ) : null}

        {activeOperation?.kind === "adjust" ? (
          <>
            <Text style={styles.filterLabel}>Magaza</Text>
            <SelectionList
              items={activeOperation.stores.map((store) => ({
                label: store.storeName,
                value: store.storeId,
                description: `Mevcut stok ${formatCount(store.quantity)}`,
              }))}
              selectedValue={adjustForm.storeId}
              onSelect={(value) => setAdjustForm((current) => ({ ...current, storeId: value }))}
            />
            <TextField label="Yeni stok miktari" value={adjustForm.newQuantity} onChangeText={(value) => setAdjustForm((current) => ({ ...current, newQuantity: value }))} keyboardType="numeric" />
            <TextField label="Not" value={adjustForm.note} onChangeText={(value) => setAdjustForm((current) => ({ ...current, note: value }))} multiline />
          </>
        ) : null}

        <Button label="Islemi tamamla" onPress={() => void submitOperation()} loading={submitting} />
      </ModalSheet>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  filterStack: {
    gap: 12,
  },
  filterLabel: {
    color: mobileTheme.colors.dark.text,
    fontSize: 13,
    fontWeight: "700",
  },
  helperText: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
  },
  loadingWrap: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  productList: {
    marginTop: 12,
    gap: 14,
  },
  productCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: mobileTheme.colors.dark.border,
    backgroundColor: mobileTheme.colors.dark.surface2,
    padding: 14,
    gap: 14,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  productCopy: {
    flex: 1,
    gap: 4,
  },
  productTitle: {
    color: mobileTheme.colors.dark.text,
    fontSize: 16,
    fontWeight: "700",
  },
  productMeta: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
  },
  variantList: {
    gap: 12,
  },
  variantCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: mobileTheme.colors.dark.border,
    backgroundColor: mobileTheme.colors.dark.surface,
    padding: 12,
    gap: 12,
  },
  variantHeader: {
    gap: 10,
  },
  variantTitle: {
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
  operationButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  storeList: {
    gap: 8,
  },
  storeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 4,
  },
  storeTitle: {
    color: mobileTheme.colors.dark.text,
    fontSize: 14,
    fontWeight: "600",
  },
});
