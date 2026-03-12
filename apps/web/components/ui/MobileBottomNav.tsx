"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { useLang } from "@/context/LangContext";
import { useAppNavigation } from "@/hooks/useAppNavigation";

type MobileBottomNavProps = {
  onOpenMenu: () => void;
};

export default function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps) {
  const { t } = useLang();
  const { bottomNavItems, isActiveItem } = useAppNavigation();
  const visibleBottomItems = bottomNavItems.slice(0, 4);

  return (
    <nav
      aria-label={t("shell.navigationMenu")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-2 pt-2 backdrop-blur md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
    >
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${visibleBottomItems.length + 1}, minmax(0, 1fr))` }}>
        {visibleBottomItems.map((item) => {
          const active = isActiveItem(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 rounded-xl2 px-2 py-2 text-[11px] font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-text2 hover:bg-surface2",
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-xl border text-[11px] font-semibold",
                  active ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-surface2 text-text",
                )}
              >
                {item.icon}
              </span>
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onOpenMenu}
          className="flex min-w-0 cursor-pointer flex-col items-center gap-1 rounded-xl2 px-2 py-2 text-[11px] font-medium text-text2 transition-colors hover:bg-surface2"
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-surface2 text-text">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </span>
          <span className="truncate">{t("shell.more")}</span>
        </button>
      </div>
    </nav>
  );
}
