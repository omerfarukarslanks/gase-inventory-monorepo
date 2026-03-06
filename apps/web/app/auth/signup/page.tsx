import type { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "StockPulse'a kayıt olarak stok ve satış yönetimine hemen başlayın.",
  robots: { index: true, follow: true },
};

export default function SignupPage() {
  return <AuthCard initialMode="signup" />;
}
