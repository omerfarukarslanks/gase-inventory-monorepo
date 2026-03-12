import type { PermissionName } from "@/lib/authz";

export type AppNavigationSection = "main" | "management";

export type AppNavigationItem = {
  id: string;
  href: string;
  labelKey: string;
  icon: string;
  section: AppNavigationSection;
  badge?: string;
  permission?: PermissionName;
  anyPermission?: PermissionName[];
  requiresWholesale?: boolean;
  bottomNav?: boolean;
  visibleInNav?: boolean;
};

const APP_NAV_ITEMS: AppNavigationItem[] = [
  { id: "dashboard", href: "/dashboard", labelKey: "nav.dashboard", icon: "D", section: "main", bottomNav: true },
  { id: "products", href: "/products", labelKey: "nav.products", icon: "U", section: "main", permission: "PRODUCT_READ" },
  { id: "product-packages", href: "/product-packages", labelKey: "nav.packages", icon: "PK", section: "main", requiresWholesale: true },
  {
    id: "stock",
    href: "/stock",
    labelKey: "nav.stock",
    icon: "S",
    section: "main",
    badge: "3",
    permission: "STOCK_LIST_READ",
    bottomNav: true,
  },
  { id: "sales", href: "/sales", labelKey: "nav.sales", icon: "TL", section: "main", permission: "SALE_READ", bottomNav: true },
  { id: "chat", href: "/chat", labelKey: "nav.chat", icon: "AI", section: "main", permission: "AI_CHAT", visibleInNav: false },
  {
    id: "attributes",
    href: "/attributes",
    labelKey: "nav.attributes",
    icon: "O",
    section: "management",
    permission: "PRODUCT_ATTRIBUTE_READ",
  },
  {
    id: "product-categories",
    href: "/product-categories",
    labelKey: "nav.productCategories",
    icon: "UK",
    section: "management",
    permission: "PRODUCT_CATEGORY_READ",
  },
  { id: "stores", href: "/stores", labelKey: "nav.stores", icon: "M", section: "management", permission: "STORE_VIEW" },
  { id: "suppliers", href: "/suppliers", labelKey: "nav.suppliers", icon: "T", section: "management", permission: "SUPPLIER_READ" },
  { id: "customers", href: "/customers", labelKey: "nav.customers", icon: "C", section: "management", permission: "CUSTOMER_READ" },
  { id: "users", href: "/users", labelKey: "nav.users", icon: "K", section: "management", permission: "USER_READ" },
  {
    id: "permissions",
    href: "/permissions",
    labelKey: "nav.permissions",
    icon: "YT",
    section: "management",
    permission: "PERMISSION_MANAGE",
  },
  {
    id: "reports",
    href: "/reports",
    labelKey: "nav.reports",
    icon: "R",
    section: "management",
    anyPermission: ["REPORT_SALES_READ", "REPORT_STOCK_READ", "REPORT_FINANCIAL_READ"],
    bottomNav: true,
  },
];

export function matchesNavigationPath(item: AppNavigationItem, pathname: string): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function findNavigationItem(pathname: string): AppNavigationItem | undefined {
  return APP_NAV_ITEMS.find((item) => matchesNavigationPath(item, pathname));
}

export function canAccessNavigationItem(
  item: AppNavigationItem,
  permissions: string[],
  canSeePackages: boolean,
): boolean {
  if (item.requiresWholesale && !canSeePackages) return false;
  if (item.permission && !permissions.includes(item.permission)) return false;
  if (item.anyPermission && !item.anyPermission.some((permission) => permissions.includes(permission))) return false;
  return true;
}

export function getVisibleNavigation(permissions: string[], canSeePackages: boolean) {
  const visibleItems = APP_NAV_ITEMS.filter(
    (item) => item.visibleInNav !== false && canAccessNavigationItem(item, permissions, canSeePackages),
  );

  return {
    mainItems: visibleItems.filter((item) => item.section === "main"),
    managementItems: visibleItems.filter((item) => item.section === "management"),
    bottomNavItems: visibleItems.filter((item) => item.bottomNav),
  };
}
