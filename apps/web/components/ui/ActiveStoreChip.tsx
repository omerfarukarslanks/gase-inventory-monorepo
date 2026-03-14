"use client";

import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { useStores } from "@/hooks/useStores";
import { useSessionProfile } from "@/hooks/useSessionProfile";
import { useLang } from "@/context/LangContext";

type ActiveStoreChipProps = {
  className?: string;
  compact?: boolean;
};

export default function ActiveStoreChip({ className, compact = false }: ActiveStoreChipProps) {
  const { t } = useLang();
  const stores = useStores();
  const { activeStoreId } = useSessionProfile();

  const activeStoreName = useMemo(
    () => stores.find((store) => store.id === activeStoreId)?.name ?? activeStoreId,
    [stores, activeStoreId],
  );

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-xl2 border border-border bg-surface px-3 py-2 text-left shadow-sm",
        className,
      )}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
        MG
      </span>
      <div className="min-w-0">
        {!compact && <div className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">{t("shell.activeStore")}</div>}
        <div className="truncate text-sm font-medium text-text">{activeStoreName || t("shell.noActiveStore")}</div>
      </div>
    </div>
  );
}
