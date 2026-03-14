"use client";

import { useEffect, useState } from "react";
import RouteBreadcrumbs from "@/components/navigation/RouteBreadcrumbs";
import Sidebar from "@/components/ui/Sidebar";
import Topbar from "@/components/ui/Topbar";
import Drawer from "@/components/ui/Drawer";
import MobileBottomNav from "@/components/ui/MobileBottomNav";
import LangToggle from "@/components/ui/LangToggle";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { getMe } from "@/app/auth/auth";
import { setAuthCookie } from "@/lib/cookie";
import { readSessionToken, setSessionUser } from "@/lib/session";
import { useViewportMode } from "@/hooks/useViewportMode";
import { useLang } from "@/context/LangContext";
import { AiReportContextProvider } from "@/context/AiReportContext";
import { cn } from "@/lib/cn";
import type { ViewportMode } from "@/hooks/useViewportMode";

type ResponsiveChromeProps = {
  children: React.ReactNode;
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  mode: ViewportMode;
  quickPreferences: React.ReactNode;
  menuTitle: string;
};

function ResponsiveChrome({ children, collapsed, setCollapsed, mode, quickPreferences, menuTitle }: ResponsiveChromeProps) {
  const [tabletNavOpen, setTabletNavOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-clip bg-bg text-text">
      <div className="flex min-h-screen">
        {mode === "desktop" ? <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mode="desktop" /> : null}

        <div className="min-w-0 flex-1">
          <Topbar mode={mode} onOpenNavigation={mode === "tablet" ? () => setTabletNavOpen(true) : undefined} />
          <main className={cn("px-4 py-4 md:px-6 md:py-6", mode === "mobile" && "pb-28")}>
            <RouteBreadcrumbs />
            {children}
          </main>
        </div>
      </div>

      {mode === "tablet" ? (
        <Drawer open={tabletNavOpen} onClose={() => setTabletNavOpen(false)} side="left" title={menuTitle}>
          <div className="h-full min-h-0">
            <Sidebar mode="panel" onNavigate={() => setTabletNavOpen(false)} footerExtras={quickPreferences} />
          </div>
        </Drawer>
      ) : null}

      {mode === "mobile" ? (
        <>
          <Drawer
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            side="bottom"
            title={menuTitle}
            mobileFullscreen
          >
            <div className="h-full min-h-0">
              <Sidebar mode="sheet" onNavigate={() => setMobileMenuOpen(false)} footerExtras={quickPreferences} />
            </div>
          </Drawer>
          <MobileBottomNav onOpenMenu={() => setMobileMenuOpen(true)} />
        </>
      ) : null}
    </div>
  );
}

export default function MainAppShell({ children }: { children: React.ReactNode }) {
  const { t } = useLang();
  const mode = useViewportMode();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar_collapsed") === "1";
  });

  useEffect(() => {
    const token = readSessionToken();
    if (!token) return;

    setAuthCookie(token);
    getMe(token)
      .then((user) => setSessionUser(user))
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const quickPreferences = (
    <div className="rounded-xl2 border border-border bg-surface2/60 p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("shell.quickPreferences")}</div>
      <div className="flex items-center gap-2">
        <LangToggle />
        <ThemeToggle fixed={false} className="rounded-xl2" />
      </div>
    </div>
  );

  return (
    <AiReportContextProvider>
      <ResponsiveChrome
        key={mode}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mode={mode}
        quickPreferences={quickPreferences}
        menuTitle={t("shell.menuTitle")}
      >
        {children}
      </ResponsiveChrome>
    </AiReportContextProvider>
  );
}
