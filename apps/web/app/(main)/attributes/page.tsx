import type { Metadata } from "next";
import { redirectToRoute, type LegacyRoutePageProps } from "@/lib/module-redirect";

export const metadata: Metadata = {
  title: "Özellikler",
  robots: { index: false, follow: false },
};

export default async function AttributesPage({ searchParams }: LegacyRoutePageProps) {
  return redirectToRoute("/catalog/attributes", searchParams);
}
