import type { Metadata } from "next";
import { redirectToRoute, type LegacyRoutePageProps } from "@/lib/module-redirect";

export const metadata: Metadata = {
  title: "Urun Paketleri",
  robots: { index: false, follow: false },
};

export default async function ProductPackagesPage({ searchParams }: LegacyRoutePageProps) {
  return redirectToRoute("/catalog/packages", searchParams);
}
