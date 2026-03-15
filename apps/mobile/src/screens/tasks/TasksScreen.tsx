import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getCountSessions,
  getPickingTasks,
  getPutawayTasks,
  getWarehouses,
  type CountSession,
  type PickingTask,
  type PutawayTask,
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

      // Load putaway + picking tasks for first warehouse if any
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

// ─── Main Screen ───────────────────────────────────────────────────────────

export default function TasksScreen({
  isActive = true,
  canViewWarehouse,
  canViewSupply,
  onNavigateToWarehouse,
}: TasksScreenProps) {
  const [segment, setSegment] = useState<TasksSegment>("pending");
  const warehouse = useWarehouseSummary(isActive && segment === "warehouse");

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
          <PlaceholderView
            icon="truck-delivery-outline"
            title="Tedarik islemleri"
            subtitle="Ikmal onerileri, satin alma siparisleri ve mal kabul burada listelenecek"
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
    <ScrollView
      style={styles.summaryScroll}
      contentContainerStyle={styles.summaryContent}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Depo durumu"
        subtitle={`${data.warehouses.length} depo`}
        action={
          <Button
            label="Yenile"
            onPress={onReload}
            variant="secondary"
            size="sm"
            fullWidth={false}
          />
        }
      />

      {/* Summary stat cards */}
      <View style={styles.statsRow}>
        <StatCard
          icon="clipboard-list-outline"
          label="Sayim oturumu"
          count={openCountSessions}
          total={data.countSessions.length}
          color="#F59E0B"
        />
        <StatCard
          icon="inbox-arrow-down-outline"
          label="Yerlestirme"
          count={pendingPutaway}
          total={data.putawayTasks.length}
          color="#3B82F6"
        />
        <StatCard
          icon="cart-arrow-up"
          label="Toplama"
          count={pendingPicking}
          total={data.pickingTasks.length}
          color="#8B5CF6"
        />
      </View>

      {/* Active count sessions */}
      {openCountSessions > 0 && (
        <Card>
          <Text style={styles.cardTitle}>Aktif sayim oturumlari</Text>
          {data.countSessions
            .filter((s) => s.status === "OPEN" || s.status === "IN_PROGRESS")
            .slice(0, 5)
            .map((session) => (
              <View key={session.id} style={styles.sessionRow}>
                <View style={styles.sessionDot} />
                <Text style={styles.sessionName}>
                  {session.warehouseName ?? "Depo"}
                </Text>
                <StatusBadge status={session.status ?? ""} />
              </View>
            ))}
        </Card>
      )}

      {/* Navigate to full warehouse screen */}
      {onNavigateToWarehouse && (
        <TouchableOpacity style={styles.detailButton} onPress={onNavigateToWarehouse}>
          <MaterialCommunityIcons name="warehouse" size={18} color={brand.primary} />
          <Text style={styles.detailButtonText}>Tam depo ekranina git</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={brand.primary}
          />
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
  OPEN: "Acik",
  IN_PROGRESS: "Devam ediyor",
  CLOSED: "Kapali",
  PENDING: "Bekliyor",
  COMPLETED: "Tamamlandi",
  CANCELLED: "Iptal",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#10B981",
  IN_PROGRESS: "#F59E0B",
  CLOSED: colors.muted,
  PENDING: "#3B82F6",
  COMPLETED: "#10B981",
  CANCELLED: colors.muted,
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
  // Placeholder
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  placeholderIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  placeholderTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  placeholderSubtitle: {
    color: colors.text2,
    fontSize: 13,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 19,
  },
  comingSoon: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(16,185,129,0.12)",
  },
  comingSoonText: {
    color: brand.primary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Warehouse summary
  summaryLoading: { gap: 12, paddingTop: 4 },
  summaryScroll: { flex: 1 },
  summaryContent: { gap: 16, paddingBottom: 120 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderTopWidth: 3,
    padding: 12,
    gap: 4,
    alignItems: "flex-start",
  },
  statCount: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    marginTop: 6,
  },
  statLabel: {
    color: colors.text2,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statTotal: {
    color: colors.muted,
    fontSize: 11,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  sessionName: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: brand.primary + "44",
  },
  detailButtonText: {
    flex: 1,
    color: brand.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});
