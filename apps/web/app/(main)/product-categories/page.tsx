import type { Metadata } from "next";
import { redirectToRoute, type LegacyRoutePageProps } from "@/lib/module-redirect";

export const metadata: Metadata = {
  title: "Ürün Kategorileri",
  robots: { index: false, follow: false },
};

export default async function ProductCategoriesPage({ searchParams }: LegacyRoutePageProps) {
  return redirectToRoute("/catalog/categories", searchParams);
}
