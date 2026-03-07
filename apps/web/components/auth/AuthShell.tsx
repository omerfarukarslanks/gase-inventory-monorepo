"use client";

import React from "react";
import AuthLeftPanel from "./AuthLeftPanel";
import ThemeToggle from "../theme/ThemeToggle";
import AuthBackground from "./AuthBackground";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-text transition-colors">
      <AuthBackground />
      <ThemeToggle />

      <div className="relative z-10 flex min-h-screen">
        {/* Left panel hidden on <lg */}
        <aside className="hidden lg:block lg:w-[45%] border-e border-border bg-gradient-to-br from-primary/10 to-transparent">
          <AuthLeftPanel />
        </aside>

        <main className="flex-1 flex items-center justify-center px-5 py-8">
          <div className="w-full max-w-[400px] animate-su">{children}</div>
        </main>
      </div>
    </div>
  );
}
