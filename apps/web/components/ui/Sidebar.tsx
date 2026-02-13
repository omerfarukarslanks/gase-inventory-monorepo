"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/products", label: "Ürünler", icon: "◻︎" },
  { href: "/stock", label: "Stok Yönetimi", icon: "📦", badge: "3" },
  { href: "/sales", label: "Satışlar", icon: "₺" },
  { href: "/transfers", label: "Transferler", icon: "⇄" },
];

const adminItems = [
  { href: "/stores", label: "Mağazalar", icon: "🏬" },
  { href: "/users", label: "Kullanıcılar", icon: "👥" },
  { href: "/reports", label: "Raporlar", icon: "📊" },
];

export default function Sidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  return (
    <aside
      className={cn(
        "sticky top-0 h-screen border-r border-border bg-surface transition-all duration-200",
        collapsed ? "w-[76px]" : "w-[260px]"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl2 bg-primary/15 text-primary">
            ≋
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
          «
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn("h-9 w-9 rounded-xl2 border border-border bg-surface hover:bg-surface2", !collapsed && "hidden")}
        >
          »
        </button>
      </div>

      <div className="px-3 py-2">
        <div className={cn("px-3 py-2 text-[10px] font-semibold tracking-widest text-muted", collapsed && "text-center")}>
          {!collapsed ? "ANA MENÜ" : "•"}
        </div>

        <div className="space-y-1">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="flex items-center gap-3 rounded-xl2 border border-transparent px-3 py-2.5 text-sm text-text2 hover:border-border hover:bg-surface2"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl2 border border-border bg-surface2">
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
          {!collapsed ? "YÖNETİM" : "•"}
        </div>

        <div className="space-y-1">
          {adminItems.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="flex items-center gap-3 rounded-xl2 border border-transparent px-3 py-2.5 text-sm text-text2 hover:border-border hover:bg-surface2"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl2 border border-border bg-surface2">
                {it.icon}
              </span>
              {!collapsed && <span className="flex-1">{it.label}</span>}
            </Link>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="flex items-center gap-3 rounded-xl2 border border-border bg-surface2 p-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl2 bg-accent/15 text-accent font-semibold">
            ÖF
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold text-text">Ömer Faruk</div>
              <div className="text-xs text-muted">Admin</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
