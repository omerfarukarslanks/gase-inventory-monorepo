"use client";

import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getWaveStatusVariant } from "@/components/warehouse/status";
import { formatDate } from "@/lib/format";
import { useLang } from "@/context/LangContext";
import type { Wave } from "@/lib/warehouse";

type WaveDetailDrawerProps = {
  open: boolean;
  loading: boolean;
  acting: boolean;
  wave: Wave | null;
  warehouseLabel: string;
  canManage: boolean;
  onClose: () => void;
  onStart: () => Promise<void>;
  onComplete: () => Promise<void>;
};

export default function WaveDetailDrawer({
  open,
  loading,
  acting,
  wave,
  warehouseLabel,
  canManage,
  onClose,
  onStart,
  onComplete,
}: WaveDetailDrawerProps) {
  const { t } = useLang();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={t("warehouse.waves.detailsTitle")}
      description={wave?.code ?? wave?.id}
      closeDisabled={acting}
      mobileFullscreen
      className="!max-w-[680px]"
      footer={(
        <div className="flex items-center justify-between gap-2">
          <Button label={t("common.close")} onClick={onClose} variant="secondary" disabled={acting} />
          <div className="flex items-center gap-2">
            {canManage && wave?.status === "OPEN" ? (
              <Button
                label={acting ? t("warehouse.waves.startingAction") : t("warehouse.waves.startAction")}
                onClick={() => void onStart()}
                variant="primarySoft"
                disabled={acting}
                loading={acting}
              />
            ) : null}
            {canManage && wave?.status === "IN_PROGRESS" ? (
              <Button
                label={acting ? t("warehouse.waves.completingAction") : t("warehouse.waves.completeAction")}
                onClick={() => void onComplete()}
                variant="primarySolid"
                disabled={acting}
                loading={acting}
              />
            ) : null}
          </div>
        </div>
      )}
    >
      <div className="space-y-4 p-5">
        {loading ? (
          <p className="text-sm text-muted">{t("warehouse.waves.detailsLoading")}</p>
        ) : !wave ? (
          <p className="text-sm text-muted">{t("warehouse.waves.detailsNotFound")}</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                label={t(`warehouse.waves.statuses.${wave.status}`)}
                variant={getWaveStatusVariant(wave.status)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.warehouse")}</p>
                <p className="mt-2 text-sm font-semibold text-text">{warehouseLabel}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("warehouse.waves.codeLabel")}</p>
                <p className="mt-2 text-sm font-semibold text-text">{wave.code}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.start")}</p>
                <p className="mt-2 text-sm text-text2">{formatDate(wave.startedAt ?? undefined)}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.completedAt")}</p>
                <p className="mt-2 text-sm text-text2">{formatDate(wave.completedAt ?? undefined)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.note")}</p>
              <p className="mt-2 text-sm text-text2">{wave.notes?.trim() || "-"}</p>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}
