"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Currency, ProductVariant } from "@/lib/products";
import type { Store } from "@/lib/stores";
import type { InventoryReceiveItem } from "@/lib/inventory";
import { getRate } from "@/lib/currency";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import CollapsiblePanel from "@/components/ui/CollapsiblePanel";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { CURRENCY_OPTIONS } from "@/components/products/types";

/* ── Types ── */

type TaxMode = "percent" | "amount";
type DiscountMode = "percent" | "amount";

/** A single store entry within a variant */
type StoreEntry = {
  entryKey: string;
  storeId: string;
  quantity: string;
  unitPrice: string;
  currency: Currency;
  taxMode: TaxMode;
  taxPercent: string;
  taxAmount: string;
  discountMode: DiscountMode;
  discountPercent: string;
  discountAmount: string;
  reason: string;
  note: string;
};

/** All store entries for a single variant */
type VariantBlock = {
  variantId: string;
  variantName: string;
  entries: StoreEntry[];
};

type Props = {
  variants: ProductVariant[];
  productCurrency: Currency;
  stores: Store[];
  onSubmit: (items: InventoryReceiveItem[]) => Promise<void>;
  submitting?: boolean;
  initialEntriesByVariant?: Record<string, StockEntryInitialEntry[]>;
  mode?: "receive" | "adjust";
  showStoreSelector?: boolean;
  fixedStoreId?: string;
};

export type StockEntryInitialEntry = {
  storeId: string;
  quantity?: number | string;
  unitPrice?: number | string;
  currency?: Currency;
  taxMode?: TaxMode;
  taxPercent?: number | string;
  taxAmount?: number | string;
  discountMode?: DiscountMode;
  discountPercent?: number | string;
  discountAmount?: number | string;
  reason?: string;
  note?: string;
};

/* ── Helpers ── */

let entryCounter = 0;
function createEntryKey() {
  return `entry-${Date.now()}-${++entryCounter}`;
}

function createEmptyEntry(defaultCurrency: Currency, fixedStoreId?: string): StoreEntry {
  return {
    entryKey: createEntryKey(),
    storeId: fixedStoreId ?? "",
    quantity: "",
    unitPrice: "",
    currency: defaultCurrency,
    taxMode: "percent",
    taxPercent: "",
    taxAmount: "",
    discountMode: "percent",
    discountPercent: "",
    discountAmount: "",
    reason: "",
    note: "",
  };
}

function createEntryFromInitial(
  defaultCurrency: Currency,
  initial: StockEntryInitialEntry,
  fixedStoreId?: string,
): StoreEntry {
  const taxMode: TaxMode =
    initial.taxMode ?? (initial.taxAmount != null && initial.taxAmount !== "" ? "amount" : "percent");
  const discountMode: DiscountMode =
    initial.discountMode ?? (initial.discountAmount != null && initial.discountAmount !== "" ? "amount" : "percent");

  return {
    entryKey: createEntryKey(),
    storeId: initial.storeId ?? fixedStoreId ?? "",
    quantity: initial.quantity != null ? String(initial.quantity) : "",
    unitPrice: initial.unitPrice != null ? String(initial.unitPrice) : "",
    currency: initial.currency ?? defaultCurrency,
    taxMode,
    taxPercent: initial.taxPercent != null ? String(initial.taxPercent) : "",
    taxAmount: initial.taxAmount != null ? String(initial.taxAmount) : "",
    discountMode,
    discountPercent: initial.discountPercent != null ? String(initial.discountPercent) : "",
    discountAmount: initial.discountAmount != null ? String(initial.discountAmount) : "",
    reason: initial.reason ?? "",
    note: initial.note ?? "",
  };
}

/**
 * Checks how "complete" an entry is based on the 3 required fields.
 * - "empty"   → user touched nothing, skip entirely
 * - "partial" → user filled some but not all required fields, needs validation error
 * - "filled"  → all 3 required fields present, ready for full validation
 */
function getEntryStatus(
  entry: StoreEntry,
  requirePrice: boolean,
): "empty" | "partial" | "filled" {
  const has = {
    store: Boolean(entry.storeId),
    qty: Boolean(entry.quantity && Number(entry.quantity) > 0),
    price: !requirePrice || Boolean(entry.unitPrice && Number(entry.unitPrice) > 0),
  };

  const filledCount = [has.store, has.qty, has.price].filter(Boolean).length;

  if (filledCount === 0) return "empty";
  if (filledCount === 3) return "filled";
  return "partial";
}

function calcEntryTotal(entry: StoreEntry, rates: Record<string, number>): number {
  const qty = Number(entry.quantity) || 0;
  const price = Number(entry.unitPrice) || 0;
  const rate = rates[entry.currency] ?? 1;

  const subtotal = price * qty * rate;

  let tax = 0;
  if (entry.taxMode === "percent") {
    tax = subtotal * ((Number(entry.taxPercent) || 0) / 100);
  } else {
    tax = Number(entry.taxAmount) || 0;
  }
  const subtotalWithTax = subtotal + tax;

  let discount = 0;
  if (entry.discountMode === "percent") {
    discount = subtotalWithTax * ((Number(entry.discountPercent) || 0) / 100);
  } else {
    discount = Number(entry.discountAmount) || 0;
  }

  return subtotalWithTax - discount;
}

/* ── Component ── */

export default function StockEntryForm({
  variants,
  productCurrency,
  stores,
  onSubmit,
  submitting = false,
  initialEntriesByVariant,
  mode = "receive",
  showStoreSelector = true,
  fixedStoreId,
}: Props) {
  const isAdjustMode = mode === "adjust";
  const [blocks, setBlocks] = useState<VariantBlock[]>([]);
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());
  const [rates, setRates] = useState<Record<string, number>>({ TRY: 1 });
  const [rateLoading, setRateLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({}); // keyed by entryKey

  // Initialize blocks from variants
  useEffect(() => {
    setBlocks(
      variants.map((v) => {
        const initialEntries = initialEntriesByVariant?.[v.id] ?? [];
        return {
          variantId: v.id,
          variantName: v.name,
          entries:
            initialEntries.length > 0
              ? initialEntries.map((entry) => createEntryFromInitial(productCurrency, entry, fixedStoreId))
              : [createEmptyEntry(productCurrency, fixedStoreId)],
        };
      }),
    );
    if (variants.length > 0) {
      setExpandedVariants(new Set([variants[0].id]));
    }
  }, [variants, productCurrency, initialEntriesByVariant, fixedStoreId]);

  // Collect all active currencies
  const activeCurrencies = useMemo(() => {
    if (isAdjustMode) return ["TRY"] as Currency[];
    const currencies = new Set<Currency>();
    for (const block of blocks) {
      for (const entry of block.entries) {
        currencies.add(entry.currency);
      }
    }
    return [...currencies];
  }, [blocks, isAdjustMode]);

  // Fetch exchange rates
  useEffect(() => {
    let cancelled = false;
    async function fetchRates() {
      if (isAdjustMode) {
        setRates({ TRY: 1 });
        setRateLoading(false);
        return;
      }
      setRateLoading(true);
      const newRates: Record<string, number> = { TRY: 1 };
      for (const cur of activeCurrencies) {
        if (cur === "TRY") continue;
        try {
          newRates[cur] = await getRate(cur);
        } catch {
          newRates[cur] = 1;
        }
      }
      if (!cancelled) {
        setRates(newRates);
        setRateLoading(false);
      }
    }
    fetchRates();
    return () => { cancelled = true; };
  }, [activeCurrencies, isAdjustMode]);

  const storeOptions = useMemo(
    () => stores.filter((s) => s.isActive).map((s) => ({ value: s.id, label: s.name })),
    [stores],
  );

  /* ── Block / Entry updaters ── */

  const updateEntry = useCallback(
    (variantId: string, entryKey: string, patch: Partial<StoreEntry>) => {
      setBlocks((prev) =>
        prev.map((b) =>
          b.variantId !== variantId
            ? b
            : {
                ...b,
                entries: b.entries.map((e) =>
                  e.entryKey !== entryKey ? e : { ...e, ...patch },
                ),
              },
        ),
      );
      setErrors((prev) => {
        const next = { ...prev };
        delete next[entryKey];
        return next;
      });
    },
    [],
  );

  const addEntry = useCallback(
    (variantId: string) => {
      setBlocks((prev) =>
        prev.map((b) =>
          b.variantId !== variantId
            ? b
            : { ...b, entries: [...b.entries, createEmptyEntry(productCurrency, fixedStoreId)] },
        ),
      );
    },
    [productCurrency, fixedStoreId],
  );

  const removeEntry = useCallback((variantId: string, entryKey: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.variantId !== variantId) return b;
        // Dont remove last entry
        if (b.entries.length <= 1) return b;
        return { ...b, entries: b.entries.filter((e) => e.entryKey !== entryKey) };
      }),
    );
  }, []);

  /* ── Apply first entry values to all entries in the same variant ── */
  const applyFirstEntryToAll = useCallback((variantId: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.variantId !== variantId || b.entries.length < 2) return b;
        const first = b.entries[0];
        return {
          ...b,
          entries: b.entries.map((e, i) =>
            i === 0
              ? e
              : {
                  ...e,
                  ...(isAdjustMode
                    ? {
                        reason: first.reason,
                        note: first.note,
                      }
                    : {
                        unitPrice: first.unitPrice,
                        currency: first.currency,
                        taxMode: first.taxMode,
                        taxPercent: first.taxPercent,
                        taxAmount: first.taxAmount,
                        discountMode: first.discountMode,
                        discountPercent: first.discountPercent,
                        discountAmount: first.discountAmount,
                        reason: first.reason,
                        note: first.note,
                      }),
                },
          ),
        };
      }),
    );
  }, [isAdjustMode]);

  /* ── Apply first variant's first entry to ALL variants' ALL entries (shared fields only) ── */
  const applyFirstToAllVariants = useCallback(() => {
    if (blocks.length < 2) return;
    const firstEntry = blocks[0]?.entries[0];
    if (!firstEntry) return;

    setBlocks((prev) =>
      prev.map((b, bi) => ({
        ...b,
        entries: b.entries.map((e, ei) =>
          bi === 0 && ei === 0
            ? e
            : {
                ...e,
                ...(isAdjustMode
                  ? {
                      reason: firstEntry.reason,
                      note: firstEntry.note,
                    }
                  : {
                      unitPrice: firstEntry.unitPrice,
                      currency: firstEntry.currency,
                      taxMode: firstEntry.taxMode,
                      taxPercent: firstEntry.taxPercent,
                      taxAmount: firstEntry.taxAmount,
                      discountMode: firstEntry.discountMode,
                      discountPercent: firstEntry.discountPercent,
                      discountAmount: firstEntry.discountAmount,
                      reason: firstEntry.reason,
                      note: firstEntry.note,
                    }),
              },
        ),
      })),
    );
  }, [blocks, isAdjustMode]);

  /* ── Toggle variant panel ── */
  const toggleVariant = useCallback((variantId: string) => {
    setExpandedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(variantId)) next.delete(variantId);
      else next.add(variantId);
      return next;
    });
  }, []);

  /* ── Categorise all entries by status ── */
  const categoriseEntries = useCallback(() => {
    const filled: { block: VariantBlock; entry: StoreEntry }[] = [];
    const partial: { block: VariantBlock; entry: StoreEntry }[] = [];

    for (const block of blocks) {
      for (const entry of block.entries) {
        const status = getEntryStatus(entry, !isAdjustMode);
        if (status === "filled") filled.push({ block, entry });
        else if (status === "partial") partial.push({ block, entry });
        // "empty" → skip entirely
      }
    }

    return { filled, partial };
  }, [blocks, isAdjustMode]);

  /* ── Validation (partial entries get specific missing-field errors) ── */
  const validate = useCallback(
    (filled: { block: VariantBlock; entry: StoreEntry }[], partial: { block: VariantBlock; entry: StoreEntry }[]): boolean => {
      const nextErrors: Record<string, string[]> = {};
      let valid = true;

      // Partial entries: user started filling but didn't complete all required fields
      for (const { entry } of partial) {
        const errs: string[] = [];
        if (showStoreSelector && !entry.storeId) errs.push("Magaza secimi zorunludur");
        if (!entry.quantity || Number(entry.quantity) <= 0) errs.push("Miktar 0'dan buyuk olmalidir");
        if (!isAdjustMode && (!entry.unitPrice || Number(entry.unitPrice) <= 0)) errs.push("Birim fiyat 0'dan buyuk olmalidir");
        if (errs.length > 0) {
          nextErrors[entry.entryKey] = errs;
          valid = false;
        }
      }

      // Filled entries: all 3 required fields present — extra sanity check
      for (const { entry } of filled) {
        const errs: string[] = [];
        if (showStoreSelector && !entry.storeId) errs.push("Magaza secimi zorunludur");
        if (!entry.quantity || Number(entry.quantity) <= 0) errs.push("Miktar 0'dan buyuk olmalidir");
        if (!isAdjustMode && (!entry.unitPrice || Number(entry.unitPrice) <= 0)) errs.push("Birim fiyat 0'dan buyuk olmalidir");
        if (errs.length > 0) {
          nextErrors[entry.entryKey] = errs;
          valid = false;
        }
      }

      setErrors(nextErrors);
      return valid;
    },
    [isAdjustMode, showStoreSelector],
  );

  /* ── Submit ── */
  const handleSubmit = useCallback(async () => {
    const { filled, partial } = categoriseEntries();

    // Nothing touched at all — submit empty array (caller decides what to do)
    if (filled.length === 0 && partial.length === 0) {
      await onSubmit([]);
      return;
    }

    // Validate both partial and filled entries
    if (!validate(filled, partial)) return;

    const items: InventoryReceiveItem[] = filled.map(({ block, entry }) => {
      const lineTotal = isAdjustMode ? 0 : calcEntryTotal(entry, rates);
      const item: InventoryReceiveItem = {
        storeId: entry.storeId || fixedStoreId || "",
        productVariantId: block.variantId,
        quantity: Number(entry.quantity),
        currency: isAdjustMode ? productCurrency : entry.currency,
        unitPrice: isAdjustMode ? 0 : Number(entry.unitPrice),
        lineTotal: Math.round(lineTotal * 100) / 100,
      };

      if (!isAdjustMode && entry.taxMode === "percent" && entry.taxPercent) {
        item.taxPercent = Number(entry.taxPercent);
      } else if (!isAdjustMode && entry.taxMode === "amount" && entry.taxAmount) {
        item.taxAmount = Number(entry.taxAmount);
      }

      if (!isAdjustMode && entry.discountMode === "percent" && entry.discountPercent) {
        item.discountPercent = Number(entry.discountPercent);
      } else if (!isAdjustMode && entry.discountMode === "amount" && entry.discountAmount) {
        item.discountAmount = Number(entry.discountAmount);
      }

      if (entry.reason || entry.note) {
        item.meta = {
          reason: entry.reason || undefined,
          note: entry.note || undefined,
        };
      }

      return item;
    });

    await onSubmit(items);
  }, [categoriseEntries, fixedStoreId, isAdjustMode, onSubmit, productCurrency, rates, validate]);

  /* ── Render ── */

  if (variants.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted">
        Stok girisi yapilacak varyant bulunamadi.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Apply to all variants button */}
      {blocks.length > 1 && (
        <div className="flex justify-end">
          <Button
            label="Ilk Varyanttaki Degerleri Tumune Uygula"
            variant="primarySoft"
            onClick={applyFirstToAllVariants}
            className="px-3 py-1.5 text-xs"
          />
        </div>
      )}

      {!isAdjustMode && (
        <>
          {/* Currency rate info */}
          {rateLoading && (
            <div className="text-xs text-muted">Doviz kurlari yukleniyor...</div>
          )}
          {!rateLoading && activeCurrencies.some((c) => c !== "TRY") && (
            <div className="rounded-xl border border-border bg-surface2/30 px-3 py-2 text-xs text-muted">
              Guncel Kurlar:{" "}
              {activeCurrencies
                .filter((c) => c !== "TRY")
                .map((c) => `1 ${c} = ${formatPrice(rates[c] ?? 1)} TRY`)
                .join(" | ")}
            </div>
          )}
        </>
      )}

      {/* Variant blocks */}
      {blocks.map((block) => {
        const variantTotal = block.entries.reduce(
          (sum, entry) => sum + calcEntryTotal(entry, rates),
          0,
        );

        return (
          <CollapsiblePanel
            key={block.variantId}
            title={
              <span className="flex items-center gap-2">
                <span>{block.variantName}</span>
                <span className="rounded-full bg-surface2 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                  {block.entries.length} magaza
                </span>
                {!isAdjustMode && variantTotal > 0 && (
                  <span className="ml-1 rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {formatPrice(variantTotal)} TRY
                  </span>
                )}
              </span>
            }
            open={expandedVariants.has(block.variantId)}
            onToggle={() => toggleVariant(block.variantId)}
          >
            <div className="space-y-4">
              {block.entries.map((entry, ei) => {
                const entryTotal = calcEntryTotal(entry, rates);
                const entryErrors = errors[entry.entryKey];
                const storeName = storeOptions.find((s) => s.value === entry.storeId)?.label;

                return (
                  <div
                    key={entry.entryKey}
                    className={cn(
                      "space-y-3 rounded-xl border border-border/60 bg-surface/50 p-3",
                      entryErrors && "border-error/40",
                    )}
                  >
                    {/* Entry header */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted">
                        Magaza #{ei + 1}
                        {storeName && <span className="ml-1 text-text">- {storeName}</span>}
                      </span>
                      <div className="flex items-center gap-2">
                        {!isAdjustMode && entryTotal > 0 && (
                          <span className="text-xs font-medium text-primary">
                            {formatPrice(entryTotal)} TRY
                          </span>
                        )}
                        {block.entries.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEntry(block.variantId, entry.entryKey)}
                            className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-error/10 hover:text-error transition-colors"
                            aria-label="Magaza satirini sil"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6 6 18" />
                              <path d="m6 6 12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Errors */}
                    {entryErrors && (
                      <div className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">
                        {entryErrors.map((e, i) => (
                          <div key={i}>{e}</div>
                        ))}
                      </div>
                    )}

                    {/* Store & Quantity */}
                    <div className={cn("grid grid-cols-1 gap-3", showStoreSelector && "md:grid-cols-2")}>
                      {showStoreSelector && (
                        <FieldGroup label="Magaza *">
                          <SearchableDropdown
                            options={storeOptions}
                            value={entry.storeId}
                            onChange={(v) => updateEntry(block.variantId, entry.entryKey, { storeId: v })}
                            placeholder="Magaza seciniz"
                            showEmptyOption={false}
                          />
                        </FieldGroup>
                      )}
                      <FieldGroup label="Miktar *">
                        <NumberInput
                          value={entry.quantity}
                          onChange={(v) => updateEntry(block.variantId, entry.entryKey, { quantity: v })}
                          placeholder="0"
                        />
                      </FieldGroup>
                    </div>

                    {!isAdjustMode && (
                      <>
                        {/* Price & Currency */}
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <FieldGroup label="Birim Fiyat *">
                            <NumberInput
                              value={entry.unitPrice}
                              onChange={(v) => updateEntry(block.variantId, entry.entryKey, { unitPrice: v })}
                              placeholder="0.00"
                            />
                          </FieldGroup>
                          <FieldGroup label="Para Birimi">
                            <SearchableDropdown
                              options={CURRENCY_OPTIONS}
                              value={entry.currency}
                              onChange={(v) =>
                                updateEntry(block.variantId, entry.entryKey, { currency: v as Currency })
                              }
                              showEmptyOption={false}
                              allowClear={false}
                            />
                          </FieldGroup>
                        </div>

                        {/* Tax & Discount */}
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <FieldGroup label="Vergi">
                            <div className="flex items-center gap-2">
                              <ModeToggle
                                mode={entry.taxMode}
                                onToggle={(m) =>
                                  updateEntry(block.variantId, entry.entryKey, {
                                    taxMode: m,
                                    taxPercent: "",
                                    taxAmount: "",
                                  })
                                }
                              />
                              <NumberInput
                                value={entry.taxMode === "percent" ? entry.taxPercent : entry.taxAmount}
                                onChange={(v) =>
                                  updateEntry(
                                    block.variantId,
                                    entry.entryKey,
                                    entry.taxMode === "percent" ? { taxPercent: v } : { taxAmount: v },
                                  )
                                }
                                placeholder={entry.taxMode === "percent" ? "% 0" : "0.00"}
                              />
                            </div>
                          </FieldGroup>
                          <FieldGroup label="Indirim">
                            <div className="flex items-center gap-2">
                              <ModeToggle
                                mode={entry.discountMode}
                                onToggle={(m) =>
                                  updateEntry(block.variantId, entry.entryKey, {
                                    discountMode: m,
                                    discountPercent: "",
                                    discountAmount: "",
                                  })
                                }
                              />
                              <NumberInput
                                value={
                                  entry.discountMode === "percent"
                                    ? entry.discountPercent
                                    : entry.discountAmount
                                }
                                onChange={(v) =>
                                  updateEntry(
                                    block.variantId,
                                    entry.entryKey,
                                    entry.discountMode === "percent"
                                      ? { discountPercent: v }
                                      : { discountAmount: v },
                                  )
                                }
                                placeholder={entry.discountMode === "percent" ? "% 0" : "0.00"}
                              />
                            </div>
                          </FieldGroup>
                        </div>
                      </>
                    )}

                    {/* Optional fields */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <FieldGroup label="Sebep">
                        <TextInput
                          value={entry.reason}
                          onChange={(v) =>
                            updateEntry(block.variantId, entry.entryKey, { reason: v })
                          }
                          placeholder="Stok giris sebebi"
                        />
                      </FieldGroup>
                      <FieldGroup label="Not">
                        <TextInput
                          value={entry.note}
                          onChange={(v) =>
                            updateEntry(block.variantId, entry.entryKey, { note: v })
                          }
                          placeholder="Aciklama"
                        />
                      </FieldGroup>
                    </div>
                  </div>
                );
              })}

              {/* Add store entry + apply to all entries */}
              <div className="flex items-center justify-between">
                {showStoreSelector ? (
                  <button
                    type="button"
                    onClick={() => addEntry(block.variantId)}
                    className="text-xs cursor-pointer font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    + Magaza Ekle
                  </button>
                ) : (
                  <span />
                )}
                {block.entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => applyFirstEntryToAll(block.variantId)}
                    className="text-[11px] cursor-pointer font-medium text-muted hover:text-text transition-colors"
                  >
                    Ilk satirdan kopyala
                  </button>
                )}
              </div>

              {/* Variant total */}
              {!isAdjustMode && block.entries.length > 1 && (
                <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
                  <span className="text-xs font-medium text-text2">Varyant Toplami</span>
                  <span className="text-sm font-bold text-primary">
                    {formatPrice(
                      block.entries.reduce((s, e) => s + calcEntryTotal(e, rates), 0),
                    )}{" "}
                    TRY
                  </span>
                </div>
              )}
            </div>
          </CollapsiblePanel>
        );
      })}

      {/* Submit */}
      <div className="space-y-3 pt-2">
        {!isAdjustMode && (
          <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <span className="text-sm font-semibold text-text">Genel Toplam</span>
            <span className="text-lg font-bold text-primary">
              {formatPrice(
                blocks.reduce(
                  (total, block) =>
                    total + block.entries.reduce((s, e) => s + calcEntryTotal(e, rates), 0),
                  0,
                ),
              )}{" "}
              TRY
            </span>
          </div>
        )}
        <div className="flex justify-end">
          <Button
            label={isAdjustMode ? "Stok Duzeltmeyi Kaydet" : "Stok Girisini Kaydet"}
            variant="primarySolid"
            onClick={handleSubmit}
            loading={submitting}
            className="px-6 py-2.5"
          />
        </div>
      </div>
    </div>
  );
}

/* ── Tiny sub-components ── */

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold tracking-[0.3px] text-text2">
        {label}
      </label>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "" || /^[0-9]*[.,]?[0-9]*$/.test(v)) {
          onChange(v.replace(",", "."));
        }
      }}
      placeholder={placeholder}
      className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
    />
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
    />
  );
}

function ModeToggle({
  mode,
  onToggle,
}: {
  mode: "percent" | "amount";
  onToggle: (m: "percent" | "amount") => void;
}) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-lg border border-border">
      <button
        type="button"
        onClick={() => onToggle("percent")}
        className={cn(
          "px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
          mode === "percent"
            ? "bg-primary/15 text-primary"
            : "bg-surface text-muted hover:bg-surface2",
        )}
      >
        %
      </button>
      <button
        type="button"
        onClick={() => onToggle("amount")}
        className={cn(
          "px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
          mode === "amount"
            ? "bg-primary/15 text-primary"
            : "bg-surface text-muted hover:bg-surface2",
        )}
      >
        TL
      </button>
    </div>
  );
}
