"use client";

import Link from "next/link";
import { ReportShell } from "@/components/reports/ReportShell";
import { REPORT_DIRECTORY } from "@/lib/analytics";

export default function ReportsPage() {
  return (
    <ReportShell
      title="Rapor Merkezi"
      description="Satis, stok, finans ve musteri analitiklerini tek merkezden yonetin."
      showAiAction={false}
    >
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-glow">
          <div className="text-sm font-semibold text-text">Hazir analitik akislari</div>
          <p className="mt-1 text-sm text-muted">
            Tum report routelari ortak filtre, export ve AI yorum katmanina tasindi.
          </p>
        </div>
        <Link
          href="/chat"
          className="rounded-2xl border border-primary/20 bg-primary/10 p-5 shadow-glow transition-colors hover:bg-primary/15"
        >
          <div className="text-sm font-semibold text-text">AI Copilot</div>
          <p className="mt-1 text-sm text-muted">
            Mevcut rapor baglamini kullanarak yorum, ozet ve aksiyon onerisi alin.
          </p>
        </Link>
      </section>

      <div className="space-y-6">
        {REPORT_DIRECTORY.map((section) => (
          <section key={section.id} className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{section.title}</h2>
              <p className="text-sm text-muted">{section.description}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-xl2 border border-border bg-surface p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="text-sm font-semibold text-text group-hover:text-primary">{item.title}</div>
                  <p className="mt-1 text-xs text-muted">{item.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </ReportShell>
  );
}
