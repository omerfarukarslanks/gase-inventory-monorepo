"use client";

import type { Store } from "@/lib/stores";
import type { Currency, ProductVariant } from "@/lib/products";
import type { Supplier } from "@/lib/suppliers";
import type { InventoryReceiveItem } from "@/lib/inventory";
import type { StockEntryInitialEntry } from "@/components/inventory/StockEntryForm";
import Drawer from "@/components/ui/Drawer";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import StockEntryForm from "@/components/inventory/StockEntryForm";
import { cn } from "@/lib/cn";

export type ReceiveTarget = {
  productVariantId?: string;
  productName: string;
  variantName?: string;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted">{label}</label>
      {children}
    </div>
  );
}

type ReceiveDrawerProps = {
  open: boolean;
  loading: boolean;
  submitting: boolean;
  formError: string;
  target: ReceiveTarget | null;
  variants: ProductVariant[];
  currency: Currency;
  stores: Store[];
  suppliers: Supplier[];
  supplierId: string;
  onSupplierChange: (id: string) => void;
  initialEntriesByVariant: Record<string, StockEntryInitialEntry[]>;
  isMobile: boolean;
  canTenantOnly?: boolean;
  fixedStoreId?: string;
  onClose: () => void;
  onSubmit: (items: InventoryReceiveItem[]) => Promise<void>;
};

export default function ReceiveDrawer({
  open,
  loading,
  submitting,
  formError,
  target,
  variants,
  currency,
  stores,
  suppliers,
  supplierId,
  onSupplierChange,
  initialEntriesByVariant,
  isMobile,
  canTenantOnly = true,
  fixedStoreId,
  onClose,
  onSubmit,
}: ReceiveDrawerProps) {
  const supplierOptions = suppliers.map((s) => ({
    value: s.id,
    label: s.surname ? `${s.name} ${s.surname}` : s.name,
  }));

  const handleSubmit = async (items: InventoryReceiveItem[]) => {
    const itemsWithSupplier = supplierId
      ? items.map((item) => ({ ...item, supplierId }))
      : items;
    await onSubmit(itemsWithSupplier);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title="Stok Girisi"
      description={target ? `${target.productName}${target.variantName ? ` / ${target.variantName}` : ""}` : ""}
      closeDisabled={submitting}
      className={cn(isMobile ? "!max-w-none" : "!max-w-[600px]")}
      mobileFullscreen
    >
      <div className="space-y-3 p-5">
        {loading ? (
          <p className="text-sm text-muted">Bilgiler yukleniyor...</p>
        ) : (
          <>
            <Field label="Tedarikci">
              <SearchableDropdown
                options={supplierOptions}
                value={supplierId}
                onChange={onSupplierChange}
                placeholder="Tedarikci secin (isteğe baglı)"
                showEmptyOption
              />
            </Field>

            <StockEntryForm
              variants={variants}
              productCurrency={currency}
              stores={stores}
              initialEntriesByVariant={initialEntriesByVariant}
              mode="receive"
              showStoreSelector={canTenantOnly}
              fixedStoreId={fixedStoreId}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </>
        )}

        {formError && <p className="text-sm text-error">{formError}</p>}
      </div>
    </Drawer>
  );
}
