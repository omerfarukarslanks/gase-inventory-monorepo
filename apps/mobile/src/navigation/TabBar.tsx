import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { mobileTheme } from "@/src/theme";
import type { ShellScreenKey, ShellTab } from "./useShellNavigation";

type TabBarProps = {
  tabs: ShellTab[];
  activeTab: ShellScreenKey;
  onSelect: (key: ShellScreenKey) => void;
};

const styles = StyleSheet.create({
  navSafe: {
    backgroundColor: mobileTheme.colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.dark.border,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 16,
    minHeight: 52,
    paddingVertical: 10,
    backgroundColor: mobileTheme.colors.dark.surface,
  },
  navItemActive: {
    backgroundColor: mobileTheme.colors.brand.primary,
  },
  navItemPressed: {
    opacity: 0.75,
  },
  navLabel: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 11,
    fontWeight: "700",
  },
  navLabelActive: {
    color: mobileTheme.colors.dark.bg,
  },
  iconWrap: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
});

export function TabBar({ tabs, activeTab, onSelect }: TabBarProps) {
  return (
    <SafeAreaView edges={["bottom"]} style={styles.navSafe}>
      <View style={styles.navBar}>
        {tabs.map((item) => {
          const active = item.key === activeTab;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityHint={`${item.label} ekranini ac`}
              accessibilityState={{ selected: active }}
              hitSlop={4}
              onPress={() => onSelect(item.key)}
              style={({ pressed }) => [
                styles.navItem,
                active && styles.navItemActive,
                pressed && styles.navItemPressed,
              ]}
            >
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={20}
                  color={active ? mobileTheme.colors.dark.bg : mobileTheme.colors.dark.text2}
                />
                {item.badge != null && item.badge > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {item.badge > 99 ? "99+" : String(item.badge)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
