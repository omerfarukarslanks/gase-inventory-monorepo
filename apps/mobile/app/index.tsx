import { Redirect } from "expo-router";
import { LoadingScreen } from "@/app/_layout";
import { useAuth } from "@/src/context/AuthContext";

export default function IndexPage() {
  const { status } = useAuth();

  if (status === "booting") {
    return <LoadingScreen label="Oturum kontrol ediliyor..." />;
  }

  if (status === "authenticated") {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
