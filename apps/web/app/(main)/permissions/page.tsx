import type { Metadata } from "next";
import { redirectToRoute, type LegacyRoutePageProps } from "@/lib/module-redirect";

export const metadata: Metadata = {
  title: "Yetkiler",
  robots: { index: false, follow: false },
};

export default async function PermissionsPage({ searchParams }: LegacyRoutePageProps) {
  return redirectToRoute("/settings/permissions", searchParams);
}
