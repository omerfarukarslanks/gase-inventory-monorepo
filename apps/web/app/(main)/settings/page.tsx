import type { Metadata } from "next";
import { redirectToRoute, type LegacyRoutePageProps } from "@/lib/module-redirect";

export const metadata: Metadata = {
  title: "Ayarlar",
  robots: { index: false, follow: false },
};

export default async function SettingsPage({ searchParams }: LegacyRoutePageProps) {
  return redirectToRoute("/settings/stores", searchParams);
}
