"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import InputField from "@/components/ui/InputField";
import PasswordStrength from "@/components/auth/PasswordStrength";
import Logo from "@/components/ui/Logo";
import { CheckIcon, LockIcon } from "@/components/auth/icon";
import Button from "../ui/Button";
import { resetPassword } from "@/app/auth/auth";

type Step = "reset" | "success";

type Errors = {
  password?: string;
  confirmPassword?: string;
  general?: string;
};

export default function ResetPasswordCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [step, setStep] = useState<Step>("reset");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const passwordRules = [
    { label: "En az 8 karakter", ok: password.length >= 8 },
    { label: "Buyuk ve kucuk harf", ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "En az 1 rakam", ok: /\d/.test(password) },
    { label: "En az 1 ozel karakter", ok: /[^a-zA-Z0-9]/.test(password) },
  ];

  const submitReset = async () => {
    const nextErrors: Errors = {};

    if (!token) {
      nextErrors.general = "Gecersiz veya eksik sifirlama baglantisi.";
      setErrors(nextErrors);
      return;
    }

    if (!password) nextErrors.password = "Sifre zorunludur";
    else if (password.length < 8) nextErrors.password = "En az 8 karakter olmalidir";

    if (password !== confirmPassword) nextErrors.confirmPassword = "Sifreler eslesmiyor";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const response = await resetPassword(token, password);
      if (response && response.success) {
        setStep("success");
      } else {
        setErrors({ general: "Sifre sifirlanamadi. Lutfen tekrar deneyin." });
      }
    } catch {
      setErrors({ general: "Bir hata olustu. Baglanti suresi dolmus olabilir." });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div>
        <div className="mb-8 flex justify-center lg:hidden">
          <Logo />
        </div>
        <div className="rounded-2xl border border-border bg-surface px-7 py-8 shadow-[0_4px_24px_rgb(0_0_0_/_0.08)] dark:shadow-[0_4px_24px_rgb(0_0_0_/_0.25)]">
          <div className="animate-si text-center">
            <div className="mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-error/10">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--error, 239 68 68))" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2 className="mb-2 text-[22px] font-bold tracking-tight text-text">Gecersiz Baglanti</h2>
            <p className="mb-7 text-[13.5px] leading-relaxed text-muted">
              Sifre sifirlama baglantisi gecersiz veya eksik. Lutfen yeni bir baglanti talep edin.
            </p>
            <Button
              label="Sifremi Unuttum Sayfasina Don"
              onClick={() => router.push("/auth/forgot-password")}
              variant="authPrimary"
              fullWidth
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-center lg:hidden">
        <Logo />
      </div>

      <div className="rounded-2xl border border-border bg-surface px-7 py-8 shadow-[0_4px_24px_rgb(0_0_0_/_0.08)] dark:shadow-[0_4px_24px_rgb(0_0_0_/_0.25)]">
        {step === "reset" && (
          <div className="animate-si">
            <div className="mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-primary/10">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="3" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>

            <h2 className="mb-2 text-center text-[22px] font-bold tracking-tight text-text">Yeni Sifre Belirleyin</h2>
            <p className="mb-7 text-center text-[13.5px] leading-relaxed text-muted">Guclu bir sifre olusturarak hesabinizi koruyun.</p>

            {errors.general && (
              <div className="mb-5 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-[13px] text-error">
                {errors.general}
              </div>
            )}

            <InputField
              label="Yeni Sifre"
              type="password"
              placeholder="En az 8 karakter"
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
                      "flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-[1.5px] transition-all",
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
              label="Sifre Tekrar"
              type="password"
              placeholder="Yeni sifrenizi tekrar girin"
              icon={LockIcon}
              value={confirmPassword}
              onChange={(value) => {
                setConfirmPassword(value);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              error={errors.confirmPassword}
            />

            <Button
              label={loading ? "Kaydediliyor..." : "Sifreyi Guncelle"}
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

            <h2 className="mb-2 text-[22px] font-bold tracking-tight text-text">Sifreniz Guncellendi</h2>
            <p className="mb-7 text-[13.5px] leading-relaxed text-muted">
              Yeni sifreniz kaydedildi. Artik giris yaparak devam edebilirsiniz.
            </p>

            <Button
              label="Giris Sayfasina Don"
              onClick={() => router.push("/auth/login")}
              variant="authPrimary"
              fullWidth
            />
          </div>
        )}
      </div>
    </div>
  );
}
