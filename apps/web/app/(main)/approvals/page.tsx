import type { Metadata } from "next";
import { redirectToRoute, type LegacyRoutePageProps } from "@/lib/module-redirect";

export const metadata: Metadata = {
  title: "Onaylar",
  robots: { index: false, follow: false },
};

export default async function ApprovalsPage({ searchParams }: LegacyRoutePageProps) {
  return redirectToRoute("/approvals/pending", searchParams);
}
