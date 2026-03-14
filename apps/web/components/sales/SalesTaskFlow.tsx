"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { FieldError } from "@/components/ui/FieldError";
import CustomerInfinityDropdown from "@/components/sales/CustomerInfinityDropdown";
import { QuickCreateCustomerForm } from "@/components/customers/QuickCreateCustomerForm";
import { SaleLinesSection } from "@/components/sales/SaleLinesSection";
import { PAYMENT_METHOD_OPTIONS, calcLineTotal, type FieldErrors, type SaleLineForm } from "@/components/sales/types";
import type { CreateCustomerRequest, Customer } from "@/lib/customers";
import type { PaymentMethod } from "@/lib/sales";
import { toNumberOrNull } from "@/lib/format";

export type SalesMobileView = "list" | "task" | "success";
export type SalesTaskStep = "start" | "cart" | "customer" | "payment" | "review" | "success";

type SalesTaskFlowProps = {
  open: boolean;
  submitting: boolean;
  scopeReady: boolean;
  loadingVariants: boolean;
  canTenantOnly: boolean;
  storeOptions: Array<{ value: string; label: string }>;
  customerId: string;
  onCustomerIdChange: (value: string) => void;
  onCustomerSelected: (customer: Customer) => void;
  customerDropdownRefreshKey: number;
  onQuickCreateCustomer: (payload: CreateCustomerRequest) => Promise<Customer>;
  variantOptions: Array<{ value: string; label: string; secondaryLabel?: string }>;
  variantFieldLabel?: string;
  variantPlaceholder?: string;
  loadingMoreVariants: boolean;
  variantHasMore: boolean;
  onLoadMoreVariants: () => void;
  storeId: string;
  onStoreIdChange: (value: string) => void;
  name: string;
  surname: string;
  phoneNumber: string;
  email: string;
  paymentMethod: PaymentMethod | "";
  onPaymentMethodChange: (value: PaymentMethod | "") => void;
  initialPaymentAmount: string;
  onInitialPaymentAmountChange: (value: string) => void;
  note: string;
  onNoteChange: (value: string) => void;
  lines: SaleLineForm[];
  onChangeLine: (rowId: string, patch: Partial<SaleLineForm>) => void;
  onApplyVariantPreset: (rowId: string, variantId: string) => void;
  onAddLine: () => void;
  onRemoveLine: (rowId: string) => void;
  errors: FieldErrors;
  setErrors: Dispatch<SetStateAction<FieldErrors>>;
  onClearError: (field: keyof FieldErrors) => void;
  formError: string;
  successMessage: string;
  onClose: () => void;
  onRestart: () => void;
  onSubmit: () => void;
};

const STEPS: Array<{ key: Exclude<SalesTaskStep, "success">; label: string }> = [
  { key: "start", label: "Baslangic" },
  { key: "cart", label: "Sepet" },
  { key: "customer", label: "Musteri" },
  { key: "payment", label: "Odeme" },
  { key: "review", label: "Ozet" },
];

export default function SalesTaskFlow({
  open,
  submitting,
  scopeReady,
  loadingVariants,
  canTenantOnly,
  storeOptions,
  customerId,
  onCustomerIdChange,
  onCustomerSelected,
  customerDropdownRefreshKey,
  onQuickCreateCustomer,
  variantOptions,
  variantFieldLabel = "Varyant *",
  variantPlaceholder = "Varyant secin",
  loadingMoreVariants,
  variantHasMore,
  onLoadMoreVariants,
  storeId,
  onStoreIdChange,
  name,
  surname,
  phoneNumber,
  email,
  paymentMethod,
  onPaymentMethodChange,
  initialPaymentAmount,
  onInitialPaymentAmountChange,
  note,
  onNoteChange,
  lines,
  onChangeLine,
  onApplyVariantPreset,
  onAddLine,
  onRemoveLine,
  errors,
  setErrors,
  onClearError,
  formError,
  successMessage,
  onClose,
  onRestart,
  onSubmit,
}: SalesTaskFlowProps) {
  const [step, setStep] = useState<SalesTaskStep>("start");
  const [successOpen, setSuccessOpen] = useState(false);
  const submitRequestedRef = useRef(false);
  const previousOpenRef = useRef(open);

  useEffect(() => {
    if (open) {
      setStep("start");
      setSuccessOpen(false);
      submitRequestedRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (previousOpenRef.current && !open && submitRequestedRef.current && successMessage) {
      submitRequestedRef.current = false;
      setSuccessOpen(true);
    }
    previousOpenRef.current = open;
  }, [open, successMessage]);

  const estimatedTotal = useMemo(
    () => lines.reduce((sum, line) => sum + calcLineTotal(line), 0),
    [lines],
  );

  const currentStoreLabel = useMemo(
    () => storeOptions.find((option) => option.value === storeId)?.label ?? (storeId ? "Secili magaza" : "Aktif magaza"),
    [storeId, storeOptions],
  );

  const activeSteps = STEPS.filter((item) => item.key !== "start");

  const validateCartStep = () => {
    const invalidLine = lines.some((line) => {
      const quantity = toNumberOrNull(line.quantity);
      const unitPrice = toNumberOrNull(line.unitPrice);
      return !line.productVariantId || quantity == null || quantity <= 0 || unitPrice == null || unitPrice < 0;
    });

    if (invalidLine) {
      setErrors((prev) => ({
        ...prev,
        lines: "Tum satirlarda urun, adet ve birim fiyat alanlari gecerli olmalidir.",
      }));
      return false;
    }

    return true;
  };

  const validateCustomerStep = () => {
    const nextErrors: FieldErrors = {};
    if (!customerId) nextErrors.customerId = "Musteri secimi zorunludur.";
    if (canTenantOnly && !storeId) nextErrors.storeId = "Magaza secimi zorunludur.";
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const validatePaymentStep = () => {
    const nextErrors: FieldErrors = {};
    if (!paymentMethod) nextErrors.paymentMethod = "Odeme yontemi zorunludur.";
    const amount = toNumberOrNull(initialPaymentAmount);
    if (amount == null || amount < 0) nextErrors.initialPaymentAmount = "Gecerli bir odenen tutar girin.";
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (step === "start") {
      setStep("cart");
      return;
    }
    if (step === "cart") {
      if (!validateCartStep()) return;
      setStep("customer");
      return;
    }
    if (step === "customer") {
      if (!validateCustomerStep()) return;
      setStep("payment");
      return;
    }
    if (step === "payment") {
      if (!validatePaymentStep()) return;
      setStep("review");
    }
  };

  const goBack = () => {
    if (step === "review") setStep("payment");
    else if (step === "payment") setStep("customer");
    else if (step === "customer") setStep("cart");
    else if (step === "cart") setStep("start");
    else onClose();
  };

  const handleSubmit = () => {
    submitRequestedRef.current = true;
    onSubmit();
  };

  const renderTaskContent = () => {
    if (step === "start") {
      return (
        <div className="space-y-4">
          <div className="rounded-xl2 border border-border bg-surface2/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Aktif Magaza</p>
            <p className="mt-2 text-lg font-semibold text-text">{currentStoreLabel || "-"}</p>
            <p className="mt-2 text-sm text-muted">
              Bu akis mobilde sirasiyla sepet, musteri, odeme ve ozet adimlarini tamamlar.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-sm font-semibold text-text">1. Sepeti olustur</p>
              <p className="mt-1 text-sm text-muted">Varyant veya paket secip satis satirlarini ekleyin.</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-sm font-semibold text-text">2. Musteriyi sec</p>
              <p className="mt-1 text-sm text-muted">Kayitli musteriyi secin veya hizli musteri olusturun.</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-sm font-semibold text-text">3. Odemeyi al</p>
              <p className="mt-1 text-sm text-muted">Ilk odeme ve not bilgisi ile satisi tamamlayin.</p>
            </div>
          </div>
        </div>
      );
    }

    if (step === "cart") {
      return (
        <SaleLinesSection
          lines={lines}
          onChangeLine={onChangeLine}
          onApplyVariantPreset={onApplyVariantPreset}
          onAddLine={onAddLine}
          onRemoveLine={onRemoveLine}
          variantOptions={variantOptions}
          variantFieldLabel={variantFieldLabel}
          variantPlaceholder={variantPlaceholder}
          loadingVariants={loadingVariants}
          loadingMoreVariants={loadingMoreVariants}
          variantHasMore={variantHasMore}
          onLoadMoreVariants={onLoadMoreVariants}
          linesError={errors.lines}
        />
      );
    }

    if (step === "customer") {
      return (
        <section className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
          {canTenantOnly ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Magaza *</label>
              <SearchableDropdown
                options={storeOptions}
                value={storeId}
                onChange={(value) => {
                  onClearError("storeId");
                  onStoreIdChange(value);
                }}
                placeholder="Magaza secin"
                showEmptyOption={false}
              />
              <FieldError error={errors.storeId} className="mt-1 text-xs text-error" />
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Musteri *</label>
            <CustomerInfinityDropdown
              value={customerId}
              onChange={(value) => {
                onClearError("customerId");
                onCustomerIdChange(value);
              }}
              onSelectCustomer={onCustomerSelected}
              refreshKey={customerDropdownRefreshKey}
              placeholder="Musteri secin"
            />
            <FieldError error={errors.customerId} className="mt-1 text-xs text-error" />

            {customerId ? (
              <div className="mt-3 rounded-xl border border-border bg-surface2/40 p-3 text-sm text-text2">
                <div className="font-medium text-text">{[name, surname].filter(Boolean).join(" ") || "-"}</div>
                <div className="mt-1">Telefon: {phoneNumber || "-"}</div>
                <div>E-posta: {email || "-"}</div>
              </div>
            ) : null}

            <QuickCreateCustomerForm
              drawerOpen={open}
              onSuccess={(customer) => {
                onCustomerIdChange(customer.id);
                onCustomerSelected(customer);
                onClearError("customerId");
              }}
              onQuickCreateCustomer={onQuickCreateCustomer}
            />
          </div>
        </section>
      );
    }

    if (step === "payment") {
      return (
        <section className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Odeme Yontemi *</label>
            <SearchableDropdown
              options={PAYMENT_METHOD_OPTIONS}
              value={paymentMethod}
              onChange={(value) => {
                onClearError("paymentMethod");
                onPaymentMethodChange((value || "") as PaymentMethod | "");
              }}
              placeholder="Odeme yontemi secin"
              showEmptyOption={false}
              allowClear={false}
            />
            <FieldError error={errors.paymentMethod} className="mt-1 text-xs text-error" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Odenen Tutar *</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={initialPaymentAmount}
              onChange={(event) => {
                onClearError("initialPaymentAmount");
                onInitialPaymentAmountChange(event.target.value);
              }}
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <FieldError error={errors.initialPaymentAmount} className="mt-1 text-xs text-error" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Not</label>
            <textarea
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              className="min-h-[96px] w-full rounded-xl border border-border bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </section>
      );
    }

    return (
      <div className="space-y-4">
        <section className="rounded-xl2 border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold text-text">Satis Ozeti</h3>
          <dl className="mt-3 grid gap-3 text-sm text-text2">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Magaza</dt>
              <dd className="text-right text-text">{currentStoreLabel || "-"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Musteri</dt>
              <dd className="text-right text-text">{[name, surname].filter(Boolean).join(" ") || "-"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Satir Sayisi</dt>
              <dd className="text-right text-text">{lines.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Ilk Odeme</dt>
              <dd className="text-right text-text">{initialPaymentAmount || "0"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Tahmini Toplam</dt>
              <dd className="text-right text-base font-semibold text-primary">{estimatedTotal.toFixed(2)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl2 border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold text-text">Satirlar</h3>
          <div className="mt-3 space-y-2">
            {lines.map((line, index) => (
              <div key={line.rowId} className="rounded-xl border border-border bg-surface2/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-muted">Satir #{index + 1}</span>
                  <span className="text-sm font-medium text-text">{calcLineTotal(line).toFixed(2)}</span>
                </div>
                <p className="mt-2 text-xs text-muted">
                  Urun: {variantOptions.find((option) => option.value === line.productVariantId)?.label ?? "-"}
                </p>
                <p className="text-xs text-muted">Adet: {line.quantity || "-"}</p>
              </div>
            ))}
          </div>
        </section>

        {formError ? (
          <div className="rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
            {formError}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        side="right"
        title="Yeni Satis"
        description="Mobil satis gorev akisi"
        closeDisabled={submitting}
        mobileFullscreen
        footer={
          <div className="flex items-center justify-between gap-2">
            <Button
              label={step === "start" ? "Kapat" : "Geri"}
              onClick={goBack}
              variant="secondary"
              className="min-w-[96px]"
              disabled={submitting}
            />
            {step === "review" ? (
              <Button
                label={submitting ? "Kaydediliyor..." : "Satisi Kaydet"}
                onClick={handleSubmit}
                variant="primarySolid"
                className="min-w-[140px]"
                loading={submitting}
                disabled={!scopeReady || loadingVariants}
              />
            ) : (
              <Button
                label={step === "start" ? "Basla" : "Devam Et"}
                onClick={goNext}
                variant="primarySolid"
                className="min-w-[120px]"
                disabled={!scopeReady || (step === "cart" && loadingVariants)}
              />
            )}
          </div>
        }
      >
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-2">
            {STEPS.map((item) => (
              <span
                key={item.key}
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  item.key === step
                    ? "bg-primary text-white"
                    : activeSteps.findIndex((active) => active.key === item.key) <
                          activeSteps.findIndex((active) => active.key === step)
                      ? "bg-primary/15 text-primary"
                      : "bg-surface2 text-muted"
                }`}
              >
                {item.label}
              </span>
            ))}
          </div>

          {renderTaskContent()}
        </div>
      </Drawer>

      <Drawer
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        side="right"
        title="Satis Tamamlandi"
        description="Satis kaydi olusturuldu."
        mobileFullscreen
        footer={
          <div className="flex items-center justify-between gap-2">
            <Button
              label="Listeye Don"
              onClick={() => setSuccessOpen(false)}
              variant="secondary"
              className="min-w-[120px]"
            />
            <Button
              label="Yeni Satis"
              onClick={() => {
                setSuccessOpen(false);
                setStep("start");
                onRestart();
              }}
              variant="primarySolid"
              className="min-w-[120px]"
            />
          </div>
        }
      >
        <div className="space-y-4 p-5">
          <div className="rounded-xl2 border border-primary/30 bg-primary/10 p-4">
            <p className="text-sm font-semibold text-primary">{successMessage || "Satis kaydi olusturuldu."}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
            Yeni satis baslatabilir veya listeye donup fis detaylarini inceleyebilirsiniz.
          </div>
        </div>
      </Drawer>
    </>
  );
}
