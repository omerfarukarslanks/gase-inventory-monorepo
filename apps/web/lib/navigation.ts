import type { PermissionName } from "@/lib/authz";

export type NavigationQueryRecord = Record<string, string | string[] | undefined>;

type NavigationAccessRule = {
  permission?: PermissionName;
  anyPermission?: PermissionName[];
  requiresWholesale?: boolean;
};

export type AppNavigationChild = NavigationAccessRule & {
  key: string;
  href: string;
  labelKey: string;
  matchesRoute?: string[];
};

export type AppNavigationItem = NavigationAccessRule & {
  key: string;
  href: string;
  labelKey: string;
  icon: string;
  badge?: string;
  bottomNav?: boolean;
  isHidden?: boolean;
  matchesRoute?: string[];
  children?: AppNavigationChild[];
};

const APP_NAV_ITEMS: AppNavigationItem[] = [
  { key: "dashboard", href: "/dashboard", labelKey: "nav.dashboard", icon: "D", bottomNav: true },
  { key: "sales", href: "/sales", labelKey: "nav.sales", icon: "TL", permission: "SALE_READ", bottomNav: true },
  {
    key: "stock",
    href: "/stock",
    labelKey: "nav.stock",
    icon: "S",
    badge: "3",
    permission: "STOCK_LIST_READ",
    bottomNav: true,
  },
  {
    key: "catalog",
    href: "/catalog/products",
    labelKey: "nav.catalog",
    icon: "KT",
    matchesRoute: ["/catalog"],
    children: [
      {
        key: "products",
        href: "/catalog/products",
        labelKey: "nav.products",
        permission: "PRODUCT_READ",
        matchesRoute: ["/products"],
      },
      {
        key: "packages",
        href: "/catalog/packages",
        labelKey: "nav.packages",
        requiresWholesale: true,
        matchesRoute: ["/product-packages"],
      },
      {
        key: "categories",
        href: "/catalog/categories",
        labelKey: "nav.productCategories",
        permission: "PRODUCT_CATEGORY_READ",
        matchesRoute: ["/product-categories"],
      },
      {
        key: "attributes",
        href: "/catalog/attributes",
        labelKey: "nav.attributes",
        permission: "PRODUCT_ATTRIBUTE_READ",
        matchesRoute: ["/attributes"],
      },
    ],
  },
  {
    key: "customers",
    href: "/customers/list",
    labelKey: "nav.customers",
    icon: "C",
    matchesRoute: ["/customers"],
    children: [
      {
        key: "list",
        href: "/customers/list",
        labelKey: "nav.customers",
        permission: "CUSTOMER_READ",
      },
      {
        key: "suppliers",
        href: "/customers/suppliers",
        labelKey: "nav.suppliers",
        permission: "SUPPLIER_READ",
        matchesRoute: ["/suppliers"],
      },
    ],
  },
  {
    key: "reports",
    href: "/reports",
    labelKey: "nav.reports",
    icon: "R",
    anyPermission: ["REPORT_SALES_READ", "REPORT_STOCK_READ", "REPORT_FINANCIAL_READ"],
    bottomNav: true,
  },
  {
    key: "settings",
    href: "/settings/stores",
    labelKey: "nav.settings",
    icon: "AY",
    matchesRoute: ["/settings"],
    children: [
      {
        key: "stores",
        href: "/settings/stores",
        labelKey: "nav.stores",
        permission: "STORE_VIEW",
        matchesRoute: ["/stores"],
      },
      {
        key: "users",
        href: "/settings/users",
        labelKey: "nav.users",
        permission: "USER_READ",
        matchesRoute: ["/users"],
      },
      {
        key: "permissions",
        href: "/settings/permissions",
        labelKey: "nav.permissions",
        permission: "PERMISSION_MANAGE",
        matchesRoute: ["/permissions"],
      },
    ],
  },
  {
    key: "chat",
    href: "/chat",
    labelKey: "nav.chat",
    icon: "AI",
    permission: "AI_CHAT",
    isHidden: true,
  },
];

function matchesRoutePrefix(route: string, pathname: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function matchesChildPath(child: AppNavigationChild, pathname: string): boolean {
  if (matchesRoutePrefix(child.href, pathname)) return true;
  return child.matchesRoute?.some((route) => matchesRoutePrefix(route, pathname)) ?? false;
}

function canAccessRule(rule: NavigationAccessRule, permissions: string[], canSeePackages: boolean): boolean {
  if (rule.requiresWholesale && !canSeePackages) return false;
  if (rule.permission && !permissions.includes(rule.permission)) return false;
  if (rule.anyPermission && !rule.anyPermission.some((permission) => permissions.includes(permission))) return false;
  return true;
}

export function getNavigationItemByKey(key: string): AppNavigationItem | undefined {
  return APP_NAV_ITEMS.find((item) => item.key === key);
}

export function matchesNavigationPath(item: AppNavigationItem, pathname: string): boolean {
  if (matchesRoutePrefix(item.href, pathname)) return true;
  if (item.matchesRoute?.some((route) => matchesRoutePrefix(route, pathname))) return true;
  return item.children?.some((child) => matchesChildPath(child, pathname)) ?? false;
}

export function findNavigationItem(pathname: string): AppNavigationItem | undefined {
  return APP_NAV_ITEMS.find((item) => matchesNavigationPath(item, pathname));
}

export function canAccessNavigationItem(
  item: AppNavigationItem,
  permissions: string[],
  canSeePackages: boolean,
): boolean {
  const ownAccess = canAccessRule(item, permissions, canSeePackages);
  if (!item.children?.length) return ownAccess;
  return item.children.some((child) => canAccessRule(child, permissions, canSeePackages)) || ownAccess;
}

export function getVisibleNavigationChildren(
  itemKey: string,
  permissions: string[],
  canSeePackages: boolean,
): AppNavigationChild[] {
  const item = getNavigationItemByKey(itemKey);
  if (!item?.children?.length) return [];
  return item.children.filter((child) => canAccessRule(child, permissions, canSeePackages));
}

export function resolveNavigationChildByPath(
  itemKey: string,
  pathname: string,
  permissions: string[],
  canSeePackages: boolean,
): AppNavigationChild | undefined {
  const visibleChildren = getVisibleNavigationChildren(itemKey, permissions, canSeePackages);
  if (visibleChildren.length === 0) return undefined;

  const matchedChild = visibleChildren.find((child) => matchesChildPath(child, pathname));
  return matchedChild ?? visibleChildren[0];
}

export function getDefaultNavigationChild(
  itemKey: string,
  permissions: string[],
  canSeePackages: boolean,
): AppNavigationChild | undefined {
  return getVisibleNavigationChildren(itemKey, permissions, canSeePackages)[0];
}

export function getVisibleNavigation(permissions: string[], canSeePackages: boolean) {
  const visibleItems = APP_NAV_ITEMS.filter(
    (item) => !item.isHidden && canAccessNavigationItem(item, permissions, canSeePackages),
  ).map((item) => {
    const visibleChildren = item.children?.filter((child) => canAccessRule(child, permissions, canSeePackages));
    const defaultChildHref = visibleChildren?.[0]?.href;

    return {
      ...item,
      href: defaultChildHref ?? item.href,
      children: visibleChildren,
    };
  });

  return {
    mainItems: visibleItems,
    managementItems: [] as AppNavigationItem[],
    bottomNavItems: visibleItems.filter((item) => item.bottomNav),
  };
}

function toUrlSearchParams(
  input?: NavigationQueryRecord | URLSearchParams | Iterable<[string, string]>,
): URLSearchParams {
  if (!input) return new URLSearchParams();
  if (input instanceof URLSearchParams) return new URLSearchParams(input);

  if (typeof input === "object" && Symbol.iterator in input) {
    return new URLSearchParams(Array.from(input as Iterable<[string, string]>));
  }

  const params = new URLSearchParams();
  Object.entries(input as NavigationQueryRecord).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry != null) params.append(key, entry);
      });
      return;
    }

    if (value != null) params.set(key, value);
  });
  return params;
}

export function buildNavigationHref(
  href: string,
  searchParams?: NavigationQueryRecord | URLSearchParams | Iterable<[string, string]>,
): string {
  const params = toUrlSearchParams(searchParams);
  const query = params.toString();
  return query ? `${href}?${query}` : href;
}
