import type { Metadata } from "next";
import { redirectToRoute, type LegacyRoutePageProps } from "@/lib/module-redirect";

export const metadata: Metadata = {
  title: "Müşteriler",
  robots: { index: false, follow: false },
};

export default async function CustomersPage({ searchParams }: LegacyRoutePageProps) {
  return redirectToRoute("/customers/list", searchParams);
}
