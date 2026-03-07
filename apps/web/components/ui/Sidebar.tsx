"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { logout } from "@/app/auth/auth";
import { clearAuthCookie } from "@/lib/cookie";
import type { PermissionName } from "@/lib/authz";
import { useLang } from "@/context/LangContext";

type NavItem = {
  href: string;
  labelKey: string;
  icon: string;
  badge?: string;
  permission?: PermissionName;
  anyPermission?: PermissionName[];
};

const items: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: "D" },
  { href: "/products", labelKey: "nav.products", icon: "U", permission: "PRODUCT_READ" },
  { href: "/product-packages", labelKey: "nav.packages", icon: "PK" },
  { href: "/stock", labelKey: "nav.stock", icon: "S", badge: "3", permission: "STOCK_LIST_READ" },
  { href: "/sales", labelKey: "nav.sales", icon: "TL", permission: "SALE_READ" },
  { href: "/chat", labelKey: "nav.chat", icon: "AI", permission: "AI_CHAT" },
];

const adminItems: NavItem[] = [
  { href: "/attributes", labelKey: "nav.attributes", icon: "O", permission: "PRODUCT_ATTRIBUTE_READ" },
  { href: "/product-categories", labelKey: "nav.productCategories", icon: "UK", permission: "PRODUCT_CATEGORY_READ" },
  { href: "/stores", labelKey: "nav.stores", icon: "M", permission: "STORE_VIEW" },
  { href: "/suppliers", labelKey: "nav.suppliers", icon: "T", permission: "SUPPLIER_READ" },
  { href: "/customers", labelKey: "nav.customers", icon: "C", permission: "CUSTOMER_READ" },
  { href: "/users", labelKey: "nav.users", icon: "K", permission: "USER_READ" },
  { href: "/permissions", labelKey: "nav.permissions", icon: "YT", permission: "PERMISSION_MANAGE" },
  { href: "/reports", labelKey: "nav.reports", icon: "R", anyPermission: ["REPORT_SALES_READ", "REPORT_STOCK_READ", "REPORT_FINANCIAL_READ"] },
];

type LocalUser = {
  name?: string;
  surname?: string;
  role?: string;
  storeType?: string;
  permissions?: string[];
  store?: {
    storeType?: string;
  };
  userStores?: Array<{
    storeType?: string;
    store?: {
      storeType?: string;
    };
  }>;
};

function normalizeStoreType(value?: string | null): "RETAIL" | "WHOLESALE" | null {
  if (!value) return null;
  const normalized = value.toUpperCase();
  if (normalized === "WHOLESALE") return "WHOLESALE";
  if (normalized === "RETAIL") return "RETAIL";
  return null;
}

function resolveUserStoreType(user: LocalUser): "RETAIL" | "WHOLESALE" | null {
  const direct = normalizeStoreType(user.storeType);
  if (direct) return direct;

  const fromStore = normalizeStoreType(user.store?.storeType);
  if (fromStore) return fromStore;

  if (Array.isArray(user.userStores)) {
    for (const item of user.userStores) {
      const fromUserStore = normalizeStoreType(item?.storeType ?? item?.store?.storeType);
      if (fromUserStore) return fromUserStore;
    }
  }

  return null;
}

export default function Sidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [displayName, setDisplayName] = useState(t("nav.dashboard"));
  const [displayRole, setDisplayRole] = useState("Admin");
  const [canSeePackages, setCanSeePackages] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("user");
      if (!rawUser) {
        setDisplayName("User");
        setDisplayRole("User");
        setCanSeePackages(false);
        setUserPermissions([]);
        return;
      }
      const parsed = JSON.parse(rawUser) as LocalUser;
      const fullName = [parsed.name, parsed.surname].filter(Boolean).join(" ").trim();
      setDisplayName(fullName || "User");
      setDisplayRole(parsed.role || "Admin");
      setCanSeePackages(resolveUserStoreType(parsed) === "WHOLESALE");
      setUserPermissions(parsed.permissions ?? []);
    } catch {
      setDisplayName("User");
      setDisplayRole("User");
      setCanSeePackages(false);
      setUserPermissions([]);
    }
  }, []);

  const canSeeItem = (item: NavItem): boolean => {
    if (item.permission && !userPermissions.includes(item.permission)) return false;
    if (item.anyPermission && !item.anyPermission.some((p) => userPermissions.includes(p))) return false;
    return true;
  };

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      setMenuOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const onLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      const token = localStorage.getItem("token");
      if (token) {
        await logout(token);
      }
    } catch {
      // clear local session even if service call fails
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      clearAuthCookie();
      setLoggingOut(false);
      setMenuOpen(false);
      router.push("/auth/login");
    }
  };

  const isActiveItem = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col border-e border-border bg-surface transition-all duration-200",
        collapsed ? "w-19" : "w-65",
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl2 bg-primary/15 text-primary">
            SP
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-semibold text-text">StockPulse</div>
              <div className="text-[10px] tracking-widest text-muted">PRO PLAN</div>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn("h-9 w-9 rounded-xl2 border border-border bg-surface hover:bg-surface2", collapsed && "hidden")}
        >
          <span className="inline-block select-none rtl:transform-[scaleX(-1)]">{"<<"}</span>
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn("h-9 w-9 rounded-xl2 border border-border bg-surface hover:bg-surface2", !collapsed && "hidden")}
        >
          <span className="inline-block select-none rtl:transform-[scaleX(-1)]">{">>"}</span>
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-2 pb-4" aria-label={t("nav.mainMenu")}>
        <div className={cn("px-3 py-2 text-[10px] font-semibold tracking-widest text-muted", collapsed && "text-center")}>
          {!collapsed ? t("nav.mainMenu") : "*"}
        </div>

        <ul className="space-y-1">
          {items
            .filter((it) => canSeeItem(it) && (canSeePackages || it.href !== "/product-packages"))
            .map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={isActiveItem(it.href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl2 border px-3 py-2.5 text-sm transition-colors",
                  isActiveItem(it.href)
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-transparent text-text2 hover:border-border hover:bg-surface2",
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-xl2 border",
                    isActiveItem(it.href)
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-surface2",
                  )}
                >
                  {it.icon}
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1">{t(it.labelKey)}</span>
                    {it.badge && (
                      <span className="rounded-full bg-error px-2 py-0.5 text-[10px] font-bold text-white">{it.badge}</span>
                    )}
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>

        <div className={cn("mt-5 px-3 py-2 text-[10px] font-semibold tracking-widest text-muted", collapsed && "text-center")}>
          {!collapsed ? t("nav.management") : "*"}
        </div>

        <ul className="space-y-1">
          {adminItems.filter(canSeeItem).map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={isActiveItem(it.href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl2 border px-3 py-2.5 text-sm transition-colors",
                  isActiveItem(it.href)
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-transparent text-text2 hover:border-border hover:bg-surface2",
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-xl2 border",
                    isActiveItem(it.href)
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-surface2",
                  )}
                >
                  {it.icon}
                </span>
                {!collapsed && <span className="flex-1">{t(it.labelKey)}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-border bg-surface p-3" ref={menuRef}>
        {menuOpen && (
          <div className="mb-2 rounded-xl2 border border-border bg-surface p-1 shadow-xl">
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-text hover:bg-surface2"
            >
              {t("nav.profile")}
            </Link>
            <button
              type="button"
              onClick={onLogout}
              disabled={loggingOut}
              className="block w-full rounded-lg px-3 py-2 cursor-pointer text-left text-sm text-error hover:bg-error/10 disabled:opacity-60"
            >
              {loggingOut ? t("nav.loggingOut") : t("nav.logout")}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex w-full items-center gap-3 rounded-xl2 border cursor-pointer border-border bg-surface2 p-3 text-left"
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl2 bg-accent/15 font-semibold text-accent">
            {initials || "U"}
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold text-text">{displayName}</div>
              <div className="text-xs text-muted">{displayRole}</div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
