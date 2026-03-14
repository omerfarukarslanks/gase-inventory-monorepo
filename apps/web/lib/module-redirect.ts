import { redirect } from "next/navigation";
import { buildNavigationHref, type NavigationQueryRecord } from "@/lib/navigation";

export type LegacyRoutePageProps = {
  searchParams?: Promise<NavigationQueryRecord> | NavigationQueryRecord;
};

export async function redirectToRoute(
  href: string,
  searchParamsPromise?: Promise<NavigationQueryRecord> | NavigationQueryRecord,
): Promise<never> {
  const searchParams = searchParamsPromise ? await searchParamsPromise : undefined;
  redirect(buildNavigationHref(href, searchParams));
}
