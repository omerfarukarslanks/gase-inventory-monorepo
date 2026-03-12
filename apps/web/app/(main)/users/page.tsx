import type { Metadata } from "next";
import { redirectToRoute, type LegacyRoutePageProps } from "@/lib/module-redirect";

export const metadata: Metadata = {
  title: "Kullanıcılar",
  robots: { index: false, follow: false },
};

export default async function UsersPage({ searchParams }: LegacyRoutePageProps) {
  return redirectToRoute("/settings/users", searchParams);
}
