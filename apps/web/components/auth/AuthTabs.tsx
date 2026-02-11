"use client";

import { useRouter, usePathname } from "next/navigation";
import Tabs, { type TabItem } from "../ui/Tabs";

export default function AuthTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const mode = pathname?.includes("/signup") ? "signup" : "login";

  const tabs: TabItem[] = [
    { key: "login", label: "Giriş Yap", onClick: () => router.push("/auth/login") },
    { key: "signup", label: "Kayıt Ol", onClick: () => router.push("/auth/signup") },
  ];

  return <Tabs items={tabs} activeKey={mode} className="mb-7" />;
}
