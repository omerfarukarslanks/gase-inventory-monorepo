import { StatusBar } from "expo-status-bar";
import { type JSX, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import LoginScreen from "@/src/screens/LoginScreen";
import DashboardScreen from "@/src/screens/DashboardScreen";
import ProductsScreen from "@/src/screens/ProductsScreen";
import StockScreen from "@/src/screens/StockScreen";
import SalesScreen from "@/src/screens/SalesScreen";
import CustomersScreen from "@/src/screens/CustomersScreen";
import { mobileTheme } from "@/src/theme";

type TabKey = "dashboard" | "products" | "stock" | "sales" | "customers";

const tabs: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "products", label: "Products" },
  { key: "stock", label: "Stock" },
  { key: "sales", label: "Sales" },
  { key: "customers", label: "Customers" },
];

const screens = {
  dashboard: DashboardScreen,
  products: ProductsScreen,
  stock: StockScreen,
  sales: SalesScreen,
  customers: CustomersScreen,
} satisfies Record<TabKey, () => JSX.Element>;

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const { status } = useAuth();
  const [tab, setTab] = useState<TabKey>("dashboard");

  useEffect(() => {
    if (status !== "authenticated") {
      setTab("dashboard");
    }
  }, [status]);

  if (status === "booting") {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingText}>Oturum kontrol ediliyor...</Text>
      </View>
    );
  }

  if (status !== "authenticated") {
    return <LoginScreen />;
  }

  const ActiveScreen = screens[tab];

  return (
    <View style={styles.appShell}>
      <View style={styles.content}>
        <ActiveScreen />
      </View>
      <View style={styles.tabBar}>
        {tabs.map((item) => {
          const active = item.key === tab;

          return (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              style={[styles.tabButton, active && styles.tabButtonActive]}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: mobileTheme.colors.dark.bg,
  },
  content: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.dark.bg,
  },
  loadingText: {
    color: mobileTheme.colors.dark.text,
    fontSize: 14,
  },
  tabBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.dark.border,
    backgroundColor: mobileTheme.colors.dark.surface,
  },
  tabButton: {
    flexGrow: 1,
    minWidth: "30%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: mobileTheme.colors.dark.surface2,
  },
  tabButtonActive: {
    backgroundColor: mobileTheme.colors.brand.primary,
  },
  tabLabel: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: mobileTheme.colors.dark.bg,
  },
});
