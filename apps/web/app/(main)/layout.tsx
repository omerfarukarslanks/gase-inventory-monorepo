"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/ui/Sidebar";
import Topbar from "@/components/ui/Topbar";
import { getMe } from "@/app/auth/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    getMe(token)
      .then((user) => localStorage.setItem("user", JSON.stringify(user)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="flex">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        <div className="min-w-0 flex-1">
          <Topbar />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
