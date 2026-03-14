import type { Metadata } from "next";
import { redirectToRoute, type LegacyRoutePageProps } from "@/lib/module-redirect";

export const metadata: Metadata = {
  title: "Tedarikçiler",
  robots: { index: false, follow: false },
};

export default async function SuppliersPage({ searchParams }: LegacyRoutePageProps) {
  return redirectToRoute("/customers/suppliers", searchParams);
}
