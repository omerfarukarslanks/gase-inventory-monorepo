import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect } from "expo-router";
import { Banner, Button, Card, TextField } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { mobileTheme } from "@/src/theme";

export default function LoginScreen() {
  const { configurationError, status, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (status === "authenticated") {
    return <Redirect href="/(tabs)" />;
  }

  const onSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      await signIn(email, password);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Giris basarisiz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <View style={styles.hero}>
        <Text style={styles.brand}>StockPulse Mobile</Text>
        <Text style={styles.title}>Operator girisi</Text>
        <Text style={styles.subtitle}>
          Dashboard, stok, satis ve musteri akislari bu oturumla acilacak.
        </Text>
      </View>

      <Card>
        <View style={styles.form}>
          {configurationError ? <Banner text={configurationError} /> : null}
          {error ? <Banner text={error} /> : null}
          <TextField
            label="E-posta"
            value={email}
            onChangeText={setEmail}
            placeholder="ornek@firma.com"
            keyboardType="email-address"
          />
          <TextField
            label="Sifre"
            value={password}
            onChangeText={setPassword}
            placeholder="Sifrenizi girin"
            secureTextEntry
          />
          <Button
            label="Giris yap"
            onPress={onSubmit}
            loading={loading}
            disabled={!email.trim() || !password.trim() || Boolean(configurationError)}
          />
        </View>
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 20,
    backgroundColor: mobileTheme.colors.dark.bg,
  },
  hero: {
    gap: 8,
  },
  brand: {
    color: mobileTheme.colors.brand.primary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    color: mobileTheme.colors.dark.text,
    fontSize: 32,
    fontWeight: "700",
  },
  subtitle: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: 14,
  },
});
