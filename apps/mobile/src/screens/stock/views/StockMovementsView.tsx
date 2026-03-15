import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getInventoryMovements,
  type InventoryMovement,
  type InventoryMovementType,
} from "@gase/core";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Banner, Button, SkeletonBlock, TextField } from "@/src/components/ui";
import { mobileTheme } from "@/src/theme";
import { formatDate } from "@/src/lib/format";
import { useAuth } from "@/src/context/AuthContext";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";

const colors = mobileTheme.colors.dark;
const brand = mobileTheme.colors.brand;

// ─── Movement type config ──────────────────────────────────────────────────

const MOVEMENT_LABELS: Record<string, string> = {
  IN: "Giris",
  OUT: "Cikis",
  ADJUSTMENT: "Duzeltme",
  TRANSFER_IN: "Transfer +",
  TRANSFER_OUT: "Transfer -",
};

const MOVEMENT_COLORS: Record<string, string> = {
  IN: "#10B981",
  OUT: "#EF4444",
  ADJUSTMENT: "#F59E0B",
  TRANSFER_IN: "#3B82F6",
  TRANSFER_OUT: "#8B5CF6",
};

const MOVEMENT_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  IN: "arrow-down-circle-outline",
  OUT: "arrow-up-circle-outline",
  ADJUSTMENT: "pencil-circle-outline",
  TRANSFER_IN: "swap-horizontal",
  TRANSFER_OUT: "swap-horizontal",
};

const TYPE_FILTERS: { key: InventoryMovementType | ""; label: string }[] = [
  { key: "", label: "Tumu" },
  { key: "IN", label: "Giris" },
  { key: "OUT", label: "Cikis" },
  { key: "ADJUSTMENT", label: "Duzeltme" },
  { key: "TRANSFER_IN", label: "Transfer +" },
  { key: "TRANSFER_OUT", label: "Transfer -" },
];

// ─── Hook ──────────────────────────────────────────────────────────────────

function useStockMovements(isActive: boolean, storeIds: string[]) {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<InventoryMovementType | "">("");

  const debouncedSearch = useDebouncedValue(search, 400);
  const storeId = storeIds.length === 1 ? storeIds[0] : undefined;
  const LIMIT = 30;

  const fetchMovements = useCallback(
    async (nextOffset = 0, append = false) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);
      setError("");
      try {
        const res = await getInventoryMovements({
          storeId,
          type: typeFilter || undefined,
          search: debouncedSearch || undefined,
          limit: LIMIT,
          offset: nextOffset,
        });
        setMovements((prev) => (append ? [...prev, ...res.data] : res.data));
        setHasMore(res.meta.hasMore);
        setOffset(nextOffset + res.data.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Hareketler yuklenemedi.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [storeId, typeFilter, debouncedSearch],
  );

  useEffect(() => {
    if (!isActive) return;
    setOffset(0);
    void fetchMovements(0, false);
  }, [isActive, fetchMovements]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    void fetchMovements(offset, true);
  }, [loadingMore, hasMore, offset, fetchMovements]);

  const reload = useCallback(() => {
    setOffset(0);
    void fetchMovements(0, false);
  }, [fetchMovements]);

  return {
    movements,
    loading,
    loadingMore,
    error,
    hasMore,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    reload,
    loadMore,
  };
}

// ─── View ──────────────────────────────────────────────────────────────────

type StockMovementsViewProps = {
  isActive?: boolean;
};

export function StockMovementsView({ isActive = true }: StockMovementsViewProps) {
  const { storeIds } = useAuth();
  const {
    movements,
    loading,
    loadingMore,
    error,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    reload,
    loadMore,
  } = useStockMovements(isActive, storeIds);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <SkeletonBlock height={72} />
        <SkeletonBlock height={72} />
        <SkeletonBlock height={72} />
        <SkeletonBlock height={72} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingWrap}>
        <Banner text={error} />
        <Button label="Tekrar dene" onPress={reload} variant="secondary" size="sm" fullWidth={false} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <TextField
          label="Urun ara"
          value={search}
          onChangeText={setSearch}
          placeholder="Urun adi veya referans..."
        />
      </View>

      {/* Type filter chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={TYPE_FILTERS}
        keyExtractor={(item) => item.key}
        style={styles.chipList}
        contentContainerStyle={styles.chipContent}
        renderItem={({ item }) => {
          const active = typeFilter === item.key;
          return (
            <Pressable
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setTypeFilter(item.key)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* Movement list */}
      <FlatList
        data={movements}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="swap-horizontal" size={40} color={colors.muted} />
            <Text style={styles.emptyText}>Hareket bulunamadi</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 12 }}>
              <SkeletonBlock height={60} />
            </View>
          ) : null
        }
        renderItem={({ item }) => <MovementRow movement={item} />}
      />
    </View>
  );
}

// ─── Row ───────────────────────────────────────────────────────────────────

function MovementRow({ movement }: { movement: InventoryMovement }) {
  const type = movement.type as InventoryMovementType;
  const label = MOVEMENT_LABELS[type] ?? type;
  const color = MOVEMENT_COLORS[type] ?? colors.muted;
  const icon = MOVEMENT_ICONS[type] ?? "swap-horizontal";
  const isPositive = type === "IN" || type === "TRANSFER_IN";

  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: color + "22" }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>

      <View style={styles.rowBody}>
        <Text style={styles.rowProduct} numberOfLines={1}>
          {movement.productName ?? "Urun"}
          {movement.variantName ? ` — ${movement.variantName}` : ""}
        </Text>
        <View style={styles.rowMeta}>
          <Text style={styles.rowMetaText}>{label}</Text>
          {movement.storeName ? (
            <>
              <Text style={styles.rowDot}>·</Text>
              <Text style={styles.rowMetaText} numberOfLines={1}>{movement.storeName}</Text>
            </>
          ) : null}
          {movement.createdAt ? (
            <>
              <Text style={styles.rowDot}>·</Text>
              <Text style={styles.rowMetaText}>{formatDate(movement.createdAt)}</Text>
            </>
          ) : null}
        </View>
      </View>

      <Text style={[styles.rowQty, { color }]}>
        {isPositive ? "+" : "-"}{Math.abs(movement.quantity)}
      </Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: { gap: 12, paddingTop: 4 },
  searchWrap: { paddingBottom: 8 },
  chipList: { flexGrow: 0 },
  chipContent: { gap: 8, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: brand.primary + "22",
    borderColor: brand.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text2,
  },
  chipTextActive: { color: brand.primary },
  list: { flex: 1 },
  listContent: { gap: 2, paddingBottom: 40 },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: { color: colors.muted, fontSize: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, gap: 3 },
  rowProduct: { color: colors.text, fontSize: 14, fontWeight: "600" },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  rowMetaText: { color: colors.text2, fontSize: 11 },
  rowDot: { color: colors.muted, fontSize: 11 },
  rowQty: { fontSize: 15, fontWeight: "700", minWidth: 36, textAlign: "right" },
});
