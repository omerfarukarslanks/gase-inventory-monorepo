import type { Metadata } from "next";
import { redirectToRoute, type LegacyRoutePageProps } from "@/lib/module-redirect";

export const metadata: Metadata = {
  title: "Tedarik",
  robots: { index: false, follow: false },
};

export default async function SupplyPage({ searchParams }: LegacyRoutePageProps) {
  return redirectToRoute("/supply/suggestions", searchParams);
}
