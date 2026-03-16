import { forgotPassword, resetPassword } from "@gase/core";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Banner, Button, Card, FilterTabs } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { mobileTheme } from "@/src/theme";
import { LoginForm } from "./auth/LoginForm";
import { SignupForm } from "./auth/SignupForm";
import { RecoveryForm } from "./auth/RecoveryForm";
import {
  validateLoginForm,
  validateSignupForm,
  validateRecoveryForm,
} from "./auth/validators";

type AuthMode = "login" | "signup" | "recovery";
type RecoveryMode = "request" | "reset";

const authModeOptions = [
  { label: "Giris", value: "login" as const },
  { label: "Kayit", value: "signup" as const },
  { label: "Sifre", value: "recovery" as const },
];

const recoveryOptions = [
  { label: "Link gonder", value: "request" as const },
  { label: "Sifre yenile", value: "reset" as const },
];

export default function LoginScreen() {
  const { configurationError, signIn, signUp } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [recoveryMode, setRecoveryMode] = useState<RecoveryMode>("request");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    tenantName: "",
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [recoveryForm, setRecoveryForm] = useState({
    email: "",
    token: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const normalizedLoginEmail = loginForm.email.trim().toLowerCase();
  const normalizedSignupEmail = signupForm.email.trim().toLowerCase();
  const normalizedRecoveryEmail = recoveryForm.email.trim().toLowerCase();

  const loginErrors = useMemo(
    () => validateLoginForm(loginForm, normalizedLoginEmail, submitAttempted),
    [loginForm, normalizedLoginEmail, submitAttempted],
  );
  const signupErrors = useMemo(
    () => validateSignupForm(signupForm, normalizedSignupEmail, submitAttempted),
    [signupForm, normalizedSignupEmail, submitAttempted],
  );
  const recoveryErrors = useMemo(
    () => validateRecoveryForm(recoveryForm, normalizedRecoveryEmail, recoveryMode, submitAttempted),
    [recoveryForm, normalizedRecoveryEmail, recoveryMode, submitAttempted],
  );

  const onModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    setSubmitAttempted(false);
    setError("");
    setSuccess("");
  };

  const onSubmit = async () => {
    setSubmitAttempted(true);
    setError("");
    setSuccess("");

    if (mode === "login") {
      if (loginErrors.email || loginErrors.password) return;
      setLoading(true);
      try {
        await signIn(normalizedLoginEmail, loginForm.password);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Giris basarisiz.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === "signup") {
      if (
        signupErrors.tenantName ||
        signupErrors.name ||
        signupErrors.surname ||
        signupErrors.email ||
        signupErrors.password ||
        signupErrors.confirmPassword
      ) {
        return;
      }
      setLoading(true);
      try {
        await signUp({
          tenantName: signupForm.tenantName.trim(),
          name: signupForm.name.trim(),
          surname: signupForm.surname.trim(),
          email: normalizedSignupEmail,
          password: signupForm.password,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kayit basarisiz.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (recoveryMode === "request") {
      if (recoveryErrors.email) return;
      setLoading(true);
      try {
        await forgotPassword(normalizedRecoveryEmail);
        setSuccess(
          "Sifre sifirlama talebi gonderildi. E-postadaki token ile yeni sifre belirleyebilirsin.",
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Talep gonderilemedi.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (
      recoveryErrors.email ||
      recoveryErrors.token ||
      recoveryErrors.password ||
      recoveryErrors.confirmPassword
    ) {
      return;
    }

    setLoading(true);
    try {
      await resetPassword(recoveryForm.token.trim(), recoveryForm.password);
      setSuccess("Sifre guncellendi. Yeni sifrenle giris yapabilirsin.");
      setMode("login");
      setRecoveryMode("request");
      setLoginForm((current) => ({
        ...current,
        email: recoveryForm.email.trim() || current.email,
      }));
      setRecoveryForm({ email: recoveryForm.email, token: "", password: "", confirmPassword: "" });
      setSubmitAttempted(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sifre guncellenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const headerCopy = useMemo(() => {
    if (mode === "signup") {
      return {
        title: "Tenant kaydi",
        subtitle:
          "Sirket, operator ve oturum bilgilerini tek akista olustur. Kayit basarili olunca oturum acilir.",
      };
    }
    if (mode === "recovery") {
      return {
        title: recoveryMode === "request" ? "Sifre kurtarma" : "Yeni sifre belirle",
        subtitle:
          recoveryMode === "request"
            ? "Hesabina sifirlama baglantisi gonder. Sonraki adimda token ile sifreni yenile."
            : "E-postadaki token ile yeni sifreni belirle ve tekrar oturum ac.",
      };
    }
    return {
      title: "Operator girisi",
      subtitle: "Satis, stok, urun ve musteri operasyonlari bu oturumla acilir.",
    };
  }, [mode, recoveryMode]);

  const submitLabel =
    mode === "login"
      ? "Giris yap"
      : mode === "signup"
        ? "Kayit ol ve giris yap"
        : recoveryMode === "request"
          ? "Sifirlama baglantisi gonder"
          : "Yeni sifreyi kaydet";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.brand}>StockPulse Mobile</Text>
          <Text style={styles.title}>{headerCopy.title}</Text>
          <Text style={styles.subtitle}>{headerCopy.subtitle}</Text>
        </View>

        <Card>
          <View style={styles.form}>
            <FilterTabs value={mode} options={authModeOptions} onChange={onModeChange} />

            {mode === "recovery" ? (
              <FilterTabs
                value={recoveryMode}
                options={recoveryOptions}
                onChange={(value) => {
                  setRecoveryMode(value);
                  setSubmitAttempted(false);
                  setError("");
                  setSuccess("");
                }}
              />
            ) : null}

            {configurationError ? <Banner text={configurationError} /> : null}
            {error ? <Banner text={error} /> : null}
            {success ? <Banner tone="info" text={success} /> : null}

            {mode === "login" ? (
              <LoginForm
                form={loginForm}
                errors={loginErrors}
                onChange={(field, value) => setLoginForm((current) => ({ ...current, [field]: value }))}
                onSubmit={() => void onSubmit()}
                onClearError={() => { if (error) setError(""); }}
              />
            ) : null}

            {mode === "signup" ? (
              <SignupForm
                form={signupForm}
                errors={signupErrors}
                onChange={(field, value) => setSignupForm((current) => ({ ...current, [field]: value }))}
                onSubmit={() => void onSubmit()}
                onClearError={() => { if (error) setError(""); }}
              />
            ) : null}

            {mode === "recovery" ? (
              <RecoveryForm
                form={recoveryForm}
                errors={recoveryErrors}
                recoveryMode={recoveryMode}
                onChange={(field, value) => setRecoveryForm((current) => ({ ...current, [field]: value }))}
                onSubmit={() => void onSubmit()}
                onSwitchToReset={() => {
                  setRecoveryMode("reset");
                  setSubmitAttempted(false);
                  setError("");
                  setSuccess("");
                }}
                onClearError={() => { if (error) setError(""); }}
              />
            ) : null}

            <Button
              label={submitLabel}
              onPress={() => void onSubmit()}
              loading={loading}
              disabled={Boolean(configurationError)}
            />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: mobileTheme.colors.dark.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 20,
  },
  hero: {
    gap: 8,
  },
  brand: {
    color: mobileTheme.colors.brand.primary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.2,
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
