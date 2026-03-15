import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SegmentedControl, type SegmentItem } from "@/src/components/ui";
import { mobileTheme } from "@/src/theme";

const colors = mobileTheme.colors.dark;
const brand = mobileTheme.colors.brand;

type TasksSegment = "pending" | "warehouse" | "supply";

type TasksScreenProps = {
  isActive?: boolean;
  canViewWarehouse: boolean;
  canViewSupply: boolean;
};

export default function TasksScreen({
  isActive = true,
  canViewWarehouse,
  canViewSupply,
}: TasksScreenProps) {
  const [segment, setSegment] = useState<TasksSegment>("pending");

  const segments = useMemo<SegmentItem[]>(() => {
    const items: SegmentItem[] = [{ key: "pending", label: "Bekleyen" }];
    if (canViewWarehouse) items.push({ key: "warehouse", label: "Depo" });
    if (canViewSupply) items.push({ key: "supply", label: "Tedarik" });
    return items;
  }, [canViewWarehouse, canViewSupply]);

  return (
    <View style={styles.container}>
      <View style={styles.segmentWrap}>
        <SegmentedControl
          segments={segments}
          activeKey={segment}
          onChange={(k) => setSegment(k as TasksSegment)}
        />
      </View>
      <PlaceholderView segment={segment} />
    </View>
  );
}

function PlaceholderView({ segment }: { segment: TasksSegment }) {
  const config = {
    pending: { icon: "clipboard-check-outline" as const, title: "Bekleyen gorevler" },
    warehouse: { icon: "warehouse" as const, title: "Depo islemleri" },
    supply: { icon: "truck-delivery-outline" as const, title: "Tedarik islemleri" },
  };
  const { icon, title } = config[segment];

  return (
    <View style={styles.placeholder}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={40} color={colors.muted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Bu bolum yakinda aktif olacak</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Yakinda</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  segmentWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  placeholder: {
    alignItems: "center", justifyContent: "center",
    paddingVertical: 60, gap: 12,
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: colors.surface2,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  title: { color: colors.text, fontSize: 17, fontWeight: "700" },
  subtitle: { color: colors.text2, fontSize: 13, textAlign: "center", maxWidth: 260, lineHeight: 19 },
  badge: {
    marginTop: 8, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999, backgroundColor: "rgba(16,185,129,0.12)",
  },
  badgeText: { color: brand.primary, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
});
