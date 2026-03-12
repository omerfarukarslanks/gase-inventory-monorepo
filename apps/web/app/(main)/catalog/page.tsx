import type { Metadata } from "next";
import { redirectToRoute, type LegacyRoutePageProps } from "@/lib/module-redirect";

export const metadata: Metadata = {
  title: "Katalog",
  robots: { index: false, follow: false },
};

export default async function CatalogPage({ searchParams }: LegacyRoutePageProps) {
  return redirectToRoute("/catalog/products", searchParams);
}
