import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppScreen, SegmentedControl, type SegmentItem } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { mobileTheme } from "@/src/theme";

const colors = mobileTheme.colors.dark;
const brand = mobileTheme.colors.brand;

type TasksSegment = "pending" | "warehouse" | "supply";

type TasksScreenProps = {
  isActive?: boolean;
};

export default function TasksScreen({ isActive = true }: TasksScreenProps) {
  const { can } = useAuth();
  const [segment, setSegment] = useState<TasksSegment>("pending");

  const canViewWarehouse = can("COUNT_SESSION_READ") || can("WAREHOUSE_READ");
  const canViewSupply = can("REPLENISHMENT_READ") || can("PO_READ");
  const canViewApprovals = can("APPROVAL_READ");

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
            subtitle="Onay, ikmal ve depo gorevleri burada listelenecek"
          />
        );
      case "warehouse":
        return (
          <PlaceholderView
            icon="warehouse"
            title="Depo islemleri"
            subtitle="Sayim, yerlestirme ve toplama gorevleri burada listelenecek"
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
    <AppScreen
      title="Gorevler"
      subtitle="Bekleyen is ve operasyonlar"
    >
      <SegmentedControl
        segments={segments}
        activeKey={segment}
        onChange={(key) => setSegment(key as TasksSegment)}
      />
      {renderContent()}
    </AppScreen>
  );
}

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
});
