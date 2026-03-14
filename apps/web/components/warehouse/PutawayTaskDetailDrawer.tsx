"use client";

import { useEffect, useMemo, useState } from "react";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getPutawayTaskStatusVariant } from "@/components/warehouse/status";
import { useLang } from "@/context/LangContext";
import { formatDate } from "@/lib/format";
import { getUsers } from "@/lib/users";
import { useUserLabels } from "@/hooks/useUserLabels";
import type { PutawayTask } from "@/lib/warehouse";

type PutawayTaskDetailDrawerProps = {
  open: boolean;
  loading: boolean;
  acting: boolean;
  task: PutawayTask | null;
  warehouseLabel: string;
  warehouseStoreId?: string;
  canManage: boolean;
  onClose: () => void;
  onAssign: (userId: string) => Promise<void>;
  onComplete: () => Promise<void>;
  onCancel: () => Promise<void>;
};

function buildProductLabel(task: PutawayTask, fallback: string) {
  if (task.productName) return `${task.productName}${task.variantName ? ` / ${task.variantName}` : ""}`;
  if (task.variantName) return task.variantName;
  return fallback;
}

export default function PutawayTaskDetailDrawer({
  open,
  loading,
  acting,
  task,
  warehouseLabel,
  warehouseStoreId,
  canManage,
  onClose,
  onAssign,
  onComplete,
  onCancel,
}: PutawayTaskDetailDrawerProps) {
  const { t } = useLang();
  const [userOptions, setUserOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [formError, setFormError] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const userLabels = useUserLabels(task?.assignedToUserId ? [task.assignedToUserId] : []);

  useEffect(() => {
    if (!open || !canManage || !task || task.status !== "PENDING") return;

    let cancelled = false;
    void (async () => {
      setUsersLoading(true);
      try {
        const response = await getUsers({
          page: 1,
          limit: 100,
          storeId: warehouseStoreId || undefined,
          isActive: true,
        });
        if (cancelled) return;
        const options = (response.data ?? []).map((user) => ({
          value: user.id,
          label: [user.name, user.surname].filter(Boolean).join(" ").trim() || user.email || user.id,
        }));
        setUserOptions(options);
      } catch {
        if (!cancelled) setUserOptions([]);
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canManage, open, task, warehouseStoreId]);

  const productLabel = useMemo(
    () => (task ? buildProductLabel(task, t("warehouse.putawayTasks.productUnknown")) : "-"),
    [t, task],
  );

  const destinationLabel = task?.toLocationName
    ? `${task.toLocationName}${task.toLocationCode ? ` / ${task.toLocationCode}` : ""}`
    : (task?.toLocationCode || t("warehouse.putawayTasks.locationUnknown"));

  const assignedLabel = task?.assignedToUserId ? (userLabels[task.assignedToUserId] ?? task.assignedToUserId) : "-";
  const canCancel = canManage && task != null && !["COMPLETED", "CANCELLED"].includes(task.status);
  const canAssign = canManage && task?.status === "PENDING";
  const canComplete = canManage && task?.status === "IN_PROGRESS";

  const handleAssign = async () => {
    if (!selectedUserId) {
      setFormError(t("warehouse.putawayTasks.assigneeRequired"));
      return;
    }
    setFormError("");
    await onAssign(selectedUserId);
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        side="right"
        title={t("warehouse.putawayTasks.detailsTitle")}
        description={task?.id}
        closeDisabled={acting}
        mobileFullscreen
        className="!max-w-[720px]"
        footer={(
          <div className="flex items-center justify-between gap-2">
            <Button label={t("common.close")} onClick={onClose} variant="secondary" disabled={acting} />
            <div className="flex items-center gap-2">
              {canCancel ? (
                <Button label={t("warehouse.putawayTasks.cancelAction")} onClick={() => setCancelOpen(true)} variant="dangerSoft" disabled={acting} />
              ) : null}
              {canAssign ? (
                <Button
                  label={acting ? t("warehouse.putawayTasks.assigningAction") : t("warehouse.putawayTasks.assignAction")}
                  onClick={() => void handleAssign()}
                  variant="primarySoft"
                  disabled={acting || usersLoading}
                  loading={acting}
                />
              ) : null}
              {canComplete ? (
                <Button
                  label={acting ? t("warehouse.putawayTasks.completingAction") : t("warehouse.putawayTasks.completeAction")}
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
            <p className="text-sm text-muted">{t("warehouse.putawayTasks.detailsLoading")}</p>
          ) : !task ? (
            <p className="text-sm text-muted">{t("warehouse.putawayTasks.detailsNotFound")}</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  label={t(`warehouse.putawayTasks.statuses.${task.status}`)}
                  variant={getPutawayTaskStatusVariant(task.status)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.warehouse")}</p>
                  <p className="mt-2 text-sm font-semibold text-text">{warehouseLabel}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.product")}</p>
                  <p className="mt-2 text-sm font-semibold text-text">{productLabel}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("warehouse.putawayTasks.destinationLocation")}</p>
                  <p className="mt-2 text-sm text-text2">{destinationLabel}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("warehouse.putawayTasks.quantityLabel")}</p>
                  <p className="mt-2 text-sm text-text2">{task.quantity}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("warehouse.putawayTasks.goodsReceipt")}</p>
                  <p className="mt-2 text-sm text-text2">{task.goodsReceiptId?.trim() || "-"}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("warehouse.putawayTasks.assignee")}</p>
                  <p className="mt-2 text-sm text-text2">{assignedLabel}</p>
                </div>
              </div>

              {canAssign ? (
                <div className="rounded-xl border border-border bg-surface p-4">
                  <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.putawayTasks.assignee")} *</label>
                  <SearchableDropdown
                    options={userOptions}
                    value={selectedUserId}
                    onChange={(value) => {
                      setSelectedUserId(value);
                      setFormError("");
                    }}
                    placeholder={t("warehouse.putawayTasks.assignee")}
                    showEmptyOption={false}
                    allowClear={false}
                    disabled={usersLoading || userOptions.length === 0}
                  />
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.completedAt")}</p>
                  <p className="mt-2 text-sm text-text2">{formatDate(task.completedAt ?? undefined)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.note")}</p>
                <p className="mt-2 text-sm text-text2">{task.notes?.trim() || "-"}</p>
              </div>

              {formError ? <p className="text-sm text-error">{formError}</p> : null}
            </>
          )}
        </div>
      </Drawer>

      <ConfirmDialog
        open={cancelOpen}
        title={t("warehouse.putawayTasks.cancelConfirmTitle")}
        description={t("warehouse.putawayTasks.cancelConfirmDescription")}
        confirmLabel={t("warehouse.putawayTasks.cancelConfirmAction")}
        cancelLabel={t("common.cancel")}
        loading={acting}
        loadingLabel={t("warehouse.putawayTasks.cancellingAction")}
        onConfirm={() => {
          setCancelOpen(false);
          void onCancel();
        }}
        onClose={() => setCancelOpen(false)}
      />
    </>
  );
}
