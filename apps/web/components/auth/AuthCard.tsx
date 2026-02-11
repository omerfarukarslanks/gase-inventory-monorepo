"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AuthTabs from "./AuthTabs";
import PasswordStrength from "./PasswordStrength";
import { BuildIcon, CheckIcon, EmailIcon, LockIcon, UserIcon } from "../auth/icon";
import InputField from "../ui/InputField";
import SocialButton from "../ui/SocialButton";
import Logo from "../ui/Logo";

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
  const [agreed, setAgreed] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    tenantName: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // initial route safety
  useEffect(() => {
    if (initialMode === "signup" && !pathname?.includes("/signup")) router.replace("/signup");
    if (initialMode === "login" && pathname?.includes("/signup")) router.replace("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reset on mode change (route change)
  useEffect(() => {
    setStep(1);
    setErrors({});
    setSuccessMsg("");
    setAgreed(false);
    setRemember(false);
    setForm({ tenantName: "", fullName: "", email: "", password: "", confirmPassword: "" });
  }, [mode]);

  const set = (k: keyof typeof form, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};

    if (mode === "signup" && step === 1) {
      if (!form.tenantName.trim()) e.tenantName = "Firma adı zorunludur";
      if (!form.fullName.trim()) e.fullName = "Ad Soyad zorunludur";
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
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);

    if (mode === "signup") {
      setSuccessMsg("Hesap oluşturuldu!");
      setTimeout(() => {
        router.push("/auth/login");
        setSuccessMsg("");
      }, 1200);
    } else {
      setSuccessMsg("Giriş başarılı!");
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
            label="Ad Soyad"
            type="text"
            placeholder="Adınız Soyadınız"
            icon={UserIcon}
            value={form.fullName}
            onChange={(v) => set("fullName", v)}
            error={errors.fullName}
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

          <button type="button" className="text-[13px] font-semibold text-primary hover:opacity-90 cursor-pointer">
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
          <button
            type="button"
            onClick={() => setStep(1)}
            className="rounded-[10px] border-[1.5px] border-border cursor-pointer px-5 py-[14px] text-[14px] font-semibold text-text2 hover:border-borderHover transition-all duration-200"
          >
            ← Geri
          </button>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className={[
            "flex-1 rounded-[10px] py-[14px] text-[15px] font-bold cursor-pointer tracking-[0.2px] text-white transition-all duration-250 flex items-center justify-center gap-2",
            loading
              ? "bg-surface2 cursor-wait"
              : "bg-gradient-to-br from-primary to-accent shadow-glow hover:opacity-[0.98]",
          ].join(" ")}
        >
          {loading ? (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="animate-sp">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="3" />
                <path d="M12 2a10 10 0 019.95 9" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
              İşleniyor...
            </>
          ) : mode === "login" ? (
            "Giriş Yap"
          ) : step === 1 ? (
            "Devam Et →"
          ) : (
            "Hesap Oluştur"
          )}
        </button>
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
        <button
          className="text-primary font-semibold cursor-pointer hover:opacity-90"
          onClick={() => router.push(mode === "login" ? "/auth/signup" : "/auth/login")}
          type="button"
        >
          {mode === "login" ? "Kayıt olun" : "Giriş yapın"}
        </button>
      </p>
    </div>
  );
}
