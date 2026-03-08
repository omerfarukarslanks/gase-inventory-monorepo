import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Text, View } from "react-native";
import { AuthProvider } from "@/src/context/AuthContext";
import { mobileTheme } from "@/src/theme";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}

export function LoadingScreen({ label = "Yukleniyor..." }: { label?: string }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: mobileTheme.colors.dark.bg,
        gap: 12,
      }}
    >
      <ActivityIndicator color={mobileTheme.colors.brand.primary} />
      <Text style={{ color: mobileTheme.colors.dark.text }}>{label}</Text>
    </View>
  );
}
