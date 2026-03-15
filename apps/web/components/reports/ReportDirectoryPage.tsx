"use client";

import Link from "next/link";
import { ReportShell } from "@/components/reports/ReportShell";
import { useLang } from "@/context/LangContext";
import { usePermissions } from "@/hooks/usePermissions";
import {
  getVisibleReportDirectorySection,
  getVisibleReportDirectorySections,
  type ReportDirectoryItem,
  type ReportDirectorySection,
} from "@/lib/analytics";

function ReportItemCard({
  item,
  title,
  description,
}: {
  item: ReportDirectoryItem;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={item.href}
      className="group rounded-xl2 border border-border bg-surface p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
    >
      <div className="text-sm font-semibold text-text group-hover:text-primary">{title}</div>
      <p className="mt-1 text-xs text-muted">{description}</p>
    </Link>
  );
}

function ReportSectionBlock({
  section,
  t,
  showCategoryLink,
}: {
  section: ReportDirectorySection;
  t: (key: string) => string;
  showCategoryLink: boolean;
}) {
  return (
    <section key={section.id} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t(section.titleKey)}</h2>
          <p className="text-sm text-muted">{t(section.descriptionKey)}</p>
        </div>
        {showCategoryLink ? (
          <Link
            href={section.href}
            className="inline-flex h-10 items-center rounded-xl border border-primary/20 bg-primary/10 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
          >
            {t("reportsDirectory.actions.openCategory")}
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {section.items.map((item) => (
          <ReportItemCard
            key={item.id}
            item={item}
            title={t(item.titleKey)}
            description={t(item.descriptionKey)}
          />
        ))}
      </div>
    </section>
  );
}

export default function ReportDirectoryPage({ sectionId }: { sectionId?: string }) {
  const { t } = useLang();
  const { permissions } = usePermissions();

  const sections = getVisibleReportDirectorySections(permissions);
  const section = sectionId ? getVisibleReportDirectorySection(sectionId, permissions) : null;

  if (sectionId && !section) {
    return (
      <ReportShell
        title={t("reportsDirectory.center.title")}
        description={t("reportsDirectory.center.description")}
        showAiAction={false}
      >
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted shadow-glow">
          {t("reportsDirectory.center.noAccess")}
        </div>
      </ReportShell>
    );
  }

  if (section) {
    return (
      <ReportShell
        title={t(section.titleKey)}
        description={t(section.descriptionKey)}
        showAiAction={false}
      >
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-glow">
            <div className="text-sm font-semibold text-text">{t("reportsDirectory.center.overviewTitle")}</div>
            <p className="mt-1 text-sm text-muted">{t("reportsDirectory.center.overviewDescription")}</p>
          </div>
          <Link
            href="/reports"
            className="rounded-2xl border border-primary/20 bg-primary/10 p-5 shadow-glow transition-colors hover:bg-primary/15"
          >
            <div className="text-sm font-semibold text-text">{t("reportsDirectory.actions.backToCenter")}</div>
            <p className="mt-1 text-sm text-muted">{t("reportsDirectory.center.description")}</p>
          </Link>
        </section>

        <ReportSectionBlock section={section} t={t} showCategoryLink={false} />
      </ReportShell>
    );
  }

  return (
    <ReportShell
      title={t("reportsDirectory.center.title")}
      description={t("reportsDirectory.center.description")}
      showAiAction={false}
    >
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-glow">
          <div className="text-sm font-semibold text-text">{t("reportsDirectory.center.overviewTitle")}</div>
          <p className="mt-1 text-sm text-muted">{t("reportsDirectory.center.overviewDescription")}</p>
        </div>
        <Link
          href="/chat"
          className="rounded-2xl border border-primary/20 bg-primary/10 p-5 shadow-glow transition-colors hover:bg-primary/15"
        >
          <div className="text-sm font-semibold text-text">{t("reportsDirectory.center.aiTitle")}</div>
          <p className="mt-1 text-sm text-muted">{t("reportsDirectory.center.aiDescription")}</p>
        </Link>
      </section>

      <div className="space-y-6">
        {sections.map((visibleSection) => (
          <ReportSectionBlock
            key={visibleSection.id}
            section={visibleSection}
            t={t}
            showCategoryLink
          />
        ))}
      </div>
    </ReportShell>
  );
}
