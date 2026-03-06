import type { Metadata } from "next";
import ForgotPasswordCard from "@/components/auth/ForgotPasswordCard";

export const metadata: Metadata = {
  title: "Şifremi Unuttum",
  description: "StockPulse hesabınızın şifresini sıfırlayın.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordCard />;
}
