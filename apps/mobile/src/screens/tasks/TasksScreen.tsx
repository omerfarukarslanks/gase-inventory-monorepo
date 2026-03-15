import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  acceptReplenishmentSuggestion,
  dismissReplenishmentSuggestion,
  getCountSessions,
  getPickingTasks,
  getPurchaseOrder,
  getPurchaseOrders,
  getPutawayTasks,
  getReplenishmentSuggestions,
  getWarehouses,
  type CountSession,
  type PickingTask,
  type PurchaseOrder,
  type PutawayTask,
  type ReplenishmentSuggestion,
  type Warehouse,
} from "@gase/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  AppScreen,
  Banner,
  Button,
  Card,
  ScreenHeader,
  SegmentedControl,
  SkeletonBlock,
  type SegmentItem,
} from "@/src/components/ui";
import { mobileTheme } from "@/src/theme";
import { GoodsReceiptSheet } from "./views/GoodsReceiptSheet";

const colors = mobileTheme.colors.dark;
const brand = mobileTheme.colors.brand;

type TasksSegment = "pending" | "warehouse" | "supply";

type TasksScreenProps = {
  isActive?: boolean;
  canViewWarehouse: boolean;
  canViewSupply: boolean;
  onNavigateToWarehouse?: () => void;
};

// ─── Warehouse summary state ───────────────────────────────────────────────

type WarehouseSummary = {
  warehouses: Warehouse[];
  countSessions: CountSession[];
  putawayTasks: PutawayTask[];
  pickingTasks: PickingTask[];
};

function useWarehouseSummary(isActive: boolean) {
  const [data, setData] = useState<WarehouseSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [warehouses, countSessions] = await Promise.all([
        getWarehouses(),
        getCountSessions(),
      ]);
      const firstWarehouseId = warehouses[0]?.id;
      const [putawayTasks, pickingTasks] = firstWarehouseId
        ? await Promise.all([
            getPutawayTasks({ warehouseId: firstWarehouseId }),
            getPickingTasks({ warehouseId: firstWarehouseId }),
          ])
        : [[], []];
      setData({ warehouses, countSessions, putawayTasks, pickingTasks });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Depo verileri yuklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    void load();
  }, [isActive, load]);

  return { data, loading, error, reload: load };
}

// ─── Supply summary state ──────────────────────────────────────────────────

type SupplySummary = {
  suggestions: ReplenishmentSuggestion[];
  purchaseOrders: PurchaseOrder[];
};

function useSupplySummary(isActive: boolean) {
  const [data, setData] = useState<SupplySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [suggestionsRes, ordersRes] = await Promise.all([
        getReplenishmentSuggestions({ status: "PENDING", limit: 20 }),
        getPurchaseOrders({ limit: 20 }),
      ]);
      setData({
        suggestions: suggestionsRes.data ?? [],
        purchaseOrders: (ordersRes.data ?? []).filter(
          (po) => po.status === "DRAFT" || po.status === "APPROVED" || po.status === "PARTIALLY_RECEIVED",
        ),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tedarik verileri yuklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    void load();
  }, [isActive, load]);

  return { data, loading, error, reload: load };
}

// ─── Main Screen ───────────────────────────────────────────────────────────

export default function TasksScreen({
  isActive = true,
  canViewWarehouse,
  canViewSupply,
  onNavigateToWarehouse,
}: TasksScreenProps) {
  const [segment, setSegment] = useState<TasksSegment>("pending");
  const warehouse = useWarehouseSummary(isActive && segment === "warehouse");
  const supply = useSupplySummary(isActive && segment === "supply");

  // Goods receipt sheet state
  const [receiptPo, setReceiptPo] = useState<PurchaseOrder | null>(null);
  const [receiptSheetOpen, setReceiptSheetOpen] = useState(false);

  const openReceiptSheet = useCallback(async (po: PurchaseOrder) => {
    try {
      const full = po.lines?.length ? po : await getPurchaseOrder(po.id);
      setReceiptPo(full);
    } catch {
      setReceiptPo(po);
    }
    setReceiptSheetOpen(true);
  }, []);

  const segments = useMemo<SegmentItem[]>(() => {
    const items: SegmentItem[] = [{ key: "pending", label: "Bekleyen" }];
    if (canViewWarehouse) items.push({ key: "warehouse", label: "Depo" });
    if (canViewSupply) items.push({ key: "supply", label: "Tedarik" });
    return items;
  }, [canViewWarehouse, canViewSupply]);

  const renderContent = () => {
    switch (segment) {
      case "pending":
        return (
          <PlaceholderView
            icon="clipboard-check-outline"
            title="Bekleyen gorevler"
            subtitle="Onay ve ikmal gorevleri yakin zamanda burada gorunecek"
          />
        );
      case "warehouse":
        return (
          <WarehouseSummaryView
            data={warehouse.data}
            loading={warehouse.loading}
            error={warehouse.error}
            onReload={() => void warehouse.reload()}
            onNavigateToWarehouse={onNavigateToWarehouse}
          />
        );
      case "supply":
        return (
          <SupplySummaryView
            data={supply.data}
            loading={supply.loading}
            error={supply.error}
            onReload={() => void supply.reload()}
            onOpenReceiptSheet={openReceiptSheet}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AppScreen title="Gorevler" subtitle="Bekleyen is ve operasyonlar">
      <SegmentedControl
        segments={segments}
        activeKey={segment}
        onChange={(key) => setSegment(key as TasksSegment)}
      />
      {renderContent()}

      <GoodsReceiptSheet
        visible={receiptSheetOpen}
        purchaseOrder={receiptPo}
        onClose={() => setReceiptSheetOpen(false)}
        onSuccess={() => {
          setReceiptSheetOpen(false);
          void supply.reload();
        }}
      />
    </AppScreen>
  );
}

// ─── Warehouse Summary View ────────────────────────────────────────────────

type WarehouseSummaryViewProps = {
  data: WarehouseSummary | null;
  loading: boolean;
  error: string;
  onReload: () => void;
  onNavigateToWarehouse?: () => void;
};

function WarehouseSummaryView({
  data,
  loading,
  error,
  onReload,
  onNavigateToWarehouse,
}: WarehouseSummaryViewProps) {
  if (loading) {
    return (
      <View style={styles.summaryLoading}>
        <SkeletonBlock height={88} />
        <SkeletonBlock height={88} />
        <SkeletonBlock height={88} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.summaryLoading}>
        <Banner text={error} />
        <Button label="Tekrar dene" onPress={onReload} variant="secondary" size="sm" fullWidth={false} />
      </View>
    );
  }
  if (!data) return null;

  const openCountSessions = data.countSessions.filter(
    (s) => s.status === "OPEN" || s.status === "IN_PROGRESS",
  ).length;
  const pendingPutaway = data.putawayTasks.filter(
    (t) => t.status === "PENDING" || t.status === "IN_PROGRESS",
  ).length;
  const pendingPicking = data.pickingTasks.filter(
    (t) => t.status === "PENDING" || t.status === "IN_PROGRESS",
  ).length;

  return (
    <ScrollView style={styles.summaryScroll} contentContainerStyle={styles.summaryContent} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Depo durumu"
        subtitle={`${data.warehouses.length} depo`}
        action={<Button label="Yenile" onPress={onReload} variant="secondary" size="sm" fullWidth={false} />}
      />
      <View style={styles.statsRow}>
        <StatCard icon="clipboard-list-outline" label="Sayim oturumu" count={openCountSessions} total={data.countSessions.length} color="#F59E0B" />
        <StatCard icon="inbox-arrow-down-outline" label="Yerlestirme" count={pendingPutaway} total={data.putawayTasks.length} color="#3B82F6" />
        <StatCard icon="cart-arrow-up" label="Toplama" count={pendingPicking} total={data.pickingTasks.length} color="#8B5CF6" />
      </View>
      {openCountSessions > 0 && (
        <Card>
          <Text style={styles.cardTitle}>Aktif sayim oturumlari</Text>
          {data.countSessions
            .filter((s) => s.status === "OPEN" || s.status === "IN_PROGRESS")
            .slice(0, 5)
            .map((session) => (
              <View key={session.id} style={styles.sessionRow}>
                <View style={styles.sessionDot} />
                <Text style={styles.sessionName}>{session.warehouseName ?? "Depo"}</Text>
                <StatusBadge status={session.status ?? ""} />
              </View>
            ))}
        </Card>
      )}
      {onNavigateToWarehouse && (
        <TouchableOpacity style={styles.detailButton} onPress={onNavigateToWarehouse}>
          <MaterialCommunityIcons name="warehouse" size={18} color={brand.primary} />
          <Text style={styles.detailButtonText}>Tam depo ekranina git</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={brand.primary} />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  count,
  total,
  color,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <Text style={styles.statCount}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statTotal}>/ {total} toplam</Text>
    </View>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Acik", IN_PROGRESS: "Devam ediyor", CLOSED: "Kapali",
  PENDING: "Bekliyor", COMPLETED: "Tamamlandi", CANCELLED: "Iptal",
};
const STATUS_COLORS: Record<string, string> = {
  OPEN: "#10B981", IN_PROGRESS: "#F59E0B", CLOSED: colors.muted,
  PENDING: "#3B82F6", COMPLETED: "#10B981", CANCELLED: colors.muted,
};

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status;
  const color = STATUS_COLORS[status] ?? colors.muted;
  return (
    <View style={[styles.statusBadge, { borderColor: color }]}>
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Supply Summary View ───────────────────────────────────────────────────

type SupplySummaryViewProps = {
  data: SupplySummary | null;
  loading: boolean;
  error: string;
  onReload: () => void;
  onOpenReceiptSheet: (po: PurchaseOrder) => Promise<void>;
};

const PO_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Taslak", APPROVED: "Onaylandi",
  PARTIALLY_RECEIVED: "Kismen Alindi", RECEIVED: "Teslim Alindi", CANCELLED: "Iptal",
};
const PO_STATUS_COLORS: Record<string, string> = {
  DRAFT: "#F59E0B", APPROVED: "#10B981",
  PARTIALLY_RECEIVED: "#3B82F6", RECEIVED: "#10B981", CANCELLED: colors.muted,
};

function SupplySummaryView({ data, loading, error, onReload, onOpenReceiptSheet }: SupplySummaryViewProps) {
  const [actionLoading, setActionLoading] = useState<Record<string, "accept" | "dismiss" | null>>({});
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const handleAccept = async (suggestionId: string) => {
    setActionLoading((prev) => ({ ...prev, [suggestionId]: "accept" }));
    try {
      await acceptReplenishmentSuggestion(suggestionId);
      setDismissed((prev) => new Set(prev).add(suggestionId));
    } catch {
      // Keep row — silent fail; user can refresh
    } finally {
      setActionLoading((prev) => ({ ...prev, [suggestionId]: null }));
    }
  };

  const handleDismiss = async (suggestionId: string) => {
    setActionLoading((prev) => ({ ...prev, [suggestionId]: "dismiss" }));
    try {
      await dismissReplenishmentSuggestion(suggestionId, "");
      setDismissed((prev) => new Set(prev).add(suggestionId));
    } catch {
      // Silent fail
    } finally {
      setActionLoading((prev) => ({ ...prev, [suggestionId]: null }));
    }
  };

  if (loading) {
    return (
      <View style={styles.summaryLoading}>
        <SkeletonBlock height={88} />
        <SkeletonBlock height={120} />
        <SkeletonBlock height={120} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.summaryLoading}>
        <Banner text={error} />
        <Button label="Tekrar dene" onPress={onReload} variant="secondary" size="sm" fullWidth={false} />
      </View>
    );
  }
  if (!data) return null;

  const displayedSuggestions = data.suggestions.filter((s) => !dismissed.has(s.id));
  const pendingCount = displayedSuggestions.length;
  const activePoCount = data.purchaseOrders.length;

  return (
    <ScrollView style={styles.summaryScroll} contentContainerStyle={styles.summaryContent} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Tedarik durumu"
        subtitle={`${pendingCount} ikmal oneri, ${activePoCount} aktif siparis`}
        action={<Button label="Yenile" onPress={onReload} variant="secondary" size="sm" fullWidth={false} />}
      />

      <View style={styles.statsRow}>
        <StatCard icon="alert-circle-outline" label="Bekleyen ikmal" count={pendingCount} total={pendingCount} color="#F59E0B" />
        <StatCard icon="file-document-outline" label="Aktif siparis" count={activePoCount} total={activePoCount} color="#3B82F6" />
      </View>

      {pendingCount > 0 && (
        <Card>
          <Text style={styles.cardTitle}>Bekleyen ikmal onerileri</Text>
          {displayedSuggestions.slice(0, 8).map((s) => {
            const isAct = actionLoading[s.id];
            return (
              <View key={s.id} style={styles.suggestionRow}>
                <View style={[styles.sessionDot, { backgroundColor: "#F59E0B" }]} />
                <View style={styles.suggestionBody}>
                  <Text style={styles.sessionName} numberOfLines={1}>
                    {s.rule?.productName ?? "Urun"}
                    {s.rule?.variantName ? ` — ${s.rule.variantName}` : ""}
                  </Text>
                  <Text style={styles.statTotal}>
                    Mevcut: {s.currentQuantity} → Hedef: {s.rule?.targetStock ?? s.suggestedQuantity}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { borderColor: "#F59E0B" }]}>
                  <Text style={[styles.statusText, { color: "#F59E0B" }]}>+{s.suggestedQuantity}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#10B98122" }]}
                  onPress={() => void handleAccept(s.id)}
                  disabled={Boolean(isAct)}
                >
                  <MaterialCommunityIcons name={isAct === "accept" ? "loading" : "check"} size={14} color="#10B981" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#EF444422" }]}
                  onPress={() => void handleDismiss(s.id)}
                  disabled={Boolean(isAct)}
                >
                  <MaterialCommunityIcons name={isAct === "dismiss" ? "loading" : "close"} size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            );
          })}
          {pendingCount > 8 && (
            <Text style={[styles.statTotal, { textAlign: "center", paddingTop: 8 }]}>+{pendingCount - 8} daha</Text>
          )}
        </Card>
      )}

      {activePoCount > 0 && (
        <Card>
          <Text style={styles.cardTitle}>Aktif satin alma siparisleri</Text>
          {data.purchaseOrders.slice(0, 5).map((po) => {
            const statusColor = PO_STATUS_COLORS[po.status] ?? colors.muted;
            const canReceive = po.status === "APPROVED" || po.status === "PARTIALLY_RECEIVED";
            return (
              <View key={po.id} style={styles.sessionRow}>
                <View style={[styles.sessionDot, { backgroundColor: statusColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionName} numberOfLines={1}>{po.supplierName ?? "Tedarikci"}</Text>
                  <Text style={styles.statTotal}>
                    {po.lines?.length ?? 0} kalem{po.expectedAt ? ` · ${po.expectedAt.slice(0, 10)}` : ""}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { borderColor: statusColor }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>{PO_STATUS_LABELS[po.status] ?? po.status}</Text>
                </View>
                {canReceive && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: brand.primary + "22", marginLeft: 4 }]}
                    onPress={() => void onOpenReceiptSheet(po)}
                  >
                    <MaterialCommunityIcons name="inbox-arrow-down" size={14} color={brand.primary} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          {activePoCount > 5 && (
            <Text style={[styles.statTotal, { textAlign: "center", paddingTop: 8 }]}>+{activePoCount - 5} daha</Text>
          )}
        </Card>
      )}

      {pendingCount === 0 && activePoCount === 0 && (
        <View style={styles.placeholder}>
          <View style={styles.placeholderIcon}>
            <MaterialCommunityIcons name="truck-check-outline" size={40} color={colors.muted} />
          </View>
          <Text style={styles.placeholderTitle}>Bekleyen islem yok</Text>
          <Text style={styles.placeholderSubtitle}>Tum ikmal onerileri ve satin alma siparisleri tamamlandi.</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Placeholder ───────────────────────────────────────────────────────────

function PlaceholderView({
  icon,
  title,
  subtitle,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.placeholder}>
      <View style={styles.placeholderIcon}>
        <MaterialCommunityIcons name={icon} size={40} color={colors.muted} />
      </View>
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderSubtitle}>{subtitle}</Text>
      <View style={styles.comingSoon}>
        <Text style={styles.comingSoonText}>Yakinda</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  placeholderIcon: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: colors.surface2,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  placeholderTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  placeholderSubtitle: { color: colors.text2, fontSize: 13, textAlign: "center", maxWidth: 260, lineHeight: 19 },
  comingSoon: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(16,185,129,0.12)" },
  comingSoonText: { color: brand.primary, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  summaryLoading: { gap: 12, paddingTop: 4 },
  summaryScroll: { flex: 1 },
  summaryContent: { gap: 16, paddingBottom: 120 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 12, borderTopWidth: 3,
    padding: 12, gap: 4, alignItems: "flex-start",
  },
  statCount: { color: colors.text, fontSize: 26, fontWeight: "800", marginTop: 6 },
  statLabel: { color: colors.text2, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  statTotal: { color: colors.muted, fontSize: 11 },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: "700", marginBottom: 12 },
  sessionRow: {
    flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  suggestionRow: {
    flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  suggestionBody: { flex: 1 },
  sessionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" },
  sessionName: { flex: 1, color: colors.text, fontSize: 14 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: "600" },
  actionBtn: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  detailButton: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.surface, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: brand.primary + "44",
  },
  detailButtonText: { flex: 1, color: brand.primary, fontSize: 14, fontWeight: "600" },
});
