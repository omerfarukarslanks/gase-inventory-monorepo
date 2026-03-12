import type { Metadata } from "next";
import { redirectToRoute, type LegacyRoutePageProps } from "@/lib/module-redirect";

export const metadata: Metadata = {
  title: "Mağazalar",
  robots: { index: false, follow: false },
};

export default async function StoresPage({ searchParams }: LegacyRoutePageProps) {
  return redirectToRoute("/settings/stores", searchParams);
}
