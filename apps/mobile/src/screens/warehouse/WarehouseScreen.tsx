import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  addCountSessionLine,
  assignPickingTask,
  assignPutawayTask,
  cancelPickingTask,
  cancelPutawayTask,
  closeCountSession,
  completePickingTask,
  completePutawayTask,
  createCountSession,
  getCountSession,
  getCountSessions,
  getPickingTask,
  getPickingTasks,
  getProductVariants,
  getProducts,
  getPutawayTask,
  getPutawayTasks,
  getStores,
  getWarehouses,
  getWarehouseLocations,
  updateCountSessionLine,
  type CountSession,
  type CountSessionLine,
  type PickingTask,
  type Product,
  type ProductVariant,
  type PutawayTask,
  type Store,
  type Warehouse,
  type WarehouseLocation,
} from "@gase/core";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  ConfirmSheet,
  EmptyState,
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
import { useAuth } from "@/src/context/AuthContext";
import { formatDate } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";

type WarehouseScreenProps = {
  isActive?: boolean;
  onBack?: () => void;
};

type WarehouseSegment = "count" | "putaway" | "picking";
type CountStatusFilter = "ALL" | "OPEN" | "IN_PROGRESS" | "CLOSED";
type PutawayStatusFilter = "ALL" | "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type PickingStatusFilter =
  | "ALL"
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "SHORT_PICK";

type StoreOption = {
  id: string;
  name: string;
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: mobileTheme.colors.dark.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
    gap: 16,
  },
  sectionGap: {
    gap: 12,
  },
  list: {
    gap: 12,
  },
  loadingList: {
    gap: 12,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  hint: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 13,
    lineHeight: 18,
  },
  selectedHint: {
    color: mobileTheme.colors.dark.text,
    fontSize: 13,
    fontWeight: "600",
  },
  fieldGrid: {
    gap: 10,
  },
  fieldRow: {
    gap: 4,
  },
  fieldLabel: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  fieldValue: {
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  lineCard: {
    gap: 10,
  },
  lineTitle: {
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
  lineSubtitle: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 13,
    lineHeight: 18,
  },
  lineCaption: {
    color: mobileTheme.colors.dark.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  footerRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
});

function mergeStoreOptions(...groups: StoreOption[][]): StoreOption[] {
  const map = new Map<string, StoreOption>();
  for (const group of groups) {
    for (const item of group) {
      if (!item.id) continue;
      map.set(item.id, item);
    }
  }
  return [...map.values()];
}

function getCountStatusLabel(status?: string | null) {
  if (status === "OPEN") return "Açık";
  if (status === "IN_PROGRESS") return "Devam Ediyor";
  if (status === "CLOSED") return "Kapalı";
  return status ?? "-";
}

function getCountStatusTone(status?: string | null) {
  if (status === "OPEN") return "info" as const;
  if (status === "IN_PROGRESS") return "warning" as const;
  if (status === "CLOSED") return "neutral" as const;
  return "neutral" as const;
}

function getTaskStatusLabel(status?: string | null) {
  if (status === "PENDING") return "Bekliyor";
  if (status === "IN_PROGRESS") return "Üstlenildi";
  if (status === "COMPLETED") return "Tamamlandı";
  if (status === "CANCELLED") return "İptal";
  if (status === "SHORT_PICK") return "Eksik Toplama";
  return status ?? "-";
}

function getTaskStatusTone(status?: string | null) {
  if (status === "PENDING") return "info" as const;
  if (status === "IN_PROGRESS") return "warning" as const;
  if (status === "COMPLETED") return "positive" as const;
  if (status === "SHORT_PICK") return "danger" as const;
  if (status === "CANCELLED") return "neutral" as const;
  return "neutral" as const;
}

function getProductTitle(
  productName?: string | null,
  variantName?: string | null,
  productVariantId?: string | null,
) {
  return productName ?? variantName ?? productVariantId ?? "Kalem";
}

function getProductSubtitle(productName?: string | null, variantName?: string | null) {
  if (productName && variantName) return variantName;
  return null;
}

function getStoreName(storeOptions: StoreOption[], storeId?: string | null) {
  if (!storeId) return "Mağaza seç";
  return storeOptions.find((item) => item.id === storeId)?.name ?? storeId;
}

function getWarehouseName(warehouses: Warehouse[], warehouseId?: string | null) {
  if (!warehouseId) return "Depo seç";
  return warehouses.find((item) => item.id === warehouseId)?.name ?? warehouseId;
}

function parseRequiredNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function CountSessionDetailView({
  session,
  loading,
  error,
  canManage,
  canClose,
  onBack,
  onRefresh,
  onOpenAddLine,
  onOpenUpdateLine,
  onOpenCloseConfirm,
}: {
  session: CountSession | null;
  loading: boolean;
  error: string | null;
  canManage: boolean;
  canClose: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onOpenAddLine: () => void;
  onOpenUpdateLine: (line: CountSessionLine) => void;
  onOpenCloseConfirm: () => void;
}) {
  const isClosed = session?.status === "CLOSED";

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="Sayım Detayı"
          subtitle={session?.warehouseName ?? session?.id ?? "Oturum"}
          onBack={onBack}
          action={
            <Button
              label="Yenile"
              onPress={onRefresh}
              variant="secondary"
              size="sm"
              fullWidth={false}
            />
          }
        />

        {loading ? (
          <View style={styles.loadingList}>
            <SkeletonBlock height={96} />
            <SkeletonBlock height={120} />
            <SkeletonBlock height={120} />
          </View>
        ) : error ? (
          <Banner text={error} />
        ) : session ? (
          <>
            <Card>
              <SectionTitle title="Özet" />
              <View style={styles.fieldGrid}>
                <DetailField label="Mağaza" value={session.storeName ?? session.storeId ?? "-"} />
                <DetailField label="Depo" value={session.warehouseName ?? session.warehouseId ?? "-"} />
                <DetailField label="Durum" value={getCountStatusLabel(session.status)} />
                <DetailField label="Başlangıç" value={formatDate(session.startedAt)} />
                <DetailField label="Kapanış" value={formatDate(session.closedAt)} />
                <DetailField label="Not" value={session.notes ?? "-"} />
              </View>
            </Card>

            <Card>
              <SectionTitle title={`Sayım Satırları (${session.lines?.length ?? 0})`} />
              <View style={styles.list}>
                {session.lines?.length ? (
                  session.lines.map((line) => (
                    <Card key={line.id} style={styles.lineCard}>
                      <Text style={styles.lineTitle}>
                        {getProductTitle(line.productName, line.variantName, line.productVariantId)}
                      </Text>
                      {getProductSubtitle(line.productName, line.variantName) ? (
                        <Text style={styles.lineSubtitle}>
                          {getProductSubtitle(line.productName, line.variantName)}
                        </Text>
                      ) : null}
                      <Text style={styles.lineCaption}>
                        Lokasyon: {line.locationName ?? line.locationId ?? "-"}
                      </Text>
                      <Text style={styles.lineCaption}>Lot: {line.lotNumber ?? "-"}</Text>
                      <Text style={styles.lineCaption}>
                        Beklenen: {line.expectedQuantity ?? 0} • Sayılan: {line.countedQuantity ?? 0}
                      </Text>
                      <Text style={styles.lineCaption}>
                        Fark: {line.difference ?? "-"} • Ayarlandı: {line.isAdjusted ? "Evet" : "Hayır"}
                      </Text>
                      {canManage && !isClosed ? (
                        <Button
                          label="Sayılan Miktarı Güncelle"
                          onPress={() => onOpenUpdateLine(line)}
                          variant="secondary"
                          size="sm"
                          fullWidth={false}
                        />
                      ) : null}
                    </Card>
                  ))
                ) : (
                  <EmptyState title="Henüz satır yok." subtitle="Bu oturuma sayım satırı ekleyin." />
                )}
              </View>
            </Card>
          </>
        ) : (
          <EmptyState title="Sayım oturumu bulunamadı." />
        )}
      </ScrollView>

      {session ? (
        <StickyActionBar>
          <View style={styles.footerRow}>
            {canManage ? (
              <Button
                label="Satır Ekle"
                onPress={onOpenAddLine}
                variant="secondary"
                disabled={loading || isClosed}
                fullWidth={false}
              />
            ) : null}
            {canClose ? (
              <Button
                label="Kapat"
                onPress={onOpenCloseConfirm}
                variant="danger"
                disabled={loading || isClosed}
                fullWidth={false}
              />
            ) : null}
          </View>
        </StickyActionBar>
      ) : null}
    </View>
  );
}

function TaskDetailView({
  title,
  subtitle,
  loading,
  error,
  onBack,
  onRefresh,
  summaryFields,
  footer,
}: {
  title: string;
  subtitle: string;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onRefresh: () => void;
  summaryFields: { label: string; value: string }[];
  footer?: ReactNode;
}) {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title={title}
          subtitle={subtitle}
          onBack={onBack}
          action={
            <Button
              label="Yenile"
              onPress={onRefresh}
              variant="secondary"
              size="sm"
              fullWidth={false}
            />
          }
        />

        {loading ? (
          <View style={styles.loadingList}>
            <SkeletonBlock height={96} />
            <SkeletonBlock height={120} />
          </View>
        ) : error ? (
          <Banner text={error} />
        ) : (
          <Card>
            <SectionTitle title="Görev Özeti" />
            <View style={styles.fieldGrid}>
              {summaryFields.map((field) => (
                <DetailField key={field.label} label={field.label} value={field.value} />
              ))}
            </View>
          </Card>
        )}
      </ScrollView>
      {footer ? <StickyActionBar>{footer}</StickyActionBar> : null}
    </View>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || "-"}</Text>
    </View>
  );
}

export default function WarehouseScreen({
  isActive = true,
  onBack,
}: WarehouseScreenProps = {}) {
  const { can, user, storeIds } = useAuth();
  const canReadCount = can("COUNT_SESSION_READ");
  const canManageCount = can("COUNT_SESSION_MANAGE");
  const canCloseCount = can("COUNT_SESSION_ADJUST");
  const canReadWarehouse = can("WAREHOUSE_READ");
  const canManageWarehouse = can("WAREHOUSE_MANAGE");

  const segmentOptions = useMemo(() => {
    const options: { label: string; value: WarehouseSegment }[] = [];
    if (canReadCount) options.push({ label: "Sayım", value: "count" });
    if (canReadWarehouse) {
      options.push({ label: "Yerleştirme", value: "putaway" });
      options.push({ label: "Toplama", value: "picking" });
    }
    return options;
  }, [canReadCount, canReadWarehouse]);

  const [segment, setSegment] = useState<WarehouseSegment>("count");
  const [storePickerOpen, setStorePickerOpen] = useState(false);
  const [warehousePickerOpen, setWarehousePickerOpen] = useState(false);
  const [storeOptions, setStoreOptions] = useState<StoreOption[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [warehousesError, setWarehousesError] = useState<string | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");

  const [countSessions, setCountSessions] = useState<CountSession[]>([]);
  const [countLoading, setCountLoading] = useState(false);
  const [countError, setCountError] = useState<string | null>(null);
  const [countStatusFilter, setCountStatusFilter] = useState<CountStatusFilter>("ALL");

  const [putawayTasks, setPutawayTasks] = useState<PutawayTask[]>([]);
  const [putawayLoading, setPutawayLoading] = useState(false);
  const [putawayError, setPutawayError] = useState<string | null>(null);
  const [putawayStatusFilter, setPutawayStatusFilter] = useState<PutawayStatusFilter>("ALL");

  const [pickingTasks, setPickingTasks] = useState<PickingTask[]>([]);
  const [pickingLoading, setPickingLoading] = useState(false);
  const [pickingError, setPickingError] = useState<string | null>(null);
  const [pickingStatusFilter, setPickingStatusFilter] = useState<PickingStatusFilter>("ALL");

  const [countDetail, setCountDetail] = useState<CountSession | null>(null);
  const [countDetailId, setCountDetailId] = useState<string | null>(null);
  const [countDetailLoading, setCountDetailLoading] = useState(false);
  const [countDetailError, setCountDetailError] = useState<string | null>(null);

  const [putawayDetail, setPutawayDetail] = useState<PutawayTask | null>(null);
  const [putawayDetailId, setPutawayDetailId] = useState<string | null>(null);
  const [putawayDetailLoading, setPutawayDetailLoading] = useState(false);
  const [putawayDetailError, setPutawayDetailError] = useState<string | null>(null);

  const [pickingDetail, setPickingDetail] = useState<PickingTask | null>(null);
  const [pickingDetailId, setPickingDetailId] = useState<string | null>(null);
  const [pickingDetailLoading, setPickingDetailLoading] = useState(false);
  const [pickingDetailError, setPickingDetailError] = useState<string | null>(null);

  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [createSessionWarehouseId, setCreateSessionWarehouseId] = useState("");
  const [createSessionNotes, setCreateSessionNotes] = useState("");
  const [createSessionError, setCreateSessionError] = useState<string | null>(null);

  const [addLineOpen, setAddLineOpen] = useState(false);
  const [addLineError, setAddLineError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variantOptions, setVariantOptions] = useState<ProductVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [lineLocations, setLineLocations] = useState<WarehouseLocation[]>([]);
  const [lineLocationsLoading, setLineLocationsLoading] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [expectedQuantity, setExpectedQuantity] = useState("");
  const [countedQuantity, setCountedQuantity] = useState("");

  const [lineToUpdate, setLineToUpdate] = useState<CountSessionLine | null>(null);
  const [updateLineOpen, setUpdateLineOpen] = useState(false);
  const [updateLineError, setUpdateLineError] = useState<string | null>(null);
  const [updateCountedQuantity, setUpdateCountedQuantity] = useState("");

  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [cancelTask, setCancelTask] = useState<{ kind: "putaway" | "picking"; id: string } | null>(null);
  const [completePickingOpen, setCompletePickingOpen] = useState(false);
  const [completePickingQuantity, setCompletePickingQuantity] = useState("");
  const [completePickingError, setCompletePickingError] = useState<string | null>(null);

  const [submittingKey, setSubmittingKey] = useState<string | null>(null);

  const fallbackStores = useMemo(() => {
    const fromUserStores: StoreOption[] = (user?.userStores ?? [])
      .map((item) => ({
        id: item.store?.id ?? item.storeId ?? "",
        name: item.store?.name ?? item.store?.id ?? item.storeId ?? "",
      }))
      .filter((item) => item.id);

    const fromStoreIds: StoreOption[] = storeIds.map((id) => ({
      id,
      name: id,
    }));

    return mergeStoreOptions(fromUserStores, fromStoreIds);
  }, [storeIds, user?.userStores]);

  useEffect(() => {
    if (!segmentOptions.some((item) => item.value === segment)) {
      setSegment(segmentOptions[0]?.value ?? "count");
    }
  }, [segment, segmentOptions]);

  useEffect(() => {
    if (!isActive) return;
    let alive = true;
    setStoreOptions(fallbackStores);
    void getStores({ page: 1, limit: 100 })
      .then((response) => {
        if (!alive) return;
        const scoped = (response.data ?? [])
          .filter((item) => !storeIds.length || storeIds.includes(item.id))
          .map((item: Store) => ({ id: item.id, name: item.name }));
        setStoreOptions(mergeStoreOptions(fallbackStores, scoped));
      })
      .catch(() => {
        if (!alive) return;
        setStoreOptions(fallbackStores);
      });

    return () => {
      alive = false;
    };
  }, [fallbackStores, isActive, storeIds]);

  useEffect(() => {
    if (!selectedStoreId && storeOptions.length === 1) {
      setSelectedStoreId(storeOptions[0].id);
      return;
    }
    if (selectedStoreId && !storeOptions.some((item) => item.id === selectedStoreId)) {
      setSelectedStoreId(storeOptions[0]?.id ?? "");
    }
  }, [selectedStoreId, storeOptions]);

  const loadWarehouses = useCallback(async () => {
    if (!selectedStoreId) {
      setWarehouses([]);
      setSelectedWarehouseId("");
      setWarehousesError(null);
      return;
    }

    setWarehousesLoading(true);
    setWarehousesError(null);
    try {
      const nextWarehouses = await getWarehouses({ storeId: selectedStoreId });
      setWarehouses(nextWarehouses);
      setSelectedWarehouseId((current) => {
        if (current && nextWarehouses.some((item) => item.id === current)) return current;
        if (nextWarehouses.length === 1) return nextWarehouses[0].id;
        return "";
      });
    } catch (error) {
      setWarehouses([]);
      setSelectedWarehouseId("");
      setWarehousesError(error instanceof Error ? error.message : "Depolar yüklenemedi.");
    } finally {
      setWarehousesLoading(false);
    }
  }, [selectedStoreId]);

  useEffect(() => {
    if (!isActive) return;
    void loadWarehouses();
  }, [isActive, loadWarehouses]);

  const loadCountSessions = useCallback(async () => {
    if (!canReadCount || !selectedStoreId) {
      setCountSessions([]);
      setCountError(null);
      return;
    }

    setCountLoading(true);
    setCountError(null);
    try {
      setCountSessions(await getCountSessions({ storeId: selectedStoreId }));
    } catch (error) {
      setCountError(error instanceof Error ? error.message : "Sayım oturumları yüklenemedi.");
    } finally {
      setCountLoading(false);
    }
  }, [canReadCount, selectedStoreId]);

  useEffect(() => {
    if (!isActive) return;
    void loadCountSessions();
  }, [isActive, loadCountSessions]);

  const loadPutawayTasks = useCallback(async () => {
    if (!canReadWarehouse || !selectedWarehouseId) {
      setPutawayTasks([]);
      setPutawayError(null);
      return;
    }

    setPutawayLoading(true);
    setPutawayError(null);
    try {
      setPutawayTasks(await getPutawayTasks({ warehouseId: selectedWarehouseId }));
    } catch (error) {
      setPutawayError(error instanceof Error ? error.message : "Yerleştirme görevleri yüklenemedi.");
    } finally {
      setPutawayLoading(false);
    }
  }, [canReadWarehouse, selectedWarehouseId]);

  useEffect(() => {
    if (!isActive) return;
    void loadPutawayTasks();
  }, [isActive, loadPutawayTasks]);

  const loadPickingTasks = useCallback(async () => {
    if (!canReadWarehouse || !selectedWarehouseId) {
      setPickingTasks([]);
      setPickingError(null);
      return;
    }

    setPickingLoading(true);
    setPickingError(null);
    try {
      setPickingTasks(await getPickingTasks({ warehouseId: selectedWarehouseId }));
    } catch (error) {
      setPickingError(error instanceof Error ? error.message : "Toplama görevleri yüklenemedi.");
    } finally {
      setPickingLoading(false);
    }
  }, [canReadWarehouse, selectedWarehouseId]);

  useEffect(() => {
    if (!isActive) return;
    void loadPickingTasks();
  }, [isActive, loadPickingTasks]);

  const loadCountDetail = useCallback(async (id: string) => {
    setCountDetailId(id);
    setCountDetailLoading(true);
    setCountDetailError(null);
    try {
      setCountDetail(await getCountSession(id));
    } catch (error) {
      setCountDetailError(error instanceof Error ? error.message : "Sayım detayı yüklenemedi.");
    } finally {
      setCountDetailLoading(false);
    }
  }, []);

  const loadPutawayDetail = useCallback(async (id: string) => {
    setPutawayDetailId(id);
    setPutawayDetailLoading(true);
    setPutawayDetailError(null);
    try {
      setPutawayDetail(await getPutawayTask(id));
    } catch (error) {
      setPutawayDetailError(error instanceof Error ? error.message : "Yerleştirme detayı yüklenemedi.");
    } finally {
      setPutawayDetailLoading(false);
    }
  }, []);

  const loadPickingDetail = useCallback(async (id: string) => {
    setPickingDetailId(id);
    setPickingDetailLoading(true);
    setPickingDetailError(null);
    try {
      setPickingDetail(await getPickingTask(id));
    } catch (error) {
      setPickingDetailError(error instanceof Error ? error.message : "Toplama detayı yüklenemedi.");
    } finally {
      setPickingDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!addLineOpen) return;
    let alive = true;
    const timer = setTimeout(() => {
      setProductSearchLoading(true);
      void getProducts({ page: 1, limit: 12, search: productSearch.trim() || undefined, variantIsActive: true })
        .then((response) => {
          if (!alive) return;
          setProductResults(response.data ?? []);
        })
        .catch(() => {
          if (!alive) return;
          setProductResults([]);
        })
        .finally(() => {
          if (!alive) return;
          setProductSearchLoading(false);
        });
    }, productSearch.trim() ? 250 : 0);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [addLineOpen, productSearch]);

  useEffect(() => {
    if (!addLineOpen || !selectedProduct?.id) {
      setVariantOptions([]);
      setSelectedVariantId("");
      return;
    }

    let alive = true;
    setVariantsLoading(true);
    void getProductVariants(selectedProduct.id, { isActive: true })
      .then((variants) => {
        if (!alive) return;
        setVariantOptions(variants);
        setSelectedVariantId((current) => current || variants[0]?.id || "");
      })
      .catch(() => {
        if (!alive) return;
        setVariantOptions([]);
        setSelectedVariantId("");
      })
      .finally(() => {
        if (!alive) return;
        setVariantsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [addLineOpen, selectedProduct]);

  const openAddLine = useCallback(async () => {
    if (!countDetail?.warehouseId) return;
    setAddLineError(null);
    setProductSearch("");
    setSelectedProduct(null);
    setVariantOptions([]);
    setSelectedVariantId("");
    setSelectedLocationId("");
    setLotNumber("");
    setExpectedQuantity("");
    setCountedQuantity("");
    setAddLineOpen(true);
    setLineLocationsLoading(true);
    try {
      const nextLocations = await getWarehouseLocations(countDetail.warehouseId);
      setLineLocations(nextLocations);
      if (nextLocations.length === 1) setSelectedLocationId(nextLocations[0].id);
    } catch {
      setLineLocations([]);
    } finally {
      setLineLocationsLoading(false);
    }
  }, [countDetail?.warehouseId]);

  const filteredCountSessions = useMemo(
    () =>
      countSessions.filter((item) => {
        if (selectedWarehouseId && item.warehouseId !== selectedWarehouseId) return false;
        if (countStatusFilter !== "ALL" && item.status !== countStatusFilter) return false;
        return true;
      }),
    [countSessions, countStatusFilter, selectedWarehouseId],
  );

  const filteredPutawayTasks = useMemo(
    () =>
      putawayTasks.filter((item) => {
        if (putawayStatusFilter !== "ALL" && item.status !== putawayStatusFilter) return false;
        return true;
      }),
    [putawayStatusFilter, putawayTasks],
  );

  const filteredPickingTasks = useMemo(
    () =>
      pickingTasks.filter((item) => {
        if (pickingStatusFilter !== "ALL" && item.status !== pickingStatusFilter) return false;
        return true;
      }),
    [pickingStatusFilter, pickingTasks],
  );

  const storeSelectionRequired = storeOptions.length !== 1;
  const storeSelected = Boolean(selectedStoreId);
  const warehouseSelected = Boolean(selectedWarehouseId);
  const currentStoreName = getStoreName(storeOptions, selectedStoreId);
  const currentWarehouseName = getWarehouseName(warehouses, selectedWarehouseId);

  const submitCreateSession = useCallback(async () => {
    if (!selectedStoreId) {
      setCreateSessionError("Önce mağaza seçin.");
      return;
    }
    if (!createSessionWarehouseId) {
      setCreateSessionError("Depo seçimi zorunludur.");
      return;
    }

    setSubmittingKey("create-session");
    setCreateSessionError(null);
    try {
      const created = await createCountSession({
        storeId: selectedStoreId,
        warehouseId: createSessionWarehouseId,
        notes: createSessionNotes.trim() || undefined,
      });
      setCreateSessionOpen(false);
      setCreateSessionWarehouseId("");
      setCreateSessionNotes("");
      await loadCountSessions();
      await loadCountDetail(created.id);
    } catch (error) {
      setCreateSessionError(error instanceof Error ? error.message : "Oturum oluşturulamadı.");
    } finally {
      setSubmittingKey(null);
    }
  }, [createSessionNotes, createSessionWarehouseId, loadCountDetail, loadCountSessions, selectedStoreId]);

  const submitAddLine = useCallback(async () => {
    if (!countDetailId) return;
    if (!selectedVariantId) {
      setAddLineError("Varyant seçimi zorunludur.");
      return;
    }
    if (!selectedLocationId) {
      setAddLineError("Lokasyon seçimi zorunludur.");
      return;
    }

    const expected = parseRequiredNumber(expectedQuantity);
    const counted = parseRequiredNumber(countedQuantity);
    if (expected == null || expected < 0) {
      setAddLineError("Beklenen miktar geçerli olmalıdır.");
      return;
    }
    if (counted == null || counted < 0) {
      setAddLineError("Sayılan miktar geçerli olmalıdır.");
      return;
    }

    setSubmittingKey("add-line");
    setAddLineError(null);
    try {
      await addCountSessionLine(countDetailId, {
        productVariantId: selectedVariantId,
        locationId: selectedLocationId,
        lotNumber: lotNumber.trim() || undefined,
        expectedQuantity: expected,
        countedQuantity: counted,
      });
      setAddLineOpen(false);
      await Promise.all([loadCountDetail(countDetailId), loadCountSessions()]);
    } catch (error) {
      setAddLineError(error instanceof Error ? error.message : "Sayım satırı eklenemedi.");
    } finally {
      setSubmittingKey(null);
    }
  }, [
    countDetailId,
    countedQuantity,
    expectedQuantity,
    loadCountDetail,
    loadCountSessions,
    lotNumber,
    selectedLocationId,
    selectedVariantId,
  ]);

  const submitUpdateLine = useCallback(async () => {
    if (!countDetailId || !lineToUpdate?.id) return;
    const nextCounted = parseRequiredNumber(updateCountedQuantity);
    if (nextCounted == null || nextCounted < 0) {
      setUpdateLineError("Sayılan miktar geçerli olmalıdır.");
      return;
    }

    setSubmittingKey("update-line");
    setUpdateLineError(null);
    try {
      await updateCountSessionLine(countDetailId, lineToUpdate.id, { countedQuantity: nextCounted });
      setUpdateLineOpen(false);
      setLineToUpdate(null);
      await loadCountDetail(countDetailId);
    } catch (error) {
      setUpdateLineError(error instanceof Error ? error.message : "Satır güncellenemedi.");
    } finally {
      setSubmittingKey(null);
    }
  }, [countDetailId, lineToUpdate?.id, loadCountDetail, updateCountedQuantity]);

  const submitCloseSession = useCallback(async () => {
    if (!countDetailId) return;
    setSubmittingKey("close-session");
    try {
      setCloseConfirmOpen(false);
      await Promise.all([closeCountSession(countDetailId), loadCountSessions()]);
      await loadCountDetail(countDetailId);
    } catch (error) {
      setCountDetailError(error instanceof Error ? error.message : "Oturum kapatılamadı.");
    } finally {
      setSubmittingKey(null);
    }
  }, [countDetailId, loadCountDetail, loadCountSessions]);

  const submitPutawayAction = useCallback(
    async (action: "assign" | "complete") => {
      if (!putawayDetailId || !user?.id) return;
      setSubmittingKey(`putaway-${action}`);
      try {
        if (action === "assign") {
          await assignPutawayTask(putawayDetailId, user.id);
        } else {
          await completePutawayTask(putawayDetailId);
        }
        await Promise.all([loadPutawayDetail(putawayDetailId), loadPutawayTasks()]);
      } catch (error) {
        setPutawayDetailError(error instanceof Error ? error.message : "Görev güncellenemedi.");
      } finally {
        setSubmittingKey(null);
      }
    },
    [loadPutawayDetail, loadPutawayTasks, putawayDetailId, user?.id],
  );

  const submitPickingAssign = useCallback(async () => {
    if (!pickingDetailId || !user?.id) return;
    setSubmittingKey("picking-assign");
    try {
      await assignPickingTask(pickingDetailId, user.id);
      await Promise.all([loadPickingDetail(pickingDetailId), loadPickingTasks()]);
    } catch (error) {
      setPickingDetailError(error instanceof Error ? error.message : "Görev üstlenilemedi.");
    } finally {
      setSubmittingKey(null);
    }
  }, [loadPickingDetail, loadPickingTasks, pickingDetailId, user?.id]);

  const submitCompletePicking = useCallback(async () => {
    if (!pickingDetailId) return;
    const nextPickedQuantity = parseRequiredNumber(completePickingQuantity);
    if (nextPickedQuantity == null || nextPickedQuantity < 0) {
      setCompletePickingError("Toplanan miktar geçerli olmalıdır.");
      return;
    }

    setSubmittingKey("picking-complete");
    setCompletePickingError(null);
    try {
      setCompletePickingOpen(false);
      await completePickingTask(pickingDetailId, { pickedQuantity: nextPickedQuantity });
      await Promise.all([loadPickingDetail(pickingDetailId), loadPickingTasks()]);
    } catch (error) {
      setCompletePickingError(error instanceof Error ? error.message : "Görev tamamlanamadı.");
    } finally {
      setSubmittingKey(null);
    }
  }, [completePickingQuantity, loadPickingDetail, loadPickingTasks, pickingDetailId]);

  const submitCancelTask = useCallback(async () => {
    if (!cancelTask) return;
    setSubmittingKey(`cancel-${cancelTask.kind}`);
    try {
      if (cancelTask.kind === "putaway") {
        await cancelPutawayTask(cancelTask.id);
        await Promise.all([loadPutawayDetail(cancelTask.id), loadPutawayTasks()]);
      } else {
        await cancelPickingTask(cancelTask.id);
        await Promise.all([loadPickingDetail(cancelTask.id), loadPickingTasks()]);
      }
      setCancelTask(null);
    } catch (error) {
      if (cancelTask.kind === "putaway") {
        setPutawayDetailError(error instanceof Error ? error.message : "Görev iptal edilemedi.");
      } else {
        setPickingDetailError(error instanceof Error ? error.message : "Görev iptal edilemedi.");
      }
    } finally {
      setSubmittingKey(null);
    }
  }, [cancelTask, loadPickingDetail, loadPickingTasks, loadPutawayDetail, loadPutawayTasks]);

  if (countDetailId) {
    return (
      <>
        <CountSessionDetailView
          session={countDetail}
          loading={countDetailLoading}
          error={countDetailError}
          canManage={canManageCount}
          canClose={canCloseCount}
          onBack={() => {
            setCountDetailId(null);
            setCountDetail(null);
            setCountDetailError(null);
          }}
          onRefresh={() => {
            if (countDetailId) void loadCountDetail(countDetailId);
          }}
          onOpenAddLine={() => void openAddLine()}
          onOpenUpdateLine={(line) => {
            setLineToUpdate(line);
            setUpdateCountedQuantity(String(line.countedQuantity ?? ""));
            setUpdateLineError(null);
            setUpdateLineOpen(true);
          }}
          onOpenCloseConfirm={() => setCloseConfirmOpen(true)}
        />

        <ModalSheet
          visible={addLineOpen}
          title="Sayım Satırı Ekle"
          subtitle="Ürün, varyant ve lokasyon seçerek satır ekleyin."
          onClose={() => setAddLineOpen(false)}
        >
          {addLineError ? <Banner text={addLineError} /> : null}
          <SearchBar
            value={productSearch}
            onChangeText={setProductSearch}
            placeholder="Ürün ara"
            hint="Ürün seçildikten sonra varyant ve lokasyon belirleyin."
          />
          {productSearchLoading ? (
            <View style={styles.loadingList}>
              <SkeletonBlock height={64} />
              <SkeletonBlock height={64} />
            </View>
          ) : productResults.length ? (
            <View style={styles.list}>
              {productResults.map((product) => (
                <ListRow
                  key={product.id}
                  title={product.name}
                  subtitle={product.sku}
                  badgeLabel={selectedProduct?.id === product.id ? "seçili" : "ürün"}
                  badgeTone={selectedProduct?.id === product.id ? "info" : "neutral"}
                  onPress={() => setSelectedProduct(product)}
                  icon={
                    <MaterialCommunityIcons
                      name="package-variant-closed"
                      size={20}
                      color={mobileTheme.colors.brand.primary}
                    />
                  }
                />
              ))}
            </View>
          ) : (
            <EmptyState title="Ürün bulunamadı." subtitle="Farklı bir arama ile tekrar deneyin." />
          )}

          {selectedProduct ? (
            <Card>
              <SectionTitle title="Varyant" />
              <View style={styles.sectionGap}>
                <Text style={styles.selectedHint}>Seçili ürün: {selectedProduct.name}</Text>
                {variantsLoading ? (
                  <View style={styles.loadingList}>
                    <SkeletonBlock height={52} />
                    <SkeletonBlock height={52} />
                  </View>
                ) : variantOptions.length ? (
                  <FilterTabs
                    value={selectedVariantId || variantOptions[0]?.id || ""}
                    options={variantOptions.map((variant) => ({
                      label: variant.name,
                      value: variant.id,
                    }))}
                    onChange={setSelectedVariantId}
                  />
                ) : (
                  <EmptyState title="Aktif varyant bulunamadı." />
                )}
              </View>
            </Card>
          ) : null}

          <Card>
            <SectionTitle title="Lokasyon" />
            {lineLocationsLoading ? (
              <View style={styles.loadingList}>
                <SkeletonBlock height={64} />
                <SkeletonBlock height={64} />
              </View>
            ) : lineLocations.length ? (
              <SelectionList
                items={lineLocations.map((location) => ({
                  value: location.id,
                  label: location.name,
                  description: `${location.code} • ${location.type ?? "-"}`,
                }))}
                selectedValue={selectedLocationId || null}
                onSelect={setSelectedLocationId}
              />
            ) : (
              <EmptyState title="Lokasyon bulunamadı." subtitle="Bu depo için aktif lokasyon yok." />
            )}
          </Card>

          <TextField label="Lot Numarası" value={lotNumber} onChangeText={setLotNumber} />
          <TextField
            label="Beklenen Miktar"
            value={expectedQuantity}
            onChangeText={setExpectedQuantity}
            keyboardType="numeric"
            inputMode="numeric"
          />
          <TextField
            label="Sayılan Miktar"
            value={countedQuantity}
            onChangeText={setCountedQuantity}
            keyboardType="numeric"
            inputMode="numeric"
          />

          <View style={styles.actionRow}>
            <Button label="Vazgeç" onPress={() => setAddLineOpen(false)} variant="ghost" />
            <Button
              label="Satır Ekle"
              onPress={() => void submitAddLine()}
              loading={submittingKey === "add-line"}
            />
          </View>
        </ModalSheet>

        <ModalSheet
          visible={updateLineOpen}
          title="Sayılan Miktarı Güncelle"
          subtitle={lineToUpdate ? getProductTitle(lineToUpdate.productName, lineToUpdate.variantName, lineToUpdate.productVariantId) : "Satır"}
          onClose={() => setUpdateLineOpen(false)}
        >
          <InlineFieldError text={updateLineError} />
          <TextField
            label="Sayılan Miktar"
            value={updateCountedQuantity}
            onChangeText={setUpdateCountedQuantity}
            keyboardType="numeric"
            inputMode="numeric"
          />
          <View style={styles.actionRow}>
            <Button label="Vazgeç" onPress={() => setUpdateLineOpen(false)} variant="ghost" />
            <Button
              label="Güncelle"
              onPress={() => void submitUpdateLine()}
              loading={submittingKey === "update-line"}
            />
          </View>
        </ModalSheet>

        <ConfirmSheet
          visible={closeConfirmOpen}
          title="Oturumu kapat"
          subtitle="Bu işlem sonrası oturum kapalı duruma geçer."
          confirmLabel="Kapat"
          onConfirm={() => void submitCloseSession()}
          onClose={() => setCloseConfirmOpen(false)}
          loading={submittingKey === "close-session"}
        />
      </>
    );
  }

  if (putawayDetailId) {
    const subtitle = getProductTitle(
      putawayDetail?.productName,
      putawayDetail?.variantName,
      putawayDetail?.productVariantId,
    );

    return (
      <>
        <TaskDetailView
          title="Yerleştirme Detayı"
          subtitle={subtitle}
          loading={putawayDetailLoading}
          error={putawayDetailError}
          onBack={() => {
            setPutawayDetailId(null);
            setPutawayDetail(null);
            setPutawayDetailError(null);
          }}
          onRefresh={() => {
            if (putawayDetailId) void loadPutawayDetail(putawayDetailId);
          }}
          summaryFields={[
            { label: "Varyant", value: putawayDetail?.variantName ?? putawayDetail?.productVariantId ?? "-" },
            { label: "Miktar", value: String(putawayDetail?.quantity ?? "-") },
            { label: "Depo", value: putawayDetail?.warehouseName ?? putawayDetail?.warehouseId ?? "-" },
            { label: "Hedef Lokasyon", value: putawayDetail?.toLocationName ?? putawayDetail?.toLocationCode ?? putawayDetail?.toLocationId ?? "-" },
            { label: "Durum", value: getTaskStatusLabel(putawayDetail?.status) },
            { label: "Mal Kabul", value: putawayDetail?.goodsReceiptId ?? "-" },
            { label: "Not", value: putawayDetail?.notes ?? "-" },
            { label: "Tamamlanma", value: formatDate(putawayDetail?.completedAt) },
          ]}
          footer={
            canManageWarehouse ? (
              <View style={styles.footerRow}>
                {putawayDetail?.status === "PENDING" ? (
                  <Button
                    label="Üstlen"
                    onPress={() => void submitPutawayAction("assign")}
                    loading={submittingKey === "putaway-assign"}
                    fullWidth={false}
                  />
                ) : null}
                {putawayDetail?.status === "IN_PROGRESS" ? (
                  <Button
                    label="Tamamla"
                    onPress={() => void submitPutawayAction("complete")}
                    loading={submittingKey === "putaway-complete"}
                    fullWidth={false}
                  />
                ) : null}
                {putawayDetail?.status === "PENDING" || putawayDetail?.status === "IN_PROGRESS" ? (
                  <Button
                    label="İptal"
                    onPress={() => setCancelTask({ kind: "putaway", id: putawayDetailId })}
                    variant="danger"
                    fullWidth={false}
                  />
                ) : null}
              </View>
            ) : null
          }
        />

        <ConfirmSheet
          visible={cancelTask?.kind === "putaway"}
          title="Görevi iptal et"
          subtitle="Yerleştirme görevi iptal edilecek."
          confirmLabel="İptal Et"
          onConfirm={() => void submitCancelTask()}
          onClose={() => setCancelTask(null)}
          loading={submittingKey === "cancel-putaway"}
        />
      </>
    );
  }

  if (pickingDetailId) {
    const subtitle = getProductTitle(
      pickingDetail?.productName,
      pickingDetail?.variantName,
      pickingDetail?.productVariantId,
    );

    return (
      <>
        <TaskDetailView
          title="Toplama Detayı"
          subtitle={subtitle}
          loading={pickingDetailLoading}
          error={pickingDetailError}
          onBack={() => {
            setPickingDetailId(null);
            setPickingDetail(null);
            setPickingDetailError(null);
          }}
          onRefresh={() => {
            if (pickingDetailId) void loadPickingDetail(pickingDetailId);
          }}
          summaryFields={[
            { label: "Varyant", value: pickingDetail?.variantName ?? pickingDetail?.productVariantId ?? "-" },
            { label: "İstenen", value: String(pickingDetail?.requestedQuantity ?? "-") },
            { label: "Toplanan", value: String(pickingDetail?.pickedQuantity ?? "-") },
            { label: "Depo", value: pickingDetail?.warehouseName ?? pickingDetail?.warehouseId ?? "-" },
            { label: "Lokasyon", value: pickingDetail?.fromLocationName ?? pickingDetail?.fromLocationCode ?? pickingDetail?.fromLocationId ?? "-" },
            { label: "Wave", value: pickingDetail?.waveCode ?? pickingDetail?.waveId ?? "-" },
            { label: "Satış", value: pickingDetail?.saleId ?? "-" },
            { label: "Durum", value: getTaskStatusLabel(pickingDetail?.status) },
            { label: "Not", value: pickingDetail?.notes ?? "-" },
            { label: "Tamamlanma", value: formatDate(pickingDetail?.completedAt) },
          ]}
          footer={
            canManageWarehouse ? (
              <View style={styles.footerRow}>
                {pickingDetail?.status === "PENDING" ? (
                  <Button
                    label="Üstlen"
                    onPress={() => void submitPickingAssign()}
                    loading={submittingKey === "picking-assign"}
                    fullWidth={false}
                  />
                ) : null}
                {pickingDetail?.status === "IN_PROGRESS" ? (
                  <Button
                    label="Tamamla"
                    onPress={() => {
                      setCompletePickingQuantity(String(pickingDetail.requestedQuantity ?? ""));
                      setCompletePickingError(null);
                      setCompletePickingOpen(true);
                    }}
                    fullWidth={false}
                  />
                ) : null}
                {pickingDetail?.status === "PENDING" || pickingDetail?.status === "IN_PROGRESS" ? (
                  <Button
                    label="İptal"
                    onPress={() => setCancelTask({ kind: "picking", id: pickingDetailId })}
                    variant="danger"
                    fullWidth={false}
                  />
                ) : null}
              </View>
            ) : null
          }
        />

        <ModalSheet
          visible={completePickingOpen}
          title="Toplamayı Tamamla"
          subtitle="Toplanan miktarı girin."
          onClose={() => setCompletePickingOpen(false)}
        >
          <InlineFieldError text={completePickingError} />
          <TextField
            label="Toplanan Miktar"
            value={completePickingQuantity}
            onChangeText={setCompletePickingQuantity}
            keyboardType="numeric"
            inputMode="numeric"
          />
          <View style={styles.actionRow}>
            <Button label="Vazgeç" onPress={() => setCompletePickingOpen(false)} variant="ghost" />
            <Button
              label="Tamamla"
              onPress={() => void submitCompletePicking()}
              loading={submittingKey === "picking-complete"}
            />
          </View>
        </ModalSheet>

        <ConfirmSheet
          visible={cancelTask?.kind === "picking"}
          title="Görevi iptal et"
          subtitle="Toplama görevi iptal edilecek."
          confirmLabel="İptal Et"
          onConfirm={() => void submitCancelTask()}
          onClose={() => setCancelTask(null)}
          loading={submittingKey === "cancel-picking"}
        />
      </>
    );
  }

  return (
    <>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title="Depo"
            subtitle="Saha operasyonları için sayım, yerleştirme ve toplama merkezi"
            onBack={onBack}
            action={
              <Button
                label={currentStoreName}
                onPress={() => setStorePickerOpen(true)}
                variant="secondary"
                size="sm"
                fullWidth={false}
              />
            }
          />

          {!segmentOptions.length ? (
            <EmptyState title="Depo ekranına erişim yok." subtitle="Gerekli depo izinleri tanımlanmamış." />
          ) : (
            <>
              <Card>
                <SectionTitle title="Operasyon Alanı" />
                <View style={styles.sectionGap}>
                  <FilterTabs value={segment} options={segmentOptions} onChange={setSegment} />
                  <View style={styles.pillRow}>
                    <Button
                      label={currentStoreName}
                      onPress={() => setStorePickerOpen(true)}
                      variant="secondary"
                      size="sm"
                      fullWidth={false}
                    />
                    <Button
                      label={currentWarehouseName}
                      onPress={() => setWarehousePickerOpen(true)}
                      variant="secondary"
                      size="sm"
                      fullWidth={false}
                      disabled={!storeSelected || warehousesLoading}
                    />
                  </View>
                  {warehousesError ? <InlineFieldError text={warehousesError} /> : null}
                  <Text style={styles.hint}>
                    {segment === "count"
                      ? "Sayımda depo filtresi opsiyoneldir; görev listelerinde zorunludur."
                      : "Yerleştirme ve toplama listesi için depo seçimi zorunludur."}
                  </Text>
                </View>
              </Card>

              {!storeSelected ? (
                <EmptyStateWithAction
                  title="Önce mağaza seçin."
                  subtitle="Depo operasyonlarını görmek için mağaza bağlamı gerekir."
                  actionLabel={storeSelectionRequired ? "Mağaza Seç" : "Yenile"}
                  onAction={() => {
                    if (storeSelectionRequired) setStorePickerOpen(true);
                    else void loadWarehouses();
                  }}
                />
              ) : null}

              {segment === "count" && storeSelected ? (
                <>
                  <Card>
                    <SectionTitle
                      title="Sayım Oturumları"
                      action={
                        canManageCount ? (
                          <Button
                            label="Yeni Oturum"
                            onPress={() => {
                              setCreateSessionWarehouseId(selectedWarehouseId || warehouses[0]?.id || "");
                              setCreateSessionNotes("");
                              setCreateSessionError(null);
                              setCreateSessionOpen(true);
                            }}
                            size="sm"
                            fullWidth={false}
                          />
                        ) : null
                      }
                    />
                    <View style={styles.sectionGap}>
                      <FilterTabs
                        value={countStatusFilter}
                        options={[
                          { label: "Tümü", value: "ALL" },
                          { label: "Açık", value: "OPEN" },
                          { label: "Devam", value: "IN_PROGRESS" },
                          { label: "Kapalı", value: "CLOSED" },
                        ]}
                        onChange={setCountStatusFilter}
                      />
                    </View>
                  </Card>

                  {countLoading ? (
                    <View style={styles.loadingList}>
                      <SkeletonBlock height={84} />
                      <SkeletonBlock height={84} />
                      <SkeletonBlock height={84} />
                    </View>
                  ) : countError ? (
                    <Banner text={countError} />
                  ) : filteredCountSessions.length ? (
                    <View style={styles.list}>
                      {filteredCountSessions.map((session) => (
                        <ListRow
                          key={session.id}
                          title={session.warehouseName ?? session.warehouseId ?? "Sayım oturumu"}
                          subtitle={`${getCountStatusLabel(session.status)} • ${formatDate(session.startedAt)}`}
                          caption={session.notes ?? session.storeName ?? session.id}
                          badgeLabel={getCountStatusLabel(session.status)}
                          badgeTone={getCountStatusTone(session.status)}
                          onPress={() => void loadCountDetail(session.id)}
                          icon={
                            <MaterialCommunityIcons
                              name="clipboard-text-clock-outline"
                              size={20}
                              color={mobileTheme.colors.brand.primary}
                            />
                          }
                        />
                      ))}
                    </View>
                  ) : (
                    <EmptyState title="Sayım oturumu bulunamadı." subtitle="Seçili filtrelere uygun kayıt yok." />
                  )}
                </>
              ) : null}

              {segment === "putaway" && storeSelected ? (
                !warehouseSelected ? (
                  <EmptyStateWithAction
                    title="Depo seçimi gerekli."
                    subtitle="Yerleştirme görevlerini görmek için bir depo seçin."
                    actionLabel="Depo Seç"
                    onAction={() => setWarehousePickerOpen(true)}
                  />
                ) : (
                  <>
                    <Card>
                      <SectionTitle title="Yerleştirme Görevleri" />
                      <View style={styles.sectionGap}>
                        <FilterTabs
                          value={putawayStatusFilter}
                          options={[
                            { label: "Tümü", value: "ALL" },
                            { label: "Bekliyor", value: "PENDING" },
                            { label: "Üstlenildi", value: "IN_PROGRESS" },
                            { label: "Tamamlandı", value: "COMPLETED" },
                            { label: "İptal", value: "CANCELLED" },
                          ]}
                          onChange={setPutawayStatusFilter}
                        />
                      </View>
                    </Card>

                    {putawayLoading ? (
                      <View style={styles.loadingList}>
                        <SkeletonBlock height={84} />
                        <SkeletonBlock height={84} />
                      </View>
                    ) : putawayError ? (
                      <Banner text={putawayError} />
                    ) : filteredPutawayTasks.length ? (
                      <View style={styles.list}>
                        {filteredPutawayTasks.map((task) => (
                          <ListRow
                            key={task.id}
                            title={getProductTitle(task.productName, task.variantName, task.productVariantId)}
                            subtitle={`${task.toLocationName ?? task.toLocationCode ?? task.toLocationId ?? "-"} • ${task.quantity ?? 0} adet`}
                            caption={task.goodsReceiptId ? `Mal Kabul: ${task.goodsReceiptId}` : task.notes ?? "-"}
                            badgeLabel={getTaskStatusLabel(task.status)}
                            badgeTone={getTaskStatusTone(task.status)}
                            onPress={() => void loadPutawayDetail(task.id)}
                            icon={
                              <MaterialCommunityIcons
                                name="arrow-collapse-down"
                                size={20}
                                color={mobileTheme.colors.brand.primary}
                              />
                            }
                          />
                        ))}
                      </View>
                    ) : (
                      <EmptyState title="Yerleştirme görevi bulunamadı." subtitle="Seçili depo için görev yok." />
                    )}
                  </>
                )
              ) : null}

              {segment === "picking" && storeSelected ? (
                !warehouseSelected ? (
                  <EmptyStateWithAction
                    title="Depo seçimi gerekli."
                    subtitle="Toplama görevlerini görmek için bir depo seçin."
                    actionLabel="Depo Seç"
                    onAction={() => setWarehousePickerOpen(true)}
                  />
                ) : (
                  <>
                    <Card>
                      <SectionTitle title="Toplama Görevleri" />
                      <View style={styles.sectionGap}>
                        <FilterTabs
                          value={pickingStatusFilter}
                          options={[
                            { label: "Tümü", value: "ALL" },
                            { label: "Bekliyor", value: "PENDING" },
                            { label: "Üstlenildi", value: "IN_PROGRESS" },
                            { label: "Tamamlandı", value: "COMPLETED" },
                            { label: "Eksik", value: "SHORT_PICK" },
                            { label: "İptal", value: "CANCELLED" },
                          ]}
                          onChange={setPickingStatusFilter}
                        />
                      </View>
                    </Card>

                    {pickingLoading ? (
                      <View style={styles.loadingList}>
                        <SkeletonBlock height={84} />
                        <SkeletonBlock height={84} />
                      </View>
                    ) : pickingError ? (
                      <Banner text={pickingError} />
                    ) : filteredPickingTasks.length ? (
                      <View style={styles.list}>
                        {filteredPickingTasks.map((task) => (
                          <ListRow
                            key={task.id}
                            title={getProductTitle(task.productName, task.variantName, task.productVariantId)}
                            subtitle={`${task.fromLocationName ?? task.fromLocationCode ?? task.fromLocationId ?? "-"} • ${task.requestedQuantity ?? 0} adet`}
                            caption={task.waveCode ? `Wave: ${task.waveCode}` : task.saleId ? `Satış: ${task.saleId}` : "-"}
                            badgeLabel={getTaskStatusLabel(task.status)}
                            badgeTone={getTaskStatusTone(task.status)}
                            onPress={() => void loadPickingDetail(task.id)}
                            icon={
                              <MaterialCommunityIcons
                                name="arrow-collapse-up"
                                size={20}
                                color={mobileTheme.colors.brand.primary}
                              />
                            }
                          />
                        ))}
                      </View>
                    ) : (
                      <EmptyState title="Toplama görevi bulunamadı." subtitle="Seçili depo için görev yok." />
                    )}
                  </>
                )
              ) : null}
            </>
          )}
        </ScrollView>
      </View>

      <ModalSheet
        visible={storePickerOpen}
        title="Mağaza Seç"
        subtitle="Operasyon bağlamı için mağaza seçin."
        onClose={() => setStorePickerOpen(false)}
      >
        {storeOptions.length ? (
          <SelectionList
            items={storeOptions.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            selectedValue={selectedStoreId || null}
            onSelect={(value) => {
              setSelectedStoreId(value);
              setStorePickerOpen(false);
            }}
          />
        ) : (
          <EmptyState title="Mağaza bulunamadı." />
        )}
      </ModalSheet>

      <ModalSheet
        visible={warehousePickerOpen}
        title="Depo Seç"
        subtitle="Liste ve görev bağlamı için depo seçin."
        onClose={() => setWarehousePickerOpen(false)}
      >
        {warehousesLoading ? (
          <View style={styles.loadingList}>
            <SkeletonBlock height={64} />
            <SkeletonBlock height={64} />
          </View>
        ) : warehouses.length ? (
          <>
            {segment === "count" ? (
              <Button
                label="Tüm Depolar"
                onPress={() => {
                  setSelectedWarehouseId("");
                  setWarehousePickerOpen(false);
                }}
                variant={selectedWarehouseId ? "secondary" : "primary"}
                size="sm"
                fullWidth={false}
              />
            ) : null}
            <SelectionList
              items={warehouses.map((item) => ({
                value: item.id,
                label: item.name,
                description: item.address ?? undefined,
              }))}
              selectedValue={selectedWarehouseId || null}
              onSelect={(value) => {
                setSelectedWarehouseId(value);
                setWarehousePickerOpen(false);
              }}
            />
          </>
        ) : (
          <EmptyState title="Depo bulunamadı." subtitle="Seçili mağaza için aktif depo yok." />
        )}
      </ModalSheet>

      <ModalSheet
        visible={createSessionOpen}
        title="Yeni Sayım Oturumu"
        subtitle="Depo seçin ve not ekleyin."
        onClose={() => setCreateSessionOpen(false)}
      >
        <InlineFieldError text={createSessionError} />
        {warehouses.length ? (
          <SelectionList
            items={warehouses.map((item) => ({
              value: item.id,
              label: item.name,
              description: item.address ?? undefined,
            }))}
            selectedValue={createSessionWarehouseId || null}
            onSelect={setCreateSessionWarehouseId}
          />
        ) : (
          <EmptyState title="Depo bulunamadı." />
        )}
        <TextField
          label="Not"
          value={createSessionNotes}
          onChangeText={setCreateSessionNotes}
          multiline
          helperText="Opsiyonel. Sayım dönemi veya açıklama ekleyin."
        />
        <View style={styles.actionRow}>
          <Button label="Vazgeç" onPress={() => setCreateSessionOpen(false)} variant="ghost" />
          <Button
            label="Oturum Oluştur"
            onPress={() => void submitCreateSession()}
            loading={submittingKey === "create-session"}
          />
        </View>
      </ModalSheet>
    </>
  );
}
