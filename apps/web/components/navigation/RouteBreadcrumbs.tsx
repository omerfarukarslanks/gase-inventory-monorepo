"use client";

import Link from "next/link";
import { useLang } from "@/context/LangContext";
import { useAppNavigation } from "@/hooks/useAppNavigation";

export default function RouteBreadcrumbs() {
  const { t } = useLang();
  const { breadcrumbItems } = useAppNavigation();

  if (breadcrumbItems.length < 2) return null;

  return (
    <nav aria-label={t("shell.breadcrumbsLabel")} className="mb-4">
      <ol className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <li key={item.key} className="flex min-w-0 items-center gap-2">
              {isLast ? (
                <span className="truncate font-semibold text-text">{t(item.labelKey)}</span>
              ) : (
                <Link href={item.href} className="truncate transition-colors hover:text-text">
                  {t(item.labelKey)}
                </Link>
              )}
              {!isLast ? <span className="text-border">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
