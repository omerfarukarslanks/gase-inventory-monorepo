"use client";

import { useEffect, useMemo, useState } from "react";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { useLang } from "@/context/LangContext";
import { useDebounceStr } from "@/hooks/useDebounce";
import { getProducts, getProductVariants, type Product, type ProductVariant } from "@/lib/products";
import type { CountSession, CreateCountSessionLinePayload } from "@/lib/warehouse";

type CountSessionDetailDrawerProps = {
  open: boolean;
  loading: boolean;
  acting: boolean;
  session: CountSession | null;
  canManage: boolean;
  canCloseSession: boolean;
  locationOptions: Array<{ value: string; label: string }>;
  onClose: () => void;
  onAddLine: (payload: CreateCountSessionLinePayload) => Promise<void>;
  onUpdateLine: (lineId: string, countedQuantity: number) => Promise<void>;
  onCloseSession: () => Promise<void>;
};

const INPUT_CLASSNAME =
  "h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";

function formatLineLabel(line: NonNullable<CountSession["lines"]>[number]) {
  if (line.productName) {
    return `${line.productName}${line.variantName ? ` / ${line.variantName}` : ""}`;
  }
  if (line.variantName) return line.variantName;
  return "";
}

export default function CountSessionDetailDrawer({
  open,
  loading,
  acting,
  session,
  canManage,
  canCloseSession,
  locationOptions,
  onClose,
  onAddLine,
  onUpdateLine,
  onCloseSession,
}: CountSessionDetailDrawerProps) {
  const { t } = useLang();
  const sessionClosed = session?.status === "CLOSED";
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const debouncedProductSearchTerm = useDebounceStr(productSearchTerm, 300);
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variantOptions, setVariantOptions] = useState<ProductVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [locationId, setLocationId] = useState("");
  const [expectedQuantity, setExpectedQuantity] = useState("");
  const [countedQuantity, setCountedQuantity] = useState("");
  const [lineFormError, setLineFormError] = useState("");
  const [lineSubmitting, setLineSubmitting] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSubmittingId, setUpdateSubmittingId] = useState("");
  const [editedQuantities, setEditedQuantities] = useState<Record<string, string>>({});

  const productOptions = useMemo(
    () => productResults.map((product) => ({ value: product.id, label: product.name })),
    [productResults],
  );

  const variantDropdownOptions = useMemo(
    () => variantOptions.map((variant) => ({ value: variant.id, label: variant.name || variant.id })),
    [variantOptions],
  );

  useEffect(() => {
    if (!open) {
      resetAddLineForm();
      return;
    }
    resetAddLineForm();
  }, [open, session?.id]);

  useEffect(() => {
    if (!open) return;
    const quantityMap = Object.fromEntries((session?.lines ?? []).map((line) => [line.id, String(line.countedQuantity)]));
    setEditedQuantities(quantityMap);
    setUpdateError("");
  }, [open, session?.id, session?.lines]);

  useEffect(() => {
    if (!open || !canManage || sessionClosed) return;
    const term = debouncedProductSearchTerm.trim();
    let cancelled = false;

    if (!term) {
      setProductResults([]);
      setProductsLoading(false);
      return;
    }

    setProductsLoading(true);
    void getProducts({
      page: 1,
      limit: 15,
      search: term,
      isActive: true,
      variantIsActive: true,
    })
      .then((response) => {
        if (!cancelled) setProductResults(response.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setProductResults([]);
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canManage, debouncedProductSearchTerm, open, sessionClosed]);

  useEffect(() => {
    if (!selectedProduct?.id) {
      setVariantOptions([]);
      setSelectedVariantId("");
      return;
    }

    let cancelled = false;
    setVariantsLoading(true);
    void getProductVariants(selectedProduct.id, { isActive: true })
      .then((variants) => {
        if (!cancelled) setVariantOptions(variants ?? []);
      })
      .catch(() => {
        if (!cancelled) setVariantOptions([]);
      })
      .finally(() => {
        if (!cancelled) setVariantsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProduct?.id]);

  function resetAddLineForm() {
    setProductSearchTerm("");
    setProductResults([]);
    setSelectedProduct(null);
    setVariantOptions([]);
    setSelectedVariantId("");
    setLotNumber("");
    setLocationId("");
    setExpectedQuantity("");
    setCountedQuantity("");
    setLineFormError("");
  }

  const handleAddLine = async () => {
    if (!selectedVariantId) {
      setLineFormError(t("warehouse.countSessions.variantRequired"));
      return;
    }
    if (!locationId) {
      setLineFormError(t("warehouse.countSessions.locationRequired"));
      return;
    }
    const expected = Number(expectedQuantity);
    const counted = Number(countedQuantity);
    if (Number.isNaN(expected) || expected < 0) {
      setLineFormError(t("warehouse.countSessions.expectedInvalid"));
      return;
    }
    if (Number.isNaN(counted) || counted < 0) {
      setLineFormError(t("warehouse.countSessions.countedInvalid"));
      return;
    }

    setLineSubmitting(true);
    setLineFormError("");
    try {
      await onAddLine({
        productVariantId: selectedVariantId,
        lotNumber: lotNumber.trim() || undefined,
        locationId,
        expectedQuantity: expected,
        countedQuantity: counted,
      });
      resetAddLineForm();
    } catch (error) {
      setLineFormError(error instanceof Error ? error.message : t("warehouse.countSessions.lineAddError"));
    } finally {
      setLineSubmitting(false);
    }
  };

  const handleUpdateLine = async (lineId: string) => {
    const nextQuantity = Number(editedQuantities[lineId]);
    if (Number.isNaN(nextQuantity) || nextQuantity < 0) {
      setUpdateError(t("warehouse.countSessions.countedInvalid"));
      return;
    }

    setUpdateSubmittingId(lineId);
    setUpdateError("");
    try {
      await onUpdateLine(lineId, nextQuantity);
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : t("warehouse.countSessions.lineUpdateError"));
    } finally {
      setUpdateSubmittingId("");
    }
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        side="right"
        title={t("warehouse.countSessions.detailsTitle")}
        description={session?.id ?? ""}
        closeDisabled={acting || lineSubmitting || Boolean(updateSubmittingId)}
        mobileFullscreen
        className="!max-w-[760px]"
        footer={(
          <div className="flex items-center justify-between gap-2">
            <Button label={t("common.close")} onClick={onClose} disabled={acting} variant="secondary" />
            {canCloseSession && session && !sessionClosed ? (
              <Button
                label={acting ? t("warehouse.countSessions.closingAction") : t("warehouse.countSessions.closeAction")}
                onClick={() => setCloseDialogOpen(true)}
                disabled={acting || lineSubmitting || Boolean(updateSubmittingId)}
                loading={acting}
                variant="primarySolid"
              />
            ) : null}
          </div>
        )}
      >
        <div className="space-y-4 p-5">
          {loading ? (
            <p className="text-sm text-muted">{t("warehouse.countSessions.detailsLoading")}</p>
          ) : !session ? (
            <p className="text-sm text-muted">{t("warehouse.countSessions.detailsNotFound")}</p>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface2/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("common.storeFilter")}</p>
                  <p className="mt-2 text-sm font-semibold text-text">{session.storeName ?? session.storeId}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface2/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.warehouse")}</p>
                  <p className="mt-2 text-sm font-semibold text-text">{session.warehouseName ?? session.warehouseId}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface2/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("common.status")}</p>
                  <p className="mt-2 text-sm font-semibold text-text">{t(`warehouse.statuses.${session.status}`)}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface2/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.start")}</p>
                  <p className="mt-2 text-sm font-semibold text-text">
                    {session.startedAt ? new Date(session.startedAt).toLocaleString("tr-TR") : "-"}
                  </p>
                </div>
              </div>

              {session.notes ? (
                <div className="rounded-xl border border-border bg-surface2/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.note")}</p>
                  <p className="mt-2 text-sm text-text2">{session.notes}</p>
                </div>
              ) : null}

              {canManage && !sessionClosed ? (
                <div className="space-y-4 rounded-xl border border-border bg-surface2/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-text">{t("warehouse.countSessions.addLineTitle")}</h3>
                      <p className="text-xs text-muted">{t("warehouse.countSessions.addLineSubtitle")}</p>
                    </div>
                    {session.status === "OPEN" ? (
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                        {t("warehouse.countSessions.firstLineHint")}
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.countSessions.productSearchLabel")}</label>
                      <input
                        className={INPUT_CLASSNAME}
                        value={productSearchTerm}
                        onChange={(event) => setProductSearchTerm(event.target.value)}
                        placeholder={t("warehouse.countSessions.productSearchPlaceholder")}
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.common.product")}</label>
                        <SearchableDropdown
                          options={productOptions}
                          value={selectedProduct?.id ?? ""}
                          onChange={(value) => {
                            const nextProduct = productResults.find((product) => product.id === value) ?? null;
                            setSelectedProduct(nextProduct);
                            setSelectedVariantId("");
                          }}
                          placeholder={productsLoading ? t("warehouse.countSessions.productsLoading") : t("warehouse.countSessions.productPlaceholder")}
                          disabled={productsLoading || productOptions.length === 0}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.common.variant")}</label>
                        <SearchableDropdown
                          options={variantDropdownOptions}
                          value={selectedVariantId}
                          onChange={setSelectedVariantId}
                          placeholder={variantsLoading ? t("warehouse.countSessions.variantsLoading") : t("warehouse.countSessions.variantPlaceholder")}
                          disabled={variantsLoading || variantDropdownOptions.length === 0}
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.common.location")}</label>
                        <SearchableDropdown
                          options={locationOptions}
                          value={locationId}
                          onChange={setLocationId}
                          placeholder={t("warehouse.countSessions.locationPlaceholder")}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.common.lotNumber")}</label>
                        <input
                          className={INPUT_CLASSNAME}
                          value={lotNumber}
                          onChange={(event) => setLotNumber(event.target.value)}
                          placeholder="LOT-001"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.common.expected")}</label>
                        <input
                          type="number"
                          min="0"
                          className={INPUT_CLASSNAME}
                          value={expectedQuantity}
                          onChange={(event) => setExpectedQuantity(event.target.value)}
                          placeholder="100"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.common.counted")}</label>
                        <input
                          type="number"
                          min="0"
                          className={INPUT_CLASSNAME}
                          value={countedQuantity}
                          onChange={(event) => setCountedQuantity(event.target.value)}
                          placeholder="96"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <Button label={t("warehouse.countSessions.lineClear")} onClick={resetAddLineForm} disabled={lineSubmitting} variant="secondary" />
                      <Button
                        label={lineSubmitting ? t("warehouse.countSessions.lineAdding") : t("warehouse.countSessions.lineAdd")}
                        onClick={() => void handleAddLine()}
                        disabled={lineSubmitting}
                        loading={lineSubmitting}
                        variant="primarySolid"
                      />
                    </div>

                    {lineFormError ? <p className="text-sm text-error">{lineFormError}</p> : null}
                  </div>
                </div>
              ) : sessionClosed ? (
                <div className="rounded-xl border border-border bg-surface2/20 p-4 text-sm text-muted">
                  {t("warehouse.countSessions.sessionClosedInfo")}
                </div>
              ) : null}

              <div className="space-y-3 rounded-xl border border-border bg-surface2/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-text">{t("warehouse.countSessions.linesTitle")}</h3>
                    <p className="text-xs text-muted">{t("warehouse.countSessions.linesSubtitle")}</p>
                  </div>
                  <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-text2">
                    {(session.lines ?? []).length} {t("warehouse.countSessions.lineCountLabel")}
                  </span>
                </div>

                {updateError ? <p className="text-sm text-error">{updateError}</p> : null}

                {(session.lines ?? []).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                    {t("warehouse.countSessions.linesEmpty")}
                  </div>
                ) : (
                  (session.lines ?? []).map((line) => (
                    <div key={line.id} className="space-y-3 rounded-xl border border-border bg-surface p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-text">{formatLineLabel(line) || t("warehouse.countSessions.productUnknown")}</h4>
                          <p className="mt-1 truncate text-xs text-muted">
                            {line.locationName || line.locationCode || t("warehouse.countSessions.locationUnknown")}
                            {line.lotNumber ? ` • ${line.lotNumber}` : ""}
                          </p>
                        </div>
                        {line.isAdjusted ? (
                          <span className="rounded-full bg-primary/15 px-2 py-1 text-[11px] font-semibold text-primary">
                            {t("warehouse.countSessions.adjusted")}
                          </span>
                        ) : null}
                      </div>

                      <dl className="grid gap-3 md:grid-cols-3">
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.expected")}</dt>
                          <dd className="mt-1 text-sm text-text">{line.expectedQuantity}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.counted")}</dt>
                          <dd className="mt-1 text-sm text-text">{line.countedQuantity}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.difference")}</dt>
                          <dd className="mt-1 text-sm text-text">{line.difference == null ? "-" : line.difference}</dd>
                        </div>
                      </dl>

                      {canManage && !sessionClosed ? (
                        <div className="flex flex-col gap-3 border-t border-border pt-3 md:flex-row md:items-end">
                          <div className="flex-1">
                            <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.countSessions.updateCountedLabel")}</label>
                            <input
                              type="number"
                              min="0"
                              className={INPUT_CLASSNAME}
                              value={editedQuantities[line.id] ?? String(line.countedQuantity)}
                              onChange={(event) =>
                                setEditedQuantities((prev) => ({ ...prev, [line.id]: event.target.value }))
                              }
                            />
                          </div>
                          <Button
                            label={updateSubmittingId === line.id ? t("warehouse.countSessions.updatingAction") : t("warehouse.countSessions.updateAction")}
                            onClick={() => void handleUpdateLine(line.id)}
                            disabled={Boolean(updateSubmittingId) && updateSubmittingId !== line.id}
                            loading={updateSubmittingId === line.id}
                            variant="primarySoft"
                          />
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </Drawer>

      <ConfirmDialog
        open={closeDialogOpen}
        title={t("warehouse.countSessions.closeDialogTitle")}
        description={t("warehouse.countSessions.closeDialogDescription")}
        confirmLabel={t("warehouse.countSessions.closeDialogConfirm")}
        cancelLabel={t("common.cancel")}
        loading={acting}
        loadingLabel={t("warehouse.countSessions.closingAction")}
        onConfirm={() => void onCloseSession().finally(() => setCloseDialogOpen(false))}
        onClose={() => setCloseDialogOpen(false)}
      />
    </>
  );
}
