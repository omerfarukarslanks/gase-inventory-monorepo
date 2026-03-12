"use client";

import { usePathname } from "next/navigation";
import {
  getVisibleNavigation,
  matchesNavigationPath,
  resolveNavigationChildByPath,
} from "@/lib/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { useSessionProfile } from "@/hooks/useSessionProfile";

export function useAppNavigation() {
  const pathname = usePathname();
  const { permissions } = usePermissions();
  const { canSeePackages } = useSessionProfile();
  const { mainItems, managementItems, bottomNavItems } = getVisibleNavigation(permissions, canSeePackages);
  const visibleItems = [...mainItems, ...managementItems];
  const activeItem = visibleItems.find((item) => matchesNavigationPath(item, pathname));
  const activeChild =
    activeItem?.children?.length ? resolveNavigationChildByPath(activeItem.key, pathname, permissions, canSeePackages) : undefined;

  return {
    pathname,
    mainItems,
    managementItems,
    bottomNavItems,
    activeItem,
    activeChild,
    breadcrumbItems:
      activeItem?.children?.length && activeChild
        ? [
            { key: activeItem.key, href: activeItem.href, labelKey: activeItem.labelKey },
            { key: activeChild.key, href: activeChild.href, labelKey: activeChild.labelKey },
          ]
        : [],
    isActiveItem: (href: string) => {
      const item = visibleItems.find((entry) => entry.href === href);
      if (item) return matchesNavigationPath(item, pathname);
      return pathname === href || pathname.startsWith(`${href}/`);
    },
  };
}
