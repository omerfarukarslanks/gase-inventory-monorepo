import { Redirect, Stack } from "expo-router";
import { LoadingScreen } from "@/app/_layout";
import { useAuth } from "@/src/context/AuthContext";

export default function AuthLayout() {
  const { status } = useAuth();

  if (status === "booting") {
    return <LoadingScreen label="Oturum yukleniyor..." />;
  }

  if (status === "authenticated") {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
