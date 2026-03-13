"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { FieldError } from "@/components/ui/FieldError";
import { useDebounceStr } from "@/hooks/useDebounce";
import {
  getProducts,
  getProductVariants,
  type Currency,
  type Product,
  type ProductVariant,
} from "@/lib/products";
import type { Supplier } from "@/lib/suppliers";
import type { CreatePurchaseOrderPayload } from "@/lib/procurement";
import { formatPrice, toNumberOrNull } from "@/lib/format";

type PurchaseOrderCreateDrawerProps = {
  open: boolean;
  submitting: boolean;
  activeStoreId: string;
  activeStoreName: string;
  suppliers: Supplier[];
  onClose: () => void;
  onSubmit: (payload: CreatePurchaseOrderPayload) => Promise<void>;
};

type DraftLine = {
  rowId: string;
  productVariantId: string;
  label: string;
  quantity: string;
  unitPrice: string;
  taxPercent: string;
  notes: string;
};

type DraftLineBuilder = {
  selectedProduct: Product | null;
  selectedVariantId: string;
  quantity: string;
  unitPrice: string;
  taxPercent: string;
  notes: string;
};

type PurchaseOrderCreateStep = "basics" | "lines" | "review";

const CURRENCY_OPTIONS: Array<{ value: Currency; label: string }> = [
  { value: "TRY", label: "TRY" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
];

function buildDefaultBuilder(): DraftLineBuilder {
  return {
    selectedProduct: null,
    selectedVariantId: "",
    quantity: "",
    unitPrice: "",
    taxPercent: "20",
    notes: "",
  };
}

function lineTotal(line: DraftLine) {
  return (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
}

export default function PurchaseOrderCreateDrawer({
  open,
  submitting,
  activeStoreId,
  activeStoreName,
  suppliers,
  onClose,
  onSubmit,
}: PurchaseOrderCreateDrawerProps) {
  const [step, setStep] = useState<PurchaseOrderCreateStep>("basics");
  const [supplierId, setSupplierId] = useState("");
  const [expectedAt, setExpectedAt] = useState("");
  const [currency, setCurrency] = useState<Currency>("TRY");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [builderError, setBuilderError] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [builder, setBuilder] = useState<DraftLineBuilder>(buildDefaultBuilder());
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [variantOptions, setVariantOptions] = useState<ProductVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const debouncedProductSearchTerm = useDebounceStr(productSearchTerm, 300);

  const supplierOptions = useMemo(
    () => suppliers.map((supplier) => ({
      value: supplier.id,
      label: supplier.surname ? `${supplier.name} ${supplier.surname}` : supplier.name,
    })),
    [suppliers],
  );

  const totalAmount = useMemo(
    () => lines.reduce((sum, line) => sum + lineTotal(line), 0),
    [lines],
  );

  const resetDraft = useEffectEvent(() => {
    setStep("basics");
    setSupplierId("");
    setExpectedAt("");
    setCurrency("TRY");
    setNotes("");
    setFormError("");
    setBuilderError("");
    setLines([]);
    setBuilder(buildDefaultBuilder());
    setProductSearchTerm("");
    setProductResults([]);
    setVariantOptions([]);
    setProductsLoading(false);
    setVariantsLoading(false);
  });

  const loadProducts = useEffectEvent(async (search: string) => {
    setProductsLoading(true);
    try {
      const response = await getProducts({
        page: 1,
        limit: 15,
        search: search.trim() || undefined,
        isActive: true,
        variantIsActive: true,
      });
      setProductResults(response.data ?? []);
    } catch {
      setProductResults([]);
    } finally {
      setProductsLoading(false);
    }
  });

  const loadVariants = useEffectEvent(async (productId: string | null) => {
    if (!productId) {
      setVariantOptions([]);
      setVariantsLoading(false);
      return;
    }

    setVariantsLoading(true);
    try {
      const variants = await getProductVariants(productId, { isActive: true });
      setVariantOptions(variants ?? []);
    } catch {
      setVariantOptions([]);
    } finally {
      setVariantsLoading(false);
    }
  });

  useEffect(() => {
    if (!open) return;
    resetDraft();
  }, [open]);

  useEffect(() => {
    if (!open || step !== "lines") return;
    void loadProducts(debouncedProductSearchTerm);
  }, [debouncedProductSearchTerm, open, step]);

  useEffect(() => {
    void loadVariants(builder.selectedProduct?.id ?? null);
  }, [builder.selectedProduct?.id]);

  const goNext = () => {
    setFormError("");

    if (step === "basics") {
      if (!supplierId) {
        setFormError("Tedarikci secimi zorunludur.");
        return;
      }
      if (!expectedAt) {
        setFormError("Beklenen teslim tarihi zorunludur.");
        return;
      }
      setStep("lines");
      return;
    }

    if (step === "lines") {
      if (lines.length === 0) {
        setFormError("Devam etmek icin en az bir siparis kalemi ekleyin.");
        return;
      }
      setStep("review");
    }
  };

  const goBack = () => {
    setFormError("");
    if (step === "review") {
      setStep("lines");
      return;
    }
    if (step === "lines") {
      setStep("basics");
      return;
    }
    onClose();
  };

  const addLine = () => {
    setBuilderError("");
    if (!builder.selectedProduct) {
      setBuilderError("Urun secimi zorunludur.");
      return;
    }
    if (!builder.selectedVariantId) {
      setBuilderError("Varyant secimi zorunludur.");
      return;
    }
    const quantity = toNumberOrNull(builder.quantity);
    if (quantity == null || quantity <= 0) {
      setBuilderError("Gecerli bir miktar girin.");
      return;
    }
    const unitPrice = toNumberOrNull(builder.unitPrice);
    if (unitPrice == null || unitPrice < 0) {
      setBuilderError("Gecerli bir birim fiyat girin.");
      return;
    }

    const variant = variantOptions.find((item) => item.id === builder.selectedVariantId);
    const label = `${builder.selectedProduct.name} / ${variant?.name ?? builder.selectedVariantId}`;

    setLines((prev) => [
      ...prev,
      {
        rowId: crypto.randomUUID(),
        productVariantId: builder.selectedVariantId,
        label,
        quantity: builder.quantity,
        unitPrice: builder.unitPrice,
        taxPercent: builder.taxPercent || "0",
        notes: builder.notes,
      },
    ]);

    setBuilder({
      selectedProduct: builder.selectedProduct,
      selectedVariantId: "",
      quantity: "",
      unitPrice: builder.selectedProduct.purchasePrice ? String(builder.selectedProduct.purchasePrice) : "",
      taxPercent: builder.selectedProduct.taxPercent != null ? String(builder.selectedProduct.taxPercent) : "20",
      notes: "",
    });
  };

  const handleSelectProduct = (product: Product) => {
    setBuilder({
      selectedProduct: product,
      selectedVariantId: "",
      quantity: "",
      unitPrice: product.purchasePrice != null ? String(product.purchasePrice) : "",
      taxPercent: product.taxPercent != null ? String(product.taxPercent) : "20",
      notes: "",
    });
    setBuilderError("");
  };

  const submit = async () => {
    setFormError("");
    if (lines.length === 0) {
      setFormError("Kaydetmek icin en az bir siparis kalemi ekleyin.");
      return;
    }

    await onSubmit({
      storeId: activeStoreId,
      supplierId,
      expectedAt,
      currency,
      notes: notes.trim() || undefined,
      lines: lines.map((line) => ({
        productVariantId: line.productVariantId,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        taxPercent: Number(line.taxPercent || 0),
        notes: line.notes.trim() || undefined,
      })),
    });
  };

  const footer =
    step === "review" ? (
      <div className="flex items-center justify-between gap-2">
        <Button label="Geri" onClick={goBack} variant="secondary" />
        <div className="flex items-center gap-2">
          <Button label="Iptal" onClick={onClose} disabled={submitting} variant="secondary" />
          <Button label="Kaydet" onClick={() => void submit()} loading={submitting} disabled={submitting} variant="primarySolid" />
        </div>
      </div>
    ) : (
      <div className="flex items-center justify-between gap-2">
        <Button label={step === "basics" ? "Kapat" : "Geri"} onClick={goBack} disabled={submitting} variant="secondary" />
        <Button label="Devam Et" onClick={goNext} disabled={submitting} variant="primarySolid" />
      </div>
    );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title="Yeni Satin Alma Siparisi"
      description={activeStoreName}
      closeDisabled={submitting}
      mobileFullscreen
      className="!max-w-[720px]"
      footer={footer}
    >
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "basics", label: "Temel Bilgi" },
            { key: "lines", label: "Kalemler" },
            { key: "review", label: "Ozet" },
          ].map((item) => (
            <span
              key={item.key}
              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                item.key === step ? "bg-primary text-white" : "bg-surface2 text-muted"
              }`}
            >
              {item.label}
            </span>
          ))}
        </div>

        {step === "basics" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface2/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Aktif Magaza</p>
              <p className="mt-2 text-sm font-semibold text-text">{activeStoreName}</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Tedarikci *</label>
              <SearchableDropdown
                options={supplierOptions}
                value={supplierId}
                onChange={setSupplierId}
                placeholder="Tedarikci secin"
                showEmptyOption={false}
                allowClear={false}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Beklenen Teslim Tarihi *</label>
                <input
                  type="date"
                  value={expectedAt}
                  onChange={(event) => setExpectedAt(event.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Para Birimi *</label>
                <SearchableDropdown
                  options={CURRENCY_OPTIONS}
                  value={currency}
                  onChange={(value) => setCurrency((value as Currency) || "TRY")}
                  placeholder="Para birimi secin"
                  showEmptyOption={false}
                  allowClear={false}
                  showSearchInput={false}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Notlar</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Siparis notlari"
                className="min-h-[96px] w-full rounded-xl2 border border-border bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
              />
            </div>
          </div>
        ) : null}

        {step === "lines" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface2/20 p-4">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Urun Ara</label>
                  <input
                    type="text"
                    value={productSearchTerm}
                    onChange={(event) => setProductSearchTerm(event.target.value)}
                    placeholder="Urun adi veya SKU..."
                    className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  {productsLoading ? <p className="mt-2 text-xs text-muted">Urunler yukleniyor...</p> : null}
                </div>

                {productResults.length > 0 ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    {productResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleSelectProduct(product)}
                        className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                          builder.selectedProduct?.id === product.id
                            ? "border-primary bg-primary/5"
                            : "border-border bg-surface hover:bg-surface2"
                        }`}
                      >
                        <div className="text-sm font-medium text-text">{product.name}</div>
                        <div className="mt-1 text-xs text-muted">{product.sku}</div>
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">Varyant *</label>
                    <SearchableDropdown
                      options={variantOptions.map((variant) => ({
                        value: variant.id,
                        label: `${variant.name}${variant.code ? ` (${variant.code})` : ""}`,
                      }))}
                      value={builder.selectedVariantId}
                      onChange={(value) => setBuilder((prev) => ({ ...prev, selectedVariantId: value }))}
                      placeholder={variantsLoading ? "Varyantlar yukleniyor..." : "Varyant secin"}
                      disabled={!builder.selectedProduct || variantsLoading}
                      showEmptyOption={false}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">Not</label>
                    <input
                      type="text"
                      value={builder.notes}
                      onChange={(event) => setBuilder((prev) => ({ ...prev, notes: event.target.value }))}
                      placeholder="Kalem notu"
                      className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">Miktar *</label>
                    <input
                      type="number"
                      min="1"
                      value={builder.quantity}
                      onChange={(event) => setBuilder((prev) => ({ ...prev, quantity: event.target.value }))}
                      className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">Birim Fiyat *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={builder.unitPrice}
                      onChange={(event) => setBuilder((prev) => ({ ...prev, unitPrice: event.target.value }))}
                      className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">Vergi (%)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={builder.taxPercent}
                      onChange={(event) => setBuilder((prev) => ({ ...prev, taxPercent: event.target.value }))}
                      className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Button label="Kalem Ekle" onClick={addLine} variant="primarySoft" />
                </div>
                <FieldError error={builderError} />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-text">Siparis Kalemleri</h3>
                <p className="mt-1 text-xs text-muted">Eklenen kalemler siparis olusturuldugunda DRAFT olarak kaydedilir.</p>
              </div>

              {lines.length === 0 ? (
                <div className="rounded-xl2 border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                  Henuz siparis kalemi eklenmedi.
                </div>
              ) : (
                <div className="space-y-3">
                  {lines.map((line) => (
                    <div key={line.rowId} className="rounded-xl border border-border bg-surface p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-text">{line.label}</div>
                          <div className="mt-1 text-xs text-muted">
                            {line.quantity} adet · {formatPrice(line.unitPrice)} · Vergi %{line.taxPercent || "0"}
                          </div>
                          {line.notes ? <div className="mt-1 text-xs text-muted">{line.notes}</div> : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => setLines((prev) => prev.filter((item) => item.rowId !== line.rowId))}
                          className="text-sm font-semibold text-error hover:underline"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {step === "review" ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Magaza</p>
                <p className="mt-2 text-sm font-semibold text-text">{activeStoreName}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tedarikci</p>
                <p className="mt-2 text-sm font-semibold text-text">
                  {supplierOptions.find((option) => option.value === supplierId)?.label ?? "-"}
                </p>
              </div>
            </div>

            <dl className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-surface p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Teslim Tarihi</dt>
                <dd className="mt-2 text-sm font-semibold text-text">{expectedAt || "-"}</dd>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Para Birimi</dt>
                <dd className="mt-2 text-sm font-semibold text-text">{currency}</dd>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Toplam</dt>
                <dd className="mt-2 text-sm font-semibold text-primary">{formatPrice(totalAmount)}</dd>
              </div>
            </dl>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Siparis Kalemleri</p>
              <div className="mt-3 space-y-3">
                {lines.map((line) => (
                  <div key={line.rowId} className="rounded-xl border border-border bg-surface2/30 p-3">
                    <div className="text-sm font-medium text-text">{line.label}</div>
                    <div className="mt-1 text-xs text-muted">
                      {line.quantity} adet · {formatPrice(line.unitPrice)} · Toplam {formatPrice(lineTotal(line))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Not</p>
              <p className="mt-2 text-sm text-text2">{notes.trim() || "Not yok."}</p>
            </div>
          </div>
        ) : null}

        <FieldError error={formError} />
      </div>
    </Drawer>
  );
}
