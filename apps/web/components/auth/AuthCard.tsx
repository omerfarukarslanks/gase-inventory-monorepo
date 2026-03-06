"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AuthTabs from "./AuthTabs";
import PasswordStrength from "./PasswordStrength";
import { BuildIcon, CheckIcon, EmailIcon, LockIcon, UserIcon } from "../auth/icon";
import InputField from "../ui/InputField";
import SocialButton from "../ui/SocialButton";
import Logo from "../ui/Logo";
import { login, signup, getGoogleAuthUrl, getMicrosoftAuthUrl } from "@/app/auth/auth";
import { ApiError } from "@/lib/api";
import Button from "../ui/Button";
import { useLang } from "@/context/LangContext";

type Mode = "login" | "signup";

type Props = {
  initialMode: Mode;
};

export default function AuthCard({ initialMode }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLang();

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
      if (!form.tenantName.trim()) e.tenantName = t("auth.companyNameRequired");
      if (!form.name.trim()) e.name = t("auth.nameRequired");
      if (!form.surname.trim()) e.surname = t("auth.surnameRequired");
    }

    if (mode === "login" || (mode === "signup" && step === 2)) {
      if (!form.email.trim()) e.email = t("auth.emailRequired");
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = t("auth.emailInvalid");

      if (!form.password) e.password = t("auth.passwordRequired");
      else if (form.password.length < 8) e.password = t("auth.passwordMinLength");

      if (mode === "signup") {
        if (form.password !== form.confirmPassword) e.confirmPassword = t("auth.passwordsMismatch");
        if (!agreed) e.terms = t("auth.termsRequired");
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
        setSuccessMsg(t("auth.loginSuccess"));
        setTimeout(() => router.push("/dashboard"), 800);
      } else {
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
        setSuccessMsg(t("auth.accountCreated"));
        setTimeout(() => {
          router.push("/auth/login");
          setSuccessMsg("");
        }, 1200);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(t("auth.genericError"));
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
          {mode === "login"
            ? t("auth.loginTitle")
            : step === 1
            ? t("auth.companyInfoTitle")
            : t("auth.createAccountTitle")}
        </h2>
        <p className="mt-1 text-[13.5px] text-muted">
          {mode === "login"
            ? t("auth.loginSubtitle")
            : step === 1
            ? t("auth.companyInfoSubtitle")
            : t("auth.createAccountSubtitle")}
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
                {st === 1 ? t("auth.stepCompany") : t("auth.stepAccount")}
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
            label={t("auth.companyName")}
            type="text"
            placeholder={t("auth.companyNamePlaceholder")}
            icon={BuildIcon}
            value={form.tenantName}
            onChange={(v) => set("tenantName", v)}
            error={errors.tenantName}
          />
          <InputField
            label={t("auth.name")}
            type="text"
            placeholder={t("auth.namePlaceholder")}
            icon={UserIcon}
            value={form.name}
            onChange={(v) => set("name", v)}
            error={errors.name}
          />
          <InputField
            label={t("auth.surname")}
            type="text"
            placeholder={t("auth.surnamePlaceholder")}
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
            label={t("auth.email")}
            type="email"
            placeholder={t("auth.emailPlaceholder")}
            icon={EmailIcon}
            value={form.email}
            onChange={(v) => set("email", v)}
            error={errors.email}
          />
          <InputField
            label={t("auth.password")}
            type="password"
            placeholder={mode === "login" ? t("auth.passwordPlaceholderLogin") : t("auth.passwordPlaceholderSignup")}
            icon={LockIcon}
            value={form.password}
            onChange={(v) => set("password", v)}
            error={errors.password}
          />
          {mode === "signup" && <PasswordStrength password={form.password} />}
          {mode === "signup" && (
            <InputField
              label={t("auth.confirmPassword")}
              type="password"
              placeholder={t("auth.confirmPasswordPlaceholder")}
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
            <span className="text-[13px] text-text2">{t("auth.rememberMe")}</span>
          </label>

          <button
            type="button"
            onClick={() => router.push("/auth/forgot-password")}
            className="text-[13px] font-semibold text-primary hover:opacity-90 cursor-pointer"
          >
            {t("auth.forgotPassword")}
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
              <span className="text-primary font-semibold cursor-pointer">{t("auth.terms")}</span>{" "}
              {t("auth.termsAnd")}{" "}
              <span className="text-primary font-semibold cursor-pointer">{t("auth.privacy")}</span>
              {"'"}nı {t("auth.termsRead")}
            </span>
          </label>

          {errors.terms && <div className="mt-1.5 ml-7 text-[12px] text-error">{errors.terms}</div>}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2.5">
        {mode === "signup" && step === 2 && (
          <Button
            label={t("auth.back")}
            type="button"
            onClick={() => setStep(1)}
            variant="authSecondary"
          />
        )}

        <Button
          label={
            loading
              ? t("auth.processing")
              : mode === "login"
              ? t("auth.login")
              : step === 1
              ? t("auth.continueStep")
              : t("auth.createAccount")
          }
          onClick={submit}
          disabled={loading}
          variant="authPrimary"
          className="flex-1 text-[15px] tracking-[0.2px] transition-all duration-250"
        />
      </div>

      {/* Divider */}
      <div className="my-7 flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[12px] font-medium text-muted">{t("auth.or")}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Social */}
      <div className="flex gap-3">
        <SocialButton provider="google" onClick={() => { window.location.href = getGoogleAuthUrl(); }} />
        <SocialButton provider="microsoft" onClick={() => { window.location.href = getMicrosoftAuthUrl(); }} />
      </div>

      {/* Bottom link */}
      <p className="mt-8 text-center text-[13px] text-muted">
        {mode === "login" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
        <Button
          label={mode === "login" ? t("auth.register") : t("auth.loginLink")}
          onClick={() => router.push(mode === "login" ? "/auth/signup" : "/auth/login")}
          variant="link"
        />
      </p>
    </div>
  );
}
