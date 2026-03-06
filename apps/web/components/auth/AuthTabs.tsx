"use client";

import { useRouter, usePathname } from "next/navigation";
import Tabs, { type TabItem } from "../ui/Tabs";
import { useLang } from "@/context/LangContext";

export default function AuthTabs() {
  const { t } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const mode = pathname?.includes("/signup") ? "signup" : "login";

  const tabs: TabItem[] = [
    { key: "login", label: t("auth.login"), onClick: () => router.push("/auth/login") },
    { key: "signup", label: t("auth.signup"), onClick: () => router.push("/auth/signup") },
  ];

  return <Tabs items={tabs} activeKey={mode} className="mb-7" />;
}
