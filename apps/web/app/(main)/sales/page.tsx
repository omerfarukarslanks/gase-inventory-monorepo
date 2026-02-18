"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSessionUser, getSessionUserRole, getSessionUserStoreIds, isStoreScopedRole } from "@/lib/authz";
import { getTenantStockSummary } from "@/lib/inventory";
import { getPaginationValue, normalizeProducts } from "@/lib/normalize";
import { useStores } from "@/hooks/useStores";
import { createSale, type CreateSalePayload } from "@/lib/sales";
import type { Currency } from "@/lib/products";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { formatPrice, toNumberOrNull } from "@/lib/format";

type LineMode = "percent" | "amount";

type SaleLineForm = {
  rowId: string;
  productVariantId: string;
  quantity: string;
  currency: Currency;
  unitPrice: string;
  discountMode: LineMode;
  discountPercent: string;
  discountAmount: string;
  taxMode: LineMode;
  taxPercent: string;
  taxAmount: string;
};

type FieldErrors = {
  name?: string;
  surname?: string;
  storeId?: string;
  lines?: string;
};

type VariantStorePreset = {
  storeId: string;
  currency: Currency;
  unitPrice: number | null;
  discountPercent: number | null;
  discountAmount: number | null;
  taxPercent: number | null;
  taxAmount: number | null;
  lineTotal: number | null;
};

type VariantPreset = {
  currency: Currency;
  unitPrice: number | null;
  discountPercent: number | null;
  discountAmount: number | null;
  taxPercent: number | null;
  taxAmount: number | null;
  lineTotal: number | null;
  stores: VariantStorePreset[];
};

const CURRENCY_OPTIONS = [
  { value: "TRY", label: "TRY - Turk Lirasi" },
  { value: "USD", label: "USD - Amerikan Dolari" },
  { value: "EUR", label: "EUR - Euro" },
];

function createLineRow(): SaleLineForm {
  return {
    rowId: `line-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    productVariantId: "",
    quantity: "1",
    currency: "TRY",
    unitPrice: "",
    discountMode: "percent",
    discountPercent: "",
    discountAmount: "",
    taxMode: "percent",
    taxPercent: "",
    taxAmount: "",
  };
}

function calcLineTotal(line: SaleLineForm): number {
  const quantity = toNumberOrNull(line.quantity) ?? 0;
  const unitPrice = toNumberOrNull(line.unitPrice) ?? 0;
  const subtotal = quantity * unitPrice;

  const taxValue =
    line.taxMode === "percent"
      ? subtotal * ((toNumberOrNull(line.taxPercent) ?? 0) / 100)
      : (toNumberOrNull(line.taxAmount) ?? 0);
  const subtotalWithTax = subtotal + taxValue;
  const discountValue =
    line.discountMode === "percent"
      ? subtotalWithTax * ((toNumberOrNull(line.discountPercent) ?? 0) / 100)
      : (toNumberOrNull(line.discountAmount) ?? 0);

  return Math.max(0, subtotalWithTax - discountValue);
}

export default function SalesPage() {
  const stores = useStores();
  const [variantOptions, setVariantOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [variantPresetsById, setVariantPresetsById] = useState<Record<string, VariantPreset>>({});
  const [loadingVariants, setLoadingVariants] = useState(true);
  const [loadingMoreVariants, setLoadingMoreVariants] = useState(false);
  const [variantPage, setVariantPage] = useState(0);
  const [variantHasMore, setVariantHasMore] = useState(true);
  const [scopeReady, setScopeReady] = useState(false);
  const [isStoreScopedUser, setIsStoreScopedUser] = useState(false);

  const [storeId, setStoreId] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("POS");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<SaleLineForm[]>([createLineRow()]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const role = getSessionUserRole();
    const user = getSessionUser();
    const storeIds = getSessionUserStoreIds(user);
    setIsStoreScopedUser(isStoreScopedRole(role));
    if (isStoreScopedRole(role)) {
      setStoreId(storeIds[0] ?? "");
    }
    setScopeReady(true);
  }, []);

  const fetchVariantPage = useCallback(async (nextPage: number, replace: boolean) => {
    if (replace) {
      setLoadingVariants(true);
    } else {
      setLoadingMoreVariants(true);
    }

    try {
      const res = await getTenantStockSummary({ page: nextPage, limit: 100 });
      const nextProducts = normalizeProducts(res);
      const nextOptions = nextProducts.flatMap((product) =>
        (product.variants ?? []).map((variant) => ({
          value: variant.productVariantId,
          label: `${product.productName} / ${variant.variantName} (${variant.totalQuantity})`,
        })),
      );

      setVariantPresetsById((prev) => {
        const nextMap: Record<string, VariantPreset> = replace ? {} : { ...prev };
        nextProducts.forEach((product) => {
          (product.variants ?? []).forEach((variant) => {
            const storePresets: VariantStorePreset[] = (variant.stores ?? []).map((store) => ({
              storeId: store.storeId,
              currency:
                store.currency === "TRY" || store.currency === "USD" || store.currency === "EUR"
                  ? store.currency
                  : "TRY",
              unitPrice: store.unitPrice ?? store.salePrice ?? null,
              discountPercent: store.discountPercent ?? null,
              discountAmount: store.discountAmount ?? null,
              taxPercent: store.taxPercent ?? null,
              taxAmount: store.taxAmount ?? null,
              lineTotal: store.lineTotal ?? null,
            }));

            const first = storePresets[0];
            nextMap[variant.productVariantId] = {
              currency: first?.currency ?? "TRY",
              unitPrice: first?.unitPrice ?? null,
              discountPercent: first?.discountPercent ?? null,
              discountAmount: first?.discountAmount ?? null,
              taxPercent: first?.taxPercent ?? null,
              taxAmount: first?.taxAmount ?? null,
              lineTotal: first?.lineTotal ?? null,
              stores: storePresets,
            };
          });
        });
        return nextMap;
      });

      setVariantOptions((prev) => {
        const map = new Map<string, { value: string; label: string }>();
        (replace ? [] : prev).forEach((item) => map.set(item.value, item));
        nextOptions.forEach((item) => {
          if (item.value && !map.has(item.value)) map.set(item.value, item);
        });
        return Array.from(map.values());
      });

      const totalPages = getPaginationValue(res, "totalPages");
      if (totalPages > 0) {
        setVariantHasMore(nextPage < totalPages);
      } else {
        setVariantHasMore(nextOptions.length >= 100);
      }
      setVariantPage(nextPage);
    } catch {
      if (replace) {
        setVariantOptions([]);
        setVariantPresetsById({});
      }
      setVariantHasMore(false);
    } finally {
      setLoadingVariants(false);
      setLoadingMoreVariants(false);
    }
  }, []);

  useEffect(() => {
    void fetchVariantPage(1, true);
  }, [fetchVariantPage]);

  const storeOptions = useMemo(
    () => stores.filter((s) => s.isActive).map((s) => ({ value: s.id, label: s.name })),
    [stores],
  );

  const loadMoreVariants = useCallback(() => {
    if (loadingVariants || loadingMoreVariants || !variantHasMore) return;
    void fetchVariantPage(variantPage + 1, false);
  }, [loadingVariants, loadingMoreVariants, variantHasMore, variantPage, fetchVariantPage]);

  const onChangeLine = (rowId: string, patch: Partial<SaleLineForm>) => {
    setErrors((prev) => ({ ...prev, lines: undefined }));
    setLines((prev) => prev.map((line) => (line.rowId === rowId ? { ...line, ...patch } : line)));
  };

  const applyVariantPreset = useCallback(
    (rowId: string, variantId: string) => {
      const preset = variantPresetsById[variantId];
      if (!preset) {
        onChangeLine(rowId, { productVariantId: variantId });
        return;
      }

      const storePreset = storeId
        ? preset.stores.find((store) => store.storeId === storeId) ?? preset.stores[0]
        : preset.stores[0];
      const selected = storePreset ?? preset;

      onChangeLine(rowId, {
        productVariantId: variantId,
        currency: selected.currency,
        unitPrice:
          selected.unitPrice != null
            ? String(selected.unitPrice)
            : selected.lineTotal != null
              ? String(selected.lineTotal)
              : "",
        discountMode: selected.discountAmount != null ? "amount" : "percent",
        discountPercent: selected.discountPercent != null ? String(selected.discountPercent) : "",
        discountAmount: selected.discountAmount != null ? String(selected.discountAmount) : "",
        taxMode: selected.taxAmount != null ? "amount" : "percent",
        taxPercent: selected.taxPercent != null ? String(selected.taxPercent) : "",
        taxAmount: selected.taxAmount != null ? String(selected.taxAmount) : "",
      });
    },
    [onChangeLine, variantPresetsById, storeId],
  );

  const addLine = () => {
    setLines((prev) => [...prev, createLineRow()]);
  };

  const removeLine = (rowId: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((line) => line.rowId !== rowId)));
  };

  const validate = (): boolean => {
    const nextErrors: FieldErrors = {};
    if (!name.trim()) nextErrors.name = "Ad zorunludur.";
    if (!surname.trim()) nextErrors.surname = "Soyad zorunludur.";
    if (!isStoreScopedUser && !storeId) nextErrors.storeId = "Magaza secimi zorunludur.";

    if (lines.length === 0) {
      nextErrors.lines = "En az bir satis satiri eklemelisiniz.";
    } else {
      const invalidLine = lines.some((line) => {
        const quantity = toNumberOrNull(line.quantity);
        const unitPrice = toNumberOrNull(line.unitPrice);
        return !line.productVariantId || quantity == null || quantity <= 0 || unitPrice == null || unitPrice < 0;
      });
      if (invalidLine) {
        nextErrors.lines = "Tum satirlarda varyant, adet ve birim fiyat alanlari gecerli olmalidir.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async () => {
    setFormError("");
    setSuccess("");
    if (!validate()) return;

    const payload: CreateSalePayload = {
      ...(isStoreScopedUser ? {} : { storeId }),
      name: name.trim(),
      surname: surname.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      email: email.trim() || undefined,
      meta: {
        source: source.trim() || undefined,
        note: note.trim() || undefined,
      },
      lines: lines.map((line) => ({
        productVariantId: line.productVariantId,
        quantity: Number(line.quantity),
        currency: line.currency,
        unitPrice: Number(line.unitPrice),
        ...(line.discountMode === "percent" && line.discountPercent
          ? { discountPercent: Number(line.discountPercent) }
          : {}),
        ...(line.discountMode === "amount" && line.discountAmount
          ? { discountAmount: Number(line.discountAmount) }
          : {}),
        ...(line.taxMode === "percent" && line.taxPercent
          ? { taxPercent: Number(line.taxPercent) }
          : {}),
        ...(line.taxMode === "amount" && line.taxAmount
          ? { taxAmount: Number(line.taxAmount) }
          : {}),
        lineTotal: Math.round(calcLineTotal(line) * 100) / 100,
      })),
    };

    setSubmitting(true);
    try {
      await createSale(payload);
      setSuccess("Satis kaydi olusturuldu.");
      setLines([createLineRow()]);
      setName("");
      setSurname("");
      setPhoneNumber("");
      setEmail("");
      setSource("POS");
      setNote("");
      setErrors({});
    } catch {
      setFormError("Satis olusturulamadi. Lutfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text">Satislar</h1>
        <p className="text-sm text-muted">Yeni satis olusturma</p>
      </div>

      <section className="rounded-xl2 border border-border bg-surface p-4">
        <div className="grid gap-3 md:grid-cols-2">
          {!isStoreScopedUser && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Magaza *</label>
              <SearchableDropdown
                options={storeOptions}
                value={storeId}
                onChange={(value) => {
                  setErrors((prev) => ({ ...prev, storeId: undefined }));
                  setStoreId(value);
                }}
                placeholder="Magaza secin"
                showEmptyOption={false}
              />
              {errors.storeId && <p className="mt-1 text-xs text-error">{errors.storeId}</p>}
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Ad *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setErrors((prev) => ({ ...prev, name: undefined }));
                setName(e.target.value);
              }}
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {errors.name && <p className="mt-1 text-xs text-error">{errors.name}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Soyad *</label>
            <input
              type="text"
              value={surname}
              onChange={(e) => {
                setErrors((prev) => ({ ...prev, surname: undefined }));
                setSurname(e.target.value);
              }}
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {errors.surname && <p className="mt-1 text-xs text-error">{errors.surname}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Telefon</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Kaynak</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-muted">Not</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[72px] w-full rounded-xl border border-border bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl2 border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Satis Satirlari</h2>
          <Button label="+ Satir Ekle" onClick={addLine} variant="secondary" className="px-3 py-1.5" />
        </div>

        {loadingVariants ? (
          <p className="text-sm text-muted">Varyantlar yukleniyor...</p>
        ) : (
          <div className="space-y-3">
            {lines.map((line, index) => (
              <div key={line.rowId} className="rounded-xl border border-border bg-surface2/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted">Satir #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeLine(line.rowId)}
                    className="text-xs cursor-pointer text-error hover:text-error/80"
                    disabled={lines.length <= 1}
                  >
                    Kaldir
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <div className="lg:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-muted">Varyant *</label>
                    <VariantInfiniteDropdown
                      options={variantOptions}
                      value={line.productVariantId}
                      onChange={(value) => applyVariantPreset(line.rowId, value)}
                      placeholder="Varyant secin"
                      loading={loadingVariants}
                      loadingMore={loadingMoreVariants}
                      hasMore={variantHasMore}
                      onLoadMore={loadMoreVariants}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">Adet *</label>
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => onChangeLine(line.rowId, { quantity: e.target.value })}
                      className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">Para Birimi *</label>
                    <SearchableDropdown
                      options={CURRENCY_OPTIONS}
                      value={line.currency}
                      onChange={(value) => onChangeLine(line.rowId, { currency: (value || "TRY") as Currency })}
                      showEmptyOption={false}
                      allowClear={false}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">Birim Fiyat *</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) => onChangeLine(line.rowId, { unitPrice: e.target.value })}
                      className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">Indirim</label>
                    <div className="flex items-center gap-2">
                      <ModeToggle
                        mode={line.discountMode}
                        onToggle={(mode) =>
                          onChangeLine(line.rowId, {
                            discountMode: mode,
                            discountPercent: "",
                            discountAmount: "",
                          })
                        }
                      />
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.discountMode === "percent" ? line.discountPercent : line.discountAmount}
                        onChange={(e) =>
                          onChangeLine(
                            line.rowId,
                            line.discountMode === "percent"
                              ? { discountPercent: e.target.value }
                              : { discountAmount: e.target.value },
                          )
                        }
                        className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">Vergi</label>
                    <div className="flex items-center gap-2">
                      <ModeToggle
                        mode={line.taxMode}
                        onToggle={(mode) =>
                          onChangeLine(line.rowId, {
                            taxMode: mode,
                            taxPercent: "",
                            taxAmount: "",
                          })
                        }
                      />
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.taxMode === "percent" ? line.taxPercent : line.taxAmount}
                        onChange={(e) =>
                          onChangeLine(
                            line.rowId,
                            line.taxMode === "percent"
                              ? { taxPercent: e.target.value }
                              : { taxAmount: e.target.value },
                          )
                        }
                        className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">Satir Toplami (Otomatik)</label>
                    <div className="flex h-10 items-center rounded-xl border border-border bg-surface px-3 text-sm text-text2">
                      {formatPrice(calcLineTotal(line))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {errors.lines && <p className="mt-2 text-xs text-error">{errors.lines}</p>}
      </section>

      {(formError || success) && (
        <div className="rounded-xl border border-border bg-surface p-3">
          {formError && <p className="text-sm text-error">{formError}</p>}
          {success && <p className="text-sm text-primary">{success}</p>}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          label={submitting ? "Kaydediliyor..." : "Satisi Kaydet"}
          onClick={onSubmit}
          loading={submitting}
          variant="primarySolid"
          disabled={!scopeReady || loadingVariants}
        />
      </div>
    </div>
  );
}

function ModeToggle({
  mode,
  onToggle,
}: {
  mode: LineMode;
  onToggle: (mode: LineMode) => void;
}) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-lg border border-border">
      <button
        type="button"
        onClick={() => onToggle("percent")}
        className={`cursor-pointer px-2.5 py-1.5 text-xs font-medium transition-colors ${
          mode === "percent" ? "bg-primary/15 text-primary" : "bg-surface text-muted hover:bg-surface2"
        }`}
      >
        %
      </button>
      <button
        type="button"
        onClick={() => onToggle("amount")}
        className={`cursor-pointer px-2.5 py-1.5 text-xs font-medium transition-colors ${
          mode === "amount" ? "bg-primary/15 text-primary" : "bg-surface text-muted hover:bg-surface2"
        }`}
      >
        TL
      </button>
    </div>
  );
}

function VariantInfiniteDropdown({
  options,
  value,
  onChange,
  placeholder,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const rowHeight = 36;
  const viewportHeight = 240;
  const overscan = 4;

  const selected = useMemo(() => options.find((item) => item.value === value), [options, value]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((item) => item.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    const onOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setScrollTop(0);
      return;
    }
    requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  const totalHeight = filtered.length * rowHeight;
  const visibleCount = Math.ceil(viewportHeight / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(filtered.length, startIndex + visibleCount + overscan * 2);
  const visible = filtered.slice(startIndex, endIndex);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-left text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
      >
        <span className={selected ? "text-text" : "text-muted"}>
          {selected?.label ?? placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-border bg-surface p-1 shadow-lg shadow-primary/10">
          <div className="px-1 pb-1">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Varyant ara..."
              className="h-9 w-full rounded-lg border border-border bg-surface2 px-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div
            className="h-[240px] overflow-y-auto"
            onScroll={(e) => {
              const target = e.currentTarget;
              setScrollTop(target.scrollTop);
              const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - rowHeight * 2;
              if (nearBottom && hasMore && !loadingMore) onLoadMore();
            }}
          >
            {loading && options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted">Varyantlar yukleniyor...</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted">Sonuc bulunamadi.</div>
            ) : (
              <div className="relative" style={{ height: totalHeight }}>
                <div
                  className="absolute left-0 right-0"
                  style={{ transform: `translateY(${startIndex * rowHeight}px)` }}
                >
                  {visible.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        onChange(item.value);
                        setOpen(false);
                      }}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        value === item.value
                          ? "bg-primary/10 text-primary"
                          : "text-text2 hover:bg-surface2 hover:text-text"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {loadingMore && (
              <div className="px-3 py-2 text-xs text-muted">Daha fazla varyant yukleniyor...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
