import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { mobileTheme } from "@/src/theme";
import type { ShellScreenKey, ShellTab } from "./useShellNavigation";

type TabBarProps = {
  tabs: ShellTab[];
  activeTab: ShellScreenKey;
  onSelect: (key: ShellScreenKey) => void;
  onCloseProfile: () => void;
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
});

export function TabBar({ tabs, activeTab, onSelect, onCloseProfile }: TabBarProps) {
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
              onPress={() => {
                onCloseProfile();
                onSelect(item.key);
              }}
              style={({ pressed }) => [
                styles.navItem,
                active && styles.navItemActive,
                pressed && styles.navItemPressed,
              ]}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={20}
                color={active ? mobileTheme.colors.dark.bg : mobileTheme.colors.dark.text2}
              />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
