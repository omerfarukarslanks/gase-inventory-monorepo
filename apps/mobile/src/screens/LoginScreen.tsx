import { forgotPassword, resetPassword } from "@gase/core";
import { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Banner,
  Button,
  Card,
  FilterTabs,
  SectionTitle,
  TextField,
} from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { mobileTheme } from "@/src/theme";

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
  const loginPasswordRef = useRef<TextInput>(null);
  const signupNameRef = useRef<TextInput>(null);
  const signupSurnameRef = useRef<TextInput>(null);
  const signupEmailRef = useRef<TextInput>(null);
  const signupPasswordRef = useRef<TextInput>(null);
  const signupConfirmRef = useRef<TextInput>(null);
  const recoveryTokenRef = useRef<TextInput>(null);
  const recoveryPasswordRef = useRef<TextInput>(null);
  const recoveryConfirmRef = useRef<TextInput>(null);

  const normalizedLoginEmail = loginForm.email.trim().toLowerCase();
  const normalizedSignupEmail = signupForm.email.trim().toLowerCase();
  const normalizedRecoveryEmail = recoveryForm.email.trim().toLowerCase();

  const loginErrors = useMemo(() => ({
    email: !submitAttempted && !loginForm.email.trim()
      ? ""
      : !loginForm.email.trim()
        ? "E-posta zorunlu."
        : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedLoginEmail)
          ? ""
          : "Gecerli bir e-posta girin.",
    password: !submitAttempted && !loginForm.password.trim()
      ? ""
      : !loginForm.password.trim()
        ? "Sifre zorunlu."
        : loginForm.password.trim().length >= 6
          ? ""
          : "Sifre en az 6 karakter olmali.",
  }), [loginForm.email, loginForm.password, normalizedLoginEmail, submitAttempted]);

  const signupErrors = useMemo(() => ({
    tenantName: !submitAttempted && !signupForm.tenantName.trim()
      ? ""
      : signupForm.tenantName.trim().length >= 2
        ? ""
        : "Sirket adi en az 2 karakter olmali.",
    name: !submitAttempted && !signupForm.name.trim()
      ? ""
      : signupForm.name.trim().length >= 2
        ? ""
        : "Ad en az 2 karakter olmali.",
    surname: !submitAttempted && !signupForm.surname.trim()
      ? ""
      : signupForm.surname.trim().length >= 2
        ? ""
        : "Soyad en az 2 karakter olmali.",
    email: !submitAttempted && !signupForm.email.trim()
      ? ""
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedSignupEmail)
        ? ""
        : "Gecerli bir e-posta girin.",
    password: !submitAttempted && !signupForm.password
      ? ""
      : /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(signupForm.password)
        ? ""
        : "Sifre en az 8 karakter, buyuk-kucuk harf ve rakam icermeli.",
    confirmPassword: !submitAttempted && !signupForm.confirmPassword
      ? ""
      : signupForm.password === signupForm.confirmPassword
        ? ""
        : "Sifreler eslesmiyor.",
  }), [normalizedSignupEmail, signupForm.confirmPassword, signupForm.email, signupForm.name, signupForm.password, signupForm.surname, signupForm.tenantName, submitAttempted]);

  const recoveryErrors = useMemo(() => ({
    email: !submitAttempted && !recoveryForm.email.trim()
      ? ""
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedRecoveryEmail)
        ? ""
        : "Gecerli bir e-posta girin.",
    token: recoveryMode !== "reset"
      ? ""
      : !submitAttempted && !recoveryForm.token.trim()
        ? ""
        : recoveryForm.token.trim()
          ? ""
          : "Token zorunlu.",
    password: recoveryMode !== "reset"
      ? ""
      : !submitAttempted && !recoveryForm.password
        ? ""
        : /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(recoveryForm.password)
          ? ""
          : "Yeni sifre en az 8 karakter, buyuk-kucuk harf ve rakam icermeli.",
    confirmPassword: recoveryMode !== "reset"
      ? ""
      : !submitAttempted && !recoveryForm.confirmPassword
        ? ""
        : recoveryForm.password === recoveryForm.confirmPassword
          ? ""
          : "Sifreler eslesmiyor.",
  }), [normalizedRecoveryEmail, recoveryForm.confirmPassword, recoveryForm.email, recoveryForm.password, recoveryForm.token, recoveryMode, submitAttempted]);

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
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Giris basarisiz.");
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
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Kayit basarisiz.");
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
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Talep gonderilemedi.");
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
      setLoginForm((current) => ({ ...current, email: recoveryForm.email.trim() || current.email }));
      setRecoveryForm({ email: recoveryForm.email, token: "", password: "", confirmPassword: "" });
      setSubmitAttempted(false);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Sifre guncellenemedi.");
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
              <>
                <TextField
                  label="E-posta"
                  value={loginForm.email}
                  onChangeText={(value) => {
                    setLoginForm((current) => ({ ...current, email: value }));
                    if (error) setError("");
                  }}
                  placeholder="ornek@firma.com"
                  keyboardType="email-address"
                  returnKeyType="next"
                  autoCapitalize="none"
                  textContentType="emailAddress"
                  inputMode="email"
                  helperText="Operator oturumu acmak icin kurum hesabini kullan."
                  errorText={loginErrors.email || undefined}
                  onSubmitEditing={() => loginPasswordRef.current?.focus()}
                  blurOnSubmit={false}
                />
                <TextField
                  label="Sifre"
                  value={loginForm.password}
                  onChangeText={(value) => {
                    setLoginForm((current) => ({ ...current, password: value }));
                    if (error) setError("");
                  }}
                  placeholder="Sifrenizi girin"
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={() => void onSubmit()}
                  autoCapitalize="none"
                  textContentType="password"
                  errorText={loginErrors.password || undefined}
                  inputRef={loginPasswordRef}
                />
              </>
            ) : null}

            {mode === "signup" ? (
              <>
                <TextField
                  label="Sirket adi"
                  value={signupForm.tenantName}
                  onChangeText={(value) => {
                    setSignupForm((current) => ({ ...current, tenantName: value }));
                    if (error) setError("");
                  }}
                  errorText={signupErrors.tenantName || undefined}
                  returnKeyType="next"
                  onSubmitEditing={() => signupNameRef.current?.focus()}
                  blurOnSubmit={false}
                />
                <TextField
                  label="Ad"
                  value={signupForm.name}
                  onChangeText={(value) => {
                    setSignupForm((current) => ({ ...current, name: value }));
                    if (error) setError("");
                  }}
                  inputRef={signupNameRef}
                  errorText={signupErrors.name || undefined}
                  returnKeyType="next"
                  onSubmitEditing={() => signupSurnameRef.current?.focus()}
                  blurOnSubmit={false}
                />
                <TextField
                  label="Soyad"
                  value={signupForm.surname}
                  onChangeText={(value) => {
                    setSignupForm((current) => ({ ...current, surname: value }));
                    if (error) setError("");
                  }}
                  inputRef={signupSurnameRef}
                  errorText={signupErrors.surname || undefined}
                  returnKeyType="next"
                  onSubmitEditing={() => signupEmailRef.current?.focus()}
                  blurOnSubmit={false}
                />
                <TextField
                  label="E-posta"
                  value={signupForm.email}
                  onChangeText={(value) => {
                    setSignupForm((current) => ({ ...current, email: value }));
                    if (error) setError("");
                  }}
                  inputRef={signupEmailRef}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textContentType="emailAddress"
                  inputMode="email"
                  errorText={signupErrors.email || undefined}
                  returnKeyType="next"
                  onSubmitEditing={() => signupPasswordRef.current?.focus()}
                  blurOnSubmit={false}
                />
                <TextField
                  label="Sifre"
                  value={signupForm.password}
                  onChangeText={(value) => {
                    setSignupForm((current) => ({ ...current, password: value }));
                    if (error) setError("");
                  }}
                  inputRef={signupPasswordRef}
                  secureTextEntry
                  textContentType="newPassword"
                  helperText="En az 8 karakter, buyuk-kucuk harf ve rakam kullan."
                  errorText={signupErrors.password || undefined}
                  returnKeyType="next"
                  onSubmitEditing={() => signupConfirmRef.current?.focus()}
                  blurOnSubmit={false}
                />
                <TextField
                  label="Sifre tekrari"
                  value={signupForm.confirmPassword}
                  onChangeText={(value) => {
                    setSignupForm((current) => ({ ...current, confirmPassword: value }));
                    if (error) setError("");
                  }}
                  inputRef={signupConfirmRef}
                  secureTextEntry
                  textContentType="password"
                  errorText={signupErrors.confirmPassword || undefined}
                  returnKeyType="done"
                  onSubmitEditing={() => void onSubmit()}
                />
              </>
            ) : null}

            {mode === "recovery" ? (
              <>
                <TextField
                  label="E-posta"
                  value={recoveryForm.email}
                  onChangeText={(value) => {
                    setRecoveryForm((current) => ({ ...current, email: value }));
                    if (error) setError("");
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textContentType="emailAddress"
                  inputMode="email"
                  errorText={recoveryErrors.email || undefined}
                  returnKeyType={recoveryMode === "reset" ? "next" : "done"}
                  onSubmitEditing={() => {
                    if (recoveryMode === "reset") {
                      recoveryTokenRef.current?.focus();
                      return;
                    }
                    void onSubmit();
                  }}
                  blurOnSubmit={false}
                />
                {recoveryMode === "reset" ? (
                  <>
                    <TextField
                      label="Token"
                      value={recoveryForm.token}
                      onChangeText={(value) => {
                        setRecoveryForm((current) => ({ ...current, token: value }));
                        if (error) setError("");
                      }}
                      inputRef={recoveryTokenRef}
                      autoCapitalize="none"
                      errorText={recoveryErrors.token || undefined}
                      helperText="E-postadaki sifirlama tokenini buraya yapistir."
                      returnKeyType="next"
                      onSubmitEditing={() => recoveryPasswordRef.current?.focus()}
                      blurOnSubmit={false}
                    />
                    <TextField
                      label="Yeni sifre"
                      value={recoveryForm.password}
                      onChangeText={(value) => {
                        setRecoveryForm((current) => ({ ...current, password: value }));
                        if (error) setError("");
                      }}
                      inputRef={recoveryPasswordRef}
                      secureTextEntry
                      textContentType="newPassword"
                      helperText="En az 8 karakter, buyuk-kucuk harf ve rakam kullan."
                      errorText={recoveryErrors.password || undefined}
                      returnKeyType="next"
                      onSubmitEditing={() => recoveryConfirmRef.current?.focus()}
                      blurOnSubmit={false}
                    />
                    <TextField
                      label="Yeni sifre tekrari"
                      value={recoveryForm.confirmPassword}
                      onChangeText={(value) => {
                        setRecoveryForm((current) => ({ ...current, confirmPassword: value }));
                        if (error) setError("");
                      }}
                      inputRef={recoveryConfirmRef}
                      secureTextEntry
                      textContentType="password"
                      errorText={recoveryErrors.confirmPassword || undefined}
                      returnKeyType="done"
                      onSubmitEditing={() => void onSubmit()}
                    />
                  </>
                ) : (
                  <Card>
                    <SectionTitle title="Akis" />
                    <Text style={styles.recoveryNote}>
                      E-posta adresine sifirlama tokeni gonderilir. Sonraki adimda token ile yeni
                      sifreni belirleyebilirsin.
                    </Text>
                    <Button
                      label="Token ile sifre belirle"
                      onPress={() => {
                        setRecoveryMode("reset");
                        setSubmitAttempted(false);
                        setError("");
                        setSuccess("");
                      }}
                      variant="secondary"
                    />
                  </Card>
                )}
              </>
            ) : null}

            <Button
              label={
                mode === "login"
                  ? "Giris yap"
                  : mode === "signup"
                    ? "Kayit ol ve giris yap"
                    : recoveryMode === "request"
                      ? "Sifirlama baglantisi gonder"
                      : "Yeni sifreyi kaydet"
              }
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
  recoveryNote: {
    marginTop: 12,
    marginBottom: 12,
    color: mobileTheme.colors.dark.text2,
    fontSize: 13,
    lineHeight: 19,
  },
});
