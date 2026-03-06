import type { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "StockPulse hesabınıza giriş yapın.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <AuthCard initialMode="login" />;
}
