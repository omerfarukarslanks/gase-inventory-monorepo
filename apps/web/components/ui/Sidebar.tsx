"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { logout } from "@/app/auth/auth";
import { clearAuthCookie } from "@/lib/cookie";
import { clearSessionStorage, readSessionToken } from "@/lib/session";
import { cn } from "@/lib/cn";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useSessionProfile } from "@/hooks/useSessionProfile";
import { useLang } from "@/context/LangContext";
import type { AppNavigationChild, AppNavigationItem } from "@/lib/navigation";

type SidebarMode = "desktop" | "panel" | "sheet";

type SidebarProps = {
  collapsed?: boolean;
  setCollapsed?: (value: boolean) => void;
  mode?: SidebarMode;
  onNavigate?: () => void;
  footerExtras?: ReactNode;
};

type NavigationSectionProps = {
  title: string;
  items: AppNavigationItem[];
  collapsed: boolean;
  openGroupKey: string | null;
  activeChildKey?: string;
  onToggleGroup: (key: string) => void;
  onNavigate?: () => void;
  isActiveItem: (href: string) => boolean;
  t: (key: string) => string;
};

function NavigationChildLink({
  child,
  active,
  onNavigate,
  t,
}: {
  child: AppNavigationChild;
  active: boolean;
  onNavigate?: () => void;
  t: (key: string) => string;
}) {
  return (
    <li>
      <Link
        href={child.href}
        aria-current={active ? "page" : undefined}
        onClick={() => onNavigate?.()}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
          active ? "bg-primary/10 font-medium text-primary" : "text-text2 hover:bg-surface2 hover:text-text",
        )}
      >
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", active ? "bg-primary" : "bg-border")} />
        <span className="truncate">{t(child.labelKey)}</span>
      </Link>
    </li>
  );
}

function NavigationSection({
  title,
  items,
  collapsed,
  openGroupKey,
  activeChildKey,
  onToggleGroup,
  onNavigate,
  isActiveItem,
  t,
}: NavigationSectionProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className={cn("px-3 py-2 text-[10px] font-semibold tracking-widest text-muted", collapsed && "text-center")}>
        {!collapsed ? title : "*"}
      </div>

      <ul className="space-y-1">
        {items.map((item) => {
          const active = isActiveItem(item.href);
          const hasChildren = !collapsed && !!item.children?.length;
          const groupOpen = hasChildren && openGroupKey === item.key;

          return (
            <li key={item.key}>
              <div
                className={cn(
                  "rounded-xl2 border transition-colors",
                  active
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-transparent text-text2 hover:border-border hover:bg-surface2",
                )}
              >
                <div className="flex items-center gap-2">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => onNavigate?.()}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm"
                  >
                    <span
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-xl2 border",
                        active ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-surface2 text-text",
                      )}
                    >
                      {item.icon}
                    </span>
                    {!collapsed ? (
                      <>
                        <span className="flex-1 truncate">{t(item.labelKey)}</span>
                        {item.badge && (
                          <span className="rounded-full bg-error px-2 py-0.5 text-[10px] font-bold text-white">{item.badge}</span>
                        )}
                      </>
                    ) : null}
                  </Link>

                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => onToggleGroup(item.key)}
                      aria-label={`${t(groupOpen ? "shell.collapseGroup" : "shell.expandGroup")}: ${t(item.labelKey)}`}
                      aria-expanded={groupOpen}
                      className="me-2 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-text2 transition-colors hover:bg-surface"
                    >
                      <span className={cn("inline-block select-none transition-transform", groupOpen && "rotate-90")}>
                        {">"}
                      </span>
                    </button>
                  ) : null}
                </div>

                {hasChildren && groupOpen ? (
                  <ul className="space-y-1 border-t border-border/70 px-2 py-2">
                    {item.children?.map((child) => (
                      <NavigationChildLink
                        key={child.key}
                        child={child}
                        active={activeChildKey === child.key}
                        onNavigate={onNavigate}
                        t={t}
                      />
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Sidebar({
  collapsed = false,
  setCollapsed,
  mode = "desktop",
  onNavigate,
  footerExtras,
}: SidebarProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { t } = useLang();
  const { mainItems, managementItems, activeItem, activeChild, isActiveItem } = useAppNavigation();
  const { displayName, displayRole, initials } = useSessionProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [expandedGroupKey, setExpandedGroupKey] = useState<string | null>(null);

  const isDesktop = mode === "desktop";
  const isCollapsed = isDesktop ? collapsed : false;
  const activeGroupKey = activeItem?.children?.length ? activeItem.key : null;
  const openGroupKey = isCollapsed ? null : activeGroupKey ?? expandedGroupKey;

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (isCollapsed) {
      setExpandedGroupKey(null);
      return;
    }

    if (activeGroupKey) {
      setExpandedGroupKey(activeGroupKey);
    }
  }, [activeGroupKey, isCollapsed]);

  const onLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      const token = readSessionToken();
      if (token) await logout(token);
    } catch {
      // local session is still cleared below
    } finally {
      clearSessionStorage();
      clearAuthCookie();
      setMenuOpen(false);
      setLoggingOut(false);
      onNavigate?.();
      router.push("/auth/login");
    }
  };

  const onToggleGroup = (key: string) => {
    if (isCollapsed || activeGroupKey === key) return;
    setExpandedGroupKey((current) => (current === key ? null : key));
  };

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col bg-surface",
        isDesktop
          ? cn(
              "sticky top-0 h-screen border-e border-border transition-all duration-200",
              isCollapsed ? "w-19" : "w-65",
            )
          : "h-full w-full",
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl2 bg-primary/15 text-primary">
            SP
          </div>
          {!isCollapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate font-semibold text-text">StockPulse</div>
              <div className="truncate text-[10px] tracking-widest text-muted">PRO PLAN</div>
            </div>
          )}
        </div>

        {isDesktop && setCollapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="h-9 w-9 shrink-0 rounded-xl2 border border-border bg-surface text-text transition-colors hover:bg-surface2"
          >
            <span className="inline-block select-none rtl:scale-x-[-1]">{collapsed ? ">>" : "<<"}</span>
          </button>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-2 pb-4" aria-label={t("nav.mainMenu")}>
        <NavigationSection
          title={t("nav.mainMenu")}
          items={mainItems}
          collapsed={isCollapsed}
          openGroupKey={openGroupKey}
          activeChildKey={activeChild?.key}
          onToggleGroup={onToggleGroup}
          onNavigate={onNavigate}
          isActiveItem={isActiveItem}
          t={t}
        />

        {managementItems.length > 0 ? (
          <div className="mt-5">
            <NavigationSection
              title={t("nav.management")}
              items={managementItems}
              collapsed={isCollapsed}
              openGroupKey={openGroupKey}
              activeChildKey={activeChild?.key}
              onToggleGroup={onToggleGroup}
              onNavigate={onNavigate}
              isActiveItem={isActiveItem}
              t={t}
            />
          </div>
        ) : null}
      </nav>

      <div className="shrink-0 border-t border-border bg-surface p-3" ref={menuRef}>
        {footerExtras ? <div className="mb-3">{footerExtras}</div> : null}

        {menuOpen && (
          <div className="mb-2 rounded-xl2 border border-border bg-surface p-1 shadow-xl">
            <Link
              href="/profile"
              onClick={() => {
                setMenuOpen(false);
                onNavigate?.();
              }}
              className="block rounded-lg px-3 py-2 text-sm text-text hover:bg-surface2"
            >
              {t("nav.profile")}
            </Link>
            <button
              type="button"
              onClick={() => void onLogout()}
              disabled={loggingOut}
              className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-error hover:bg-error/10 disabled:opacity-60"
            >
              {loggingOut ? t("nav.loggingOut") : t("nav.logout")}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex w-full items-center gap-3 rounded-xl2 border border-border bg-surface2 p-3 text-left"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl2 bg-accent/15 font-semibold text-accent">
            {initials}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold text-text">{displayName}</div>
              <div className="truncate text-xs text-muted">{displayRole}</div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
