"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AuthTabs from "./AuthTabs";
import PasswordStrength from "./PasswordStrength";
import { BuildIcon, CheckIcon, EmailIcon, LockIcon, UserIcon } from "../auth/icon";
import InputField from "../ui/InputField";
import SocialButton from "../ui/SocialButton";
import Logo from "../ui/Logo";
import { login, signup } from "@/app/auth/auth";
import { ApiError } from "@/lib/api";
import Button from "../ui/Button";

type Mode = "login" | "signup";

type Props = {
  initialMode: Mode;
};

export default function AuthCard({ initialMode }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const mode: Mode = useMemo(() => (pathname?.includes("/signup") ? "signup" : "login"), [pathname]);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    tenantName: "",
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // initial route safety
  useEffect(() => {
    if (initialMode === "signup" && !pathname?.includes("/signup")) router.replace("/auth/signup");
    if (initialMode === "login" && pathname?.includes("/signup")) router.replace("/auth/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reset on mode change (route change)
  useEffect(() => {
    setStep(1);
    setErrors({});
    setSuccessMsg("");
    setErrorMsg("");
    setAgreed(false);
    setRemember(false);
    setForm({ tenantName: "", name: "", surname: "", email: "", password: "", confirmPassword: "" });
  }, [mode]);

  const set = (k: keyof typeof form, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};

    if (mode === "signup" && step === 1) {
      if (!form.tenantName.trim()) e.tenantName = "Firma adı zorunludur";
      if (!form.name.trim()) e.name = "Ad zorunludur";
      if (!form.surname.trim()) e.surname = "Soyad zorunludur";
    }

    if (mode === "login" || (mode === "signup" && step === 2)) {
      if (!form.email.trim()) e.email = "E-posta zorunludur";
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Geçerli bir e-posta girin";

      if (!form.password) e.password = "Şifre zorunludur";
      else if (form.password.length < 8) e.password = "En az 8 karakter";

      if (mode === "signup") {
        if (form.password !== form.confirmPassword) e.confirmPassword = "Şifreler eşleşmiyor";
        if (!agreed) e.terms = "Koşulları kabul edin";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;

    if (mode === "signup" && step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      if (mode === "login") {
        const response = await login(form.email, form.password);
        localStorage.setItem("token", response.access_token);
        localStorage.setItem("user", JSON.stringify(response.user));
        setSuccessMsg("Giriş başarılı!");
        setTimeout(() => router.push("/dashboard"), 800);
      } else {
        // signup mock — henüz endpoint yok
        const body = {
          tenantName: form.tenantName,
          name: form.name,
          surname: form.surname,
          email: form.email,
          password: form.password,
        };
        const response = await signup(body);
        localStorage.setItem("token", response.access_token);
        localStorage.setItem("user", JSON.stringify(response.user));
        await new Promise((r) => setTimeout(r, 1500));
        setSuccessMsg("Hesap oluşturuldu!");
        setTimeout(() => {
          router.push("/auth/login");
          setSuccessMsg("");
        }, 1200);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Mobile Logo - only visible on mobile */}
      <div className="mb-8 flex justify-center lg:hidden">
        <Logo />
      </div>

      <AuthTabs />

      {successMsg && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3.5 py-3 text-[12.5px] font-medium text-primary animate-si">
          <div className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
            <CheckIcon />
          </div>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-3 text-[12.5px] font-medium text-red-600 dark:text-red-400 animate-si">
          <div className="h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          {errorMsg}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-[22px] font-bold tracking-tight text-text">
          {mode === "login" ? "Tekrar hoş geldiniz" : step === 1 ? "Firma bilgileri" : "Hesap oluşturun"}
        </h2>
        <p className="mt-1 text-[13.5px] text-muted">
          {mode === "login"
            ? "Hesabınıza giriş yaparak devam edin"
            : step === 1
            ? "Tenant (firma) bilgilerinizi girin"
            : "E-posta ve şifre bilgilerinizi belirleyin"}
        </p>
      </div>

      {/* Signup step indicator */}
      {mode === "signup" && (
        <div className="mb-6 flex items-center gap-2">
          {[1, 2].map((st) => (
            <div key={st} className="flex items-center gap-2">
              <div
                className={[
                  "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold transition",
                  step >= st ? "bg-primary text-white" : "bg-surface2 text-muted border border-border",
                ].join(" ")}
              >
                {step > st ? <CheckIcon /> : st}
              </div>
              <span className={`text-[11.5px] font-medium ${step >= st ? "text-text" : "text-muted"}`}>
                {st === 1 ? "Firma" : "Hesap"}
              </span>
              {st === 1 && <div className={`mx-1 h-0.5 w-8 rounded ${step >= 2 ? "bg-primary" : "bg-border"} transition`} />}
            </div>
          ))}
        </div>
      )}

      {/* Forms */}
      {mode === "signup" && step === 1 && (
        <div className="animate-si">
          <InputField
            label="Firma (Tenant) Adı"
            type="text"
            placeholder="Örn: ABC Market A.Ş."
            icon={BuildIcon}
            value={form.tenantName}
            onChange={(v) => set("tenantName", v)}
            error={errors.tenantName}
          />
          <InputField
            label="Ad"
            type="text"
            placeholder="Adınız"
            icon={UserIcon}
            value={form.name}
            onChange={(v) => set("name", v)}
            error={errors.name}
          />
          <InputField
            label="Soyad"
            type="text"
            placeholder="Soyadınız"
            icon={UserIcon}
            value={form.surname}
            onChange={(v) => set("surname", v)}
            error={errors.surname}
          />
        </div>
      )}

      {(mode === "login" || (mode === "signup" && step === 2)) && (
        <div className="animate-si">
          <InputField
            label="E-posta Adresi"
            type="email"
            placeholder="ornek@firma.com"
            icon={EmailIcon}
            value={form.email}
            onChange={(v) => set("email", v)}
            error={errors.email}
          />
          <InputField
            label="Şifre"
            type="password"
            placeholder={mode === "login" ? "Şifrenizi girin" : "En az 8 karakter"}
            icon={LockIcon}
            value={form.password}
            onChange={(v) => set("password", v)}
            error={errors.password}
          />
          {mode === "signup" && <PasswordStrength password={form.password} />}
          {mode === "signup" && (
            <InputField
              label="Şifre Tekrar"
              type="password"
              placeholder="Şifrenizi tekrar girin"
              icon={LockIcon}
              value={form.confirmPassword}
              onChange={(v) => set("confirmPassword", v)}
              error={errors.confirmPassword}
            />
          )}
        </div>
      )}

      {/* Login extras */}
      {mode === "login" && (
        <div className="mb-6 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setRemember((p) => !p)}
              className={[
                "h-[18px] w-[18px] rounded-[5px] border-[1.5px] flex items-center cursor-pointer justify-center transition-all duration-200",
                remember ? "bg-primary border-primary text-white" : "border-border text-transparent",
              ].join(" ")}
            >
              {remember && <CheckIcon />}
            </button>
            <span className="text-[13px] text-text2">Beni hatırla</span>
          </label>

          <button
            type="button"
            onClick={() => router.push("/auth/forgot-password")}
            className="text-[13px] font-semibold text-primary hover:opacity-90 cursor-pointer"
          >
            Şifremi unuttum
          </button>
        </div>
      )}

      {/* Terms */}
      {mode === "signup" && step === 2 && (
        <div className="mb-6">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => {
                setAgreed((p) => !p);
                if (errors.terms) setErrors((p) => ({ ...p, terms: "" }));
              }}
              className={[
                "mt-0.5 h-[18px] w-[18px] rounded-[5px] cursor-pointer border-[1.5px] flex items-center justify-center transition-all duration-200 shrink-0",
                agreed ? "bg-primary border-primary text-white" : errors.terms ? "border-error" : "border-border",
              ].join(" ")}
            >
              {agreed && <CheckIcon />}
            </button>

            <span className="text-[12.5px] leading-relaxed text-text2">
              <span className="text-primary font-semibold cursor-pointer">Kullanım Koşulları</span> ve{" "}
              <span className="text-primary font-semibold cursor-pointer">Gizlilik Politikası</span>'nı okudum ve kabul ediyorum.
            </span>
          </label>

          {errors.terms && <div className="mt-1.5 ml-7 text-[12px] text-error">{errors.terms}</div>}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2.5">
        {mode === "signup" && step === 2 && (
          <Button
            label="← Geri"
            type="button"
            onClick={() => setStep(1)}
            className="rounded-[10px] border-[1.5px] border-border cursor-pointer px-5 py-[14px] text-[14px] font-semibold text-text2 hover:border-borderHover transition-all duration-200"
          />
        )}

        <Button
          label={loading ? "İşleniyor..." : mode === "login" ? "Giriş Yap" : step === 1 ? "Devam Et →" : "Hesap Oluştur"}
          onClick={submit}
          disabled={loading}
          className={[
            "flex-1 rounded-[10px] py-[14px] text-[15px] font-bold cursor-pointer tracking-[0.2px] text-white transition-all duration-250 flex items-center justify-center gap-2",
            loading
              ? "bg-surface2 cursor-wait"
              : "bg-gradient-to-br from-primary to-accent shadow-glow hover:opacity-[0.98]",
          ].join(" ")}
        />
      </div>

      {/* Divider */}
      <div className="my-7 flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[12px] font-medium text-muted">veya</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Social */}
      <div className="flex gap-3">
        <SocialButton provider="google" />
        <SocialButton provider="microsoft" />
      </div>

      {/* Bottom link */}
      <p className="mt-8 text-center text-[13px] text-muted">
        {mode === "login" ? "Hesabınız yok mu? " : "Zaten hesabınız var mı? "}
        <Button label={mode === "login" ? "Kayıt olun" : "Giriş yapın"} onClick={() => router.push(mode === "login" ? "/auth/signup" : "/auth/login")} />
      </p>
    </div>
  );
}

