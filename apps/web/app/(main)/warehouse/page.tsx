import type { Metadata } from "next";
import { redirectToRoute, type LegacyRoutePageProps } from "@/lib/module-redirect";

export const metadata: Metadata = {
  title: "Depo",
  robots: { index: false, follow: false },
};

export default async function WarehousePage({ searchParams }: LegacyRoutePageProps) {
  return redirectToRoute("/warehouse/count-sessions", searchParams);
}
