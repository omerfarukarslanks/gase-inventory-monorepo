"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { logout } from "@/app/auth/auth";
import { canAccessTenantPages, getSessionUserRole } from "@/lib/authz";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: "D" },
  { href: "/products", label: "Urunler", icon: "U" },
  { href: "/stock", label: "Stok Yonetimi", icon: "S", badge: "3" },
  { href: "/sales", label: "Satislar", icon: "TL" },
  { href: "/chat", label: "AI Chat", icon: "AI" },
];

const adminItems = [
  { href: "/attributes", label: "Ozellikler", icon: "O" },
  { href: "/stores", label: "Magazalar", icon: "M" },
  { href: "/users", label: "Kullanicilar", icon: "K" },
  { href: "/reports", label: "Raporlar", icon: "R" },
];

type LocalUser = {
  name?: string;
  surname?: string;
  role?: string;
};

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [displayName, setDisplayName] = useState("Kullanici");
  const [displayRole, setDisplayRole] = useState("Admin");
  const [canSeeTenantManagement, setCanSeeTenantManagement] = useState(true);

  useEffect(() => {
    try {
      setCanSeeTenantManagement(canAccessTenantPages(getSessionUserRole()));
      const rawUser = localStorage.getItem("user");
      if (!rawUser) {
        setDisplayName("Kullanici");
        setDisplayRole("User");
        return;
      }
      const parsed = JSON.parse(rawUser) as LocalUser;
      const fullName = [parsed.name, parsed.surname].filter(Boolean).join(" ").trim();
      setDisplayName(fullName || "Kullanici");
      setDisplayRole(parsed.role || "Admin");
    } catch {
      setDisplayName("Kullanici");
      setDisplayRole("User");
      setCanSeeTenantManagement(false);
    }
  }, []);

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
        "sticky top-0 h-screen border-r border-border bg-surface transition-all duration-200",
        collapsed ? "w-[76px]" : "w-[260px]",
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
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
          {"<<"}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn("h-9 w-9 rounded-xl2 border border-border bg-surface hover:bg-surface2", !collapsed && "hidden")}
        >
          {">>"}
        </button>
      </div>

      <div className="px-3 py-2">
        <div className={cn("px-3 py-2 text-[10px] font-semibold tracking-widest text-muted", collapsed && "text-center")}>
          {!collapsed ? "ANA MENU" : "*"}
        </div>

        <div className="space-y-1">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
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
                  <span className="flex-1">{it.label}</span>
                  {it.badge && (
                    <span className="rounded-full bg-error px-2 py-0.5 text-[10px] font-bold text-white">{it.badge}</span>
                  )}
                </>
              )}
            </Link>
          ))}
        </div>

        <div className={cn("mt-5 px-3 py-2 text-[10px] font-semibold tracking-widest text-muted", collapsed && "text-center")}>
          {!collapsed ? "YONETIM" : "*"}
        </div>

        <div className="space-y-1">
          {adminItems
            .filter(
              (it) =>
                canSeeTenantManagement ||
                (it.href !== "/stores" && it.href !== "/users" && it.href !== "/attributes"),
            )
            .map((it) => (
            <Link
              key={it.href}
              href={it.href}
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
              {!collapsed && <span className="flex-1">{it.label}</span>}
            </Link>
            ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3" ref={menuRef}>
        {menuOpen && (
          <div className="mb-2 rounded-xl2 border border-border bg-surface p-1 shadow-xl">
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-text hover:bg-surface2"
            >
              Profil
            </Link>
            <button
              type="button"
              onClick={onLogout}
              disabled={loggingOut}
              className="block w-full rounded-lg px-3 py-2 cursor-pointer text-left text-sm text-error hover:bg-error/10 disabled:opacity-60"
            >
              {loggingOut ? "Cikis yapiliyor..." : "Logout"}
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
