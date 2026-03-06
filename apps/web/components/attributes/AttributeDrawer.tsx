"use client";

import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";
import { useLang } from "@/context/LangContext";
import { parseCommaSeparated, type DrawerStep, type EditableValue } from "@/components/attributes/types";

type AttributeDrawerProps = {
  open: boolean;
  editingId: string | null;
  drawerStep: DrawerStep;
  submitting: boolean;
  detailLoading: boolean;
  formName: string;
  originalName: string;
  existingValues: EditableValue[];
  newValuesInput: string;
  formError: string;
  onClose: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onSave: () => void;
  onFormNameChange: (value: string) => void;
  onNewValuesInputChange: (value: string) => void;
  onUpdateEditableValue: (id: string, patch: Partial<EditableValue>) => void;
};

export default function AttributeDrawer({
  open,
  editingId,
  drawerStep,
  submitting,
  detailLoading,
  formName,
  originalName,
  existingValues,
  newValuesInput,
  formError,
  onClose,
  onPrevStep,
  onNextStep,
  onSave,
  onFormNameChange,
  onNewValuesInputChange,
  onUpdateEditableValue,
}: AttributeDrawerProps) {
  const { t } = useLang();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={editingId ? t("attributes.title") : t("attributes.new")}
      description={`Adim ${drawerStep}/2`}
      closeDisabled={submitting}
      className="!max-w-[640px]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button label={t("common.cancel")} onClick={onClose} disabled={submitting} variant="secondary" />
          {drawerStep === 2 && (
            <Button label={t("common.back")} onClick={onPrevStep} disabled={submitting} variant="secondary" />
          )}
          {drawerStep === 1 ? (
            <Button
              label={t("common.continue")}
              onClick={onNextStep}
              disabled={submitting || detailLoading}
              loading={submitting}
              variant="primarySolid"
            />
          ) : (
            <Button
              label={t("common.save")}
              onClick={onSave}
              loading={submitting}
              variant="primarySolid"
            />
          )}
        </div>
      }
    >
      <div className="space-y-5 p-5">
        <div className="flex gap-2">
          <div className="h-1 flex-1 rounded-full bg-primary" />
          <div className={`h-1 flex-1 rounded-full transition-colors ${drawerStep === 2 ? "bg-primary" : "bg-border"}`} />
        </div>

        {drawerStep === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-text">{t("attributes.title")}</h3>
              <p className="text-xs text-muted">{t("attributes.title")}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted">{t("attributes.title")} *</label>
              <input
                type="text"
                value={formName}
                onChange={(event) => onFormNameChange(event.target.value)}
                placeholder="Orn: Renk, Beden, Malzeme"
                className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !submitting) onNextStep();
                }}
              />
            </div>
          </div>
        )}

        {drawerStep === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-text">{t("attributes.valueName")}</h3>
              <p className="text-xs text-muted">
                <span className="font-medium text-text">{originalName}</span> icin degerlerini yonetin
              </p>
            </div>

            {detailLoading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted">
                <svg className="h-4 w-4 animate-sp" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                {t("common.loading")}
              </div>
            ) : (
              <>
                {editingId && existingValues.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted">Mevcut Degerler</label>
                    <div className="space-y-2">
                      {existingValues.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 rounded-xl border border-border bg-surface2/30 p-2"
                        >
                          <input
                            type="text"
                            value={item.name}
                            onChange={(event) => onUpdateEditableValue(item.id, { name: event.target.value })}
                            placeholder="Deger adi"
                            className="h-9 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              item.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                            }`}
                          >
                            {item.isActive ? t("common.active") : t("common.passive")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {editingId && existingValues.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted">
                    Kayitli deger bulunamadi
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted">Yeni Degerler</label>
                  <input
                    type="text"
                    value={newValuesInput}
                    onChange={(event) => onNewValuesInputChange(event.target.value)}
                    placeholder="Virgul ile ayirin: Kirmizi, Mavi, Yesil"
                    className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  {newValuesInput.trim() && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {parseCommaSeparated(newValuesInput).map((name, index) => (
                        <span
                          key={`${name}-${index}`}
                          className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {formError && (
          <div className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">
            {formError}
          </div>
        )}
      </div>
    </Drawer>
  );
}
