import { Suspense } from "react";
import ResetPasswordCard from "@/components/auth/ResetPasswordCard";
import AuthShell from "@/components/auth/AuthShell";

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="text-center text-sm text-muted">Yukleniyor...</div>}>
        <ResetPasswordCard />
      </Suspense>
    </AuthShell>
  );
}
