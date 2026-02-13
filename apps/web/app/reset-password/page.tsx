"use client";

import ResetPasswordCard from "@/components/auth/ResetPasswordCard";
import AuthShell from "@/components/auth/AuthShell";

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <ResetPasswordCard />
    </AuthShell>
  );
}
