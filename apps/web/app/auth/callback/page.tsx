import { Suspense } from "react";
import AuthCallbackCard from "@/components/auth/AuthCallbackCard";
import Logo from "@/components/ui/Logo";

function AuthCallbackFallback() {
  return (
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
          <h1 className="mb-2 text-[22px] font-bold tracking-tight text-text">Giriş yapılıyor</h1>
          <p className="text-[13.5px] leading-relaxed text-muted">Lütfen bekleyin...</p>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackCard />
    </Suspense>
  );
}
