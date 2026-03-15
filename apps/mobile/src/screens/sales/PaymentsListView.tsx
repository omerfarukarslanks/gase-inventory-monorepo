import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { mobileTheme } from "@/src/theme";

const colors = mobileTheme.colors.dark;
const brand = mobileTheme.colors.brand;

type PaymentsListViewProps = {
  isActive?: boolean;
};

export function PaymentsListView({ isActive = true }: PaymentsListViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="cash-fast" size={40} color={colors.muted} />
        </View>
        <Text style={styles.title}>Tahsilatlar</Text>
        <Text style={styles.subtitle}>
          Bekleyen ve tamamlanan tahsilatlar burada listelenecek
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Yakinda</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
