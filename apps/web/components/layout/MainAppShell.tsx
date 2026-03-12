"use client";

import { useEffect, useState } from "react";
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
import { cn } from "@/lib/cn";

export default function MainAppShell({ children }: { children: React.ReactNode }) {
  const { t } = useLang();
  const mode = useViewportMode();
  const [collapsed, setCollapsed] = useState(false);
  const [tabletNavOpen, setTabletNavOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = readSessionToken();
    if (!token) return;

    setAuthCookie(token);
    getMe(token)
      .then((user) => setSessionUser(user))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    if (mode === "desktop") {
      setTabletNavOpen(false);
      setMobileMenuOpen(false);
    }
    if (mode === "tablet") {
      setMobileMenuOpen(false);
    }
    if (mode === "mobile") {
      setTabletNavOpen(false);
    }
  }, [mode]);

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
    <div className="min-h-screen overflow-x-clip bg-bg text-text">
      <div className="flex min-h-screen">
        {mode === "desktop" ? <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mode="desktop" /> : null}

        <div className="min-w-0 flex-1">
          <Topbar mode={mode} onOpenNavigation={mode === "tablet" ? () => setTabletNavOpen(true) : undefined} />
          <main className={cn("px-4 py-4 md:px-6 md:py-6", mode === "mobile" && "pb-28")}>{children}</main>
        </div>
      </div>

      {mode === "tablet" ? (
        <Drawer open={tabletNavOpen} onClose={() => setTabletNavOpen(false)} side="left" title={t("shell.menuTitle")}>
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
            title={t("shell.menuTitle")}
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
