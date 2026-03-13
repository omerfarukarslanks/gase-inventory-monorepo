"use client";

import Link from "next/link";

type SupplyStoreBlockerProps = {
  title?: string;
  description?: string;
};

export default function SupplyStoreBlocker({
  title = "Aktif magaza baglami gerekli",
  description = "Tedarik islemleri tek magaza baglaminda calisir. Devam etmek icin oturumunuzda aktif bir magaza olmalidir.",
}: SupplyStoreBlockerProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
      <h1 className="text-xl font-semibold text-text">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>
      <div className="mt-4">
        <Link href="/settings/stores" className="text-sm font-semibold text-primary hover:underline">
          Magazalari goruntule
        </Link>
      </div>
    </div>
  );
}
