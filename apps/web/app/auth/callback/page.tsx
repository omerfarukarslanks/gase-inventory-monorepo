"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMe } from "@/app/auth/auth";
import Logo from "@/components/ui/Logo";
import AuthShell from "@/components/auth/AuthShell";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Gecersiz giris baglantisi.");
      setTimeout(() => router.replace("/auth/login"), 2000);
      return;
    }

    const handleCallback = async () => {
      try {
        localStorage.setItem("token", token);
        const user = await getMe(token);
        localStorage.setItem("user", JSON.stringify(user));
        router.replace("/dashboard");
      } catch {
        localStorage.removeItem("token");
        setError("Giris basarisiz. Lutfen tekrar deneyin.");
        setTimeout(() => router.replace("/auth/login"), 2000);
      }
    };

    handleCallback();
  }, [token, router]);

  if (error) {
    return (
      <AuthShell>
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
              <h2 className="mb-2 text-[22px] font-bold tracking-tight text-text">Giris Basarisiz</h2>
              <p className="mb-4 text-[13.5px] leading-relaxed text-muted">{error}</p>
              <p className="text-[12.5px] text-muted">Giris sayfasina yonlendiriliyorsunuz...</p>
            </div>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div>
        <div className="mb-8 flex justify-center lg:hidden">
          <Logo />
        </div>
        <div className="rounded-2xl border border-border bg-surface px-7 py-8 shadow-[0_4px_24px_rgb(0_0_0_/_0.08)] dark:shadow-[0_4px_24px_rgb(0_0_0_/_0.25)]">
          <div className="animate-si text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="animate-sp">
                <circle cx="12" cy="12" r="10" stroke="rgb(var(--primary))" strokeWidth="2" strokeOpacity="0.2" />
                <path d="M12 2a10 10 0 019.95 9" stroke="rgb(var(--primary))" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="mb-2 text-[22px] font-bold tracking-tight text-text">Giris yapiliyor</h2>
            <p className="text-[13.5px] leading-relaxed text-muted">Lutfen bekleyin...</p>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
