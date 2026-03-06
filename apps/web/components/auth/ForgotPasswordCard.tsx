"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InputField from "@/components/ui/InputField";
import PasswordStrength from "@/components/auth/PasswordStrength";
import Logo from "@/components/ui/Logo";
import { CheckIcon, EmailIcon, LockIcon } from "@/components/auth/icon";
import Button from "../ui/Button";
import { forgotPassword } from "@/app/auth/auth";
import { useLang } from "@/context/LangContext";

type Step = "forgot" | "email-sent" | "reset" | "success";

type Errors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ForgotPasswordCard() {
  const { t } = useLang();
  const router = useRouter();
  const [step, setStep] = useState<Step>("forgot");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const passwordRules = [
    { label: t("auth.ruleMinChars"), ok: password.length >= 8 },
    { label: t("auth.ruleUpperLower"), ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: t("auth.ruleDigit"), ok: /\d/.test(password) },
    { label: t("auth.ruleSpecial"), ok: /[^a-zA-Z0-9]/.test(password) },
  ];

  const submitForgot = async () => {
    const nextErrors: Errors = {};

    if (!email.trim()) nextErrors.email = t("auth.emailRequired");
    else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = t("auth.emailInvalid");

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const response = await forgotPassword(email);
      await sleep(1200);
      if (response && response.success) {
        setStep("email-sent");
      } else {
        setErrors({ email: t("auth.emailNotFound") });
      }
    } catch {
      setErrors({ email: t("auth.genericError") });
    } finally {
      setLoading(false);
    }

  };

  const submitReset = async () => {
    const nextErrors: Errors = {};

    if (!password) nextErrors.password = t("auth.passwordRequired");
    else if (password.length < 8) nextErrors.password = t("auth.passwordMinLengthError");

    if (password !== confirmPassword) nextErrors.confirmPassword = t("auth.passwordsMismatch");

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    await sleep(1200);
    setLoading(false);
    setStep("success");
  };

  const resetFlow = () => {
    setStep("forgot");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setErrors({});
    setLoading(false);
  };

  return (
    <div>
      <div className="mb-8 flex justify-center lg:hidden">
        <Logo />
      </div>

      <div className="rounded-2xl border border-border bg-surface px-7 py-8 shadow-[0_4px_24px_rgb(0_0_0/0.08)] dark:shadow-[0_4px_24px_rgb(0_0_0/0.25)]">
        {step === "forgot" && (
          <div className="animate-si">
            <div className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-2xl bg-primary/10">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" strokeWidth="1.5">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>

            <h2 className="mb-2 text-center text-[22px] font-bold tracking-tight text-text">{t("auth.forgotTitle")}</h2>
            <p className="mb-7 text-center text-[13.5px] leading-relaxed text-muted">
              {t("auth.forgotSubtitle")}
            </p>

            <InputField
              label={t("auth.email")}
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              icon={EmailIcon}
              value={email}
              onChange={(value) => {
                setEmail(value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              error={errors.email}
            />

            <Button
              label={loading ? t("auth.sending") : t("auth.sendResetLink")}
              onClick={submitForgot}
              disabled={loading}
              variant="authPrimary"
              fullWidth
              className="transition-all"
            />


            <p className="mt-6 text-center text-[13px] text-muted">
              {t("auth.rememberPassword")}{" "}
              <Button
                label={t("auth.loginLink")}
                onClick={() => router.push("/auth/login")}
                variant="link"
              />
            </p>
          </div>
        )}

        {step === "email-sent" && (
          <div className="animate-su text-center">
            <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" strokeWidth="1.5">
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <path d="M22 7l-10 6L2 7" />
              </svg>
              <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-glow">
                <CheckIcon />
              </div>
            </div>

            <h2 className="mb-2 text-[22px] font-bold tracking-tight text-text">{t("auth.emailSentTitle")}</h2>
            <p className="mb-4 text-[13.5px] leading-relaxed text-muted">{t("auth.emailSentSubtitle")}</p>

            <div className="mb-5 inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2">
              {EmailIcon}
              <span className="text-[13px] font-semibold text-primary">{email || t("auth.emailPlaceholder")}</span>
            </div>

            <p className="mb-6 text-[12.5px] leading-relaxed text-muted">
              {t("auth.emailSentNote")}
            </p>

            <div className="flex flex-col gap-2.5">
              <Button
                label={t("auth.resend")}
                onClick={submitForgot}
                variant="authSecondary"
                fullWidth
                className="py-3 text-[13.5px]"
              />

              <Button
                label={t("auth.backToLogin")}
                onClick={() => router.push("/auth/login")}
                variant="authPrimary"
                fullWidth
              />
            </div>
          </div>
        )}

        {step === "reset" && (
          <div className="animate-si">
            <div className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-2xl bg-primary/10">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="3" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>

            <h2 className="mb-2 text-center text-[22px] font-bold tracking-tight text-text">{t("auth.newPasswordTitle")}</h2>
            <p className="mb-7 text-center text-[13.5px] leading-relaxed text-muted">{t("auth.newPasswordSubtitle")}</p>

            <InputField
              label={t("auth.newPassword")}
              type="password"
              placeholder={t("auth.passwordMinLength")}
              icon={LockIcon}
              value={password}
              onChange={(value) => {
                setPassword(value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
            />
            <PasswordStrength password={password} />

            <div className="mb-5 flex flex-col gap-2">
              {passwordRules.map((rule) => (
                <div key={rule.label} className={`flex items-center gap-2 text-[12.5px] ${rule.ok ? "text-primary" : "text-muted"}`}>
                  <div
                    className={[
                      "flex h-4.5 w-4.5 items-center justify-center rounded-[5px] border-[1.5px] transition-all",
                      rule.ok ? "border-primary bg-primary text-white" : "border-border",
                    ].join(" ")}
                  >
                    {rule.ok && <CheckIcon />}
                  </div>
                  <span className={rule.ok ? "line-through opacity-75" : ""}>{rule.label}</span>
                </div>
              ))}
            </div>

            <InputField
              label={t("auth.confirmPassword")}
              type="password"
              placeholder={t("auth.confirmPasswordRepeatPlaceholder")}
              icon={LockIcon}
              value={confirmPassword}
              onChange={(value) => {
                setConfirmPassword(value);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              error={errors.confirmPassword}
            />

            <Button
              label={loading ? t("auth.processing") : t("auth.updatePassword")}
              loading={loading}
              onClick={submitReset}
              disabled={loading}
              variant="authPrimary"
              fullWidth
              className="transition-all"
            />

          </div>
        )}

        {step === "success" && (
          <div className="animate-su text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-glow">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11.5 14.5 16 10" />
              </svg>
            </div>

            <h2 className="mb-2 text-[22px] font-bold tracking-tight text-text">{t("auth.passwordUpdatedTitle")}</h2>
            <p className="mb-7 text-[13.5px] leading-relaxed text-muted">
              {t("auth.passwordUpdatedSubtitle")}
            </p>

            <Button
              label={t("auth.backToLogin")}
              onClick={() => router.push("/auth/login")}
              variant="authPrimary"
              fullWidth
            />

            <Button
              label={t("auth.restartFlow")}
              onClick={resetFlow}
              variant="link"
              className="mt-3 w-full text-[12.5px] font-semibold text-text2 underline decoration-border hover:text-text"
            />
          </div>
        )}
      </div>
    </div>
  );
}
