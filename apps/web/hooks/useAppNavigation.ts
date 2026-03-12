"use client";

import { usePathname } from "next/navigation";
import { findNavigationItem, getVisibleNavigation } from "@/lib/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { useSessionProfile } from "@/hooks/useSessionProfile";

export function useAppNavigation() {
  const pathname = usePathname();
  const { permissions } = usePermissions();
  const { canSeePackages } = useSessionProfile();
  const { mainItems, managementItems, bottomNavItems } = getVisibleNavigation(permissions, canSeePackages);

  return {
    pathname,
    mainItems,
    managementItems,
    bottomNavItems,
    activeItem: findNavigationItem(pathname),
    isActiveItem: (href: string) => pathname === href || pathname.startsWith(`${href}/`),
  };
}
