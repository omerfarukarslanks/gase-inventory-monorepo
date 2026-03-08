import { Redirect, Tabs } from "expo-router";
import { LoadingScreen } from "@/app/_layout";
import { useAuth } from "@/src/context/AuthContext";
import { mobileTheme } from "@/src/theme";

export default function TabsLayout() {
  const { status } = useAuth();

  if (status === "booting") {
    return <LoadingScreen />;
  }

  if (status !== "authenticated") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: mobileTheme.colors.brand.primary,
        tabBarInactiveTintColor: mobileTheme.colors.dark.text2,
        tabBarStyle: {
          backgroundColor: mobileTheme.colors.dark.surface,
          borderTopColor: mobileTheme.colors.dark.border,
          height: 68,
          paddingBottom: 8,
          paddingTop: 8,
        },
        sceneStyle: {
          backgroundColor: mobileTheme.colors.dark.bg,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="products" options={{ title: "Products" }} />
      <Tabs.Screen name="stock" options={{ title: "Stock" }} />
      <Tabs.Screen name="sales" options={{ title: "Sales" }} />
      <Tabs.Screen name="customers" options={{ title: "Customers" }} />
    </Tabs>
  );
}
