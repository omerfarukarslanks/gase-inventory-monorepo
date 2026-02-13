"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InputField from "@/components/ui/InputField";
import PasswordStrength from "@/components/auth/PasswordStrength";
import Logo from "@/components/ui/Logo";
import { CheckIcon, EmailIcon, LockIcon } from "@/components/auth/icon";
import Button from "../ui/Button";
import { forgotPassword } from "@/app/auth/auth";

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
  const router = useRouter();
  const [step, setStep] = useState<Step>("forgot");
  const [email, setEmail] = useState("");
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

  const submitForgot = async () => {
    const nextErrors: Errors = {};

    if (!email.trim()) nextErrors.email = "E-posta zorunludur";
    else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = "Gecerli bir e-posta girin";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const response = await forgotPassword(email);
      await sleep(1200);
      if (response && response.success) {
        setStep("email-sent");
      } else {
        setErrors({ email: "E-posta adresi bulunamadi" });
      }
    } catch {
      setErrors({ email: "Bir hata olustu. Lutfen tekrar deneyin." });
    } finally {
      setLoading(false);
    }

  };

  const submitReset = async () => {
    const nextErrors: Errors = {};

    if (!password) nextErrors.password = "Sifre zorunludur";
    else if (password.length < 8) nextErrors.password = "En az 8 karakter olmalidir";

    if (password !== confirmPassword) nextErrors.confirmPassword = "Sifreler eslesmiyor";

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

      <div className="rounded-2xl border border-border bg-surface px-7 py-8 shadow-[0_4px_24px_rgb(0_0_0_/_0.08)] dark:shadow-[0_4px_24px_rgb(0_0_0_/_0.25)]">
        {step === "forgot" && (
          <div className="animate-si">
            <div className="mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-primary/10">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" strokeWidth="1.5">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>

            <h2 className="mb-2 text-center text-[22px] font-bold tracking-tight text-text">Sifremi Unuttum</h2>
            <p className="mb-7 text-center text-[13.5px] leading-relaxed text-muted">
              E-posta adresinizi girin. Sifre sifirlama baglantisini hemen gonderelim.
            </p>

            <InputField
              label="E-posta Adresi"
              type="email"
              placeholder="ornek@firma.com"
              icon={EmailIcon}
              value={email}
              onChange={(value) => {
                setEmail(value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              error={errors.email}
            />

            <Button
              label={loading ? "Gonderiliyor..." : "Sifirlama Baglantisi Gonder"}
              onClick={submitForgot}
              disabled={loading}
              className={[
                "flex w-full items-center justify-center gap-2 rounded-[10px] py-[14px] text-[14.5px] font-bold text-white transition-all",
                loading ? "cursor-wait bg-surface2" : "bg-gradient-to-br from-primary to-accent shadow-glow hover:opacity-[0.98]",
              ].join(" ")}
            />


            <p className="mt-6 text-center text-[13px] text-muted">
              Sifrenizi hatirladiniz mi?{" "}
              <Button
                label="Giris yapin"
                onClick={() => router.push("/auth/login")}
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

            <h2 className="mb-2 text-[22px] font-bold tracking-tight text-text">E-posta Gonderildi</h2>
            <p className="mb-4 text-[13.5px] leading-relaxed text-muted">Asagidaki adrese sifre sifirlama baglantisi gonderdik:</p>

            <div className="mb-5 inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2">
              {EmailIcon}
              <span className="text-[13px] font-semibold text-primary">{email || "ornek@firma.com"}</span>
            </div>

            <p className="mb-6 text-[12.5px] leading-relaxed text-muted">
              E-posta kutunuzu kontrol edin. Baglanti 30 dakika boyunca gecerlidir.
            </p>

            <div className="flex flex-col gap-2.5">
              <Button
                label="Tekrar Gonder"
                onClick={submitForgot}
                className="w-full rounded-[10px] border-[1.5px] border-border py-[12px] text-[13.5px] font-semibold text-text2 hover:border-borderHover"
              />

              <Button
                label="Giris Sayfasina Don"
                onClick={() => router.push("/auth/login")}
                className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-primary to-accent py-[14px] text-[14.5px] font-bold text-white shadow-glow hover:opacity-[0.98]"
              />
            </div>
          </div>
        )}

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
              label={loading ? "Kaydediliyor..." : "Sifreyi Guncelle"
              }
              loading={loading}
              onClick={submitReset}
              disabled={loading}
              className={[
                "flex w-full items-center justify-center gap-2 rounded-[10px] py-[14px] text-[14.5px] font-bold text-white transition-all",
                loading ? "cursor-wait bg-surface2" : "bg-gradient-to-br from-primary to-accent shadow-glow hover:opacity-[0.98]",
              ].join(" ")}
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
              className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-primary to-accent py-[14px] text-[14.5px] font-bold text-white shadow-glow hover:opacity-[0.98]"
            />

            <Button
              label="Akisi bastan baslat"
              onClick={resetFlow}
              className="mt-3 w-full text-[12.5px] font-semibold text-text2 underline decoration-border hover:text-text"
            />
          </div>
        )}
      </div>
    </div>
  );
}
