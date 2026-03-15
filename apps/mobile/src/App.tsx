import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/src/context/AuthContext";
import { AppShell } from "@/src/navigation/AppShell";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar barStyle="light-content" />
        <AppShell />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
