"use client";

import type { Store } from "@/lib/stores";
import type { Currency, ProductVariant } from "@/lib/products";
import type { InventoryReceiveItem } from "@/lib/inventory";
import type { StockEntryInitialEntry } from "@/components/inventory/StockEntryForm";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import StockEntryForm from "@/components/inventory/StockEntryForm";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { cn } from "@/lib/cn";

export type AdjustTarget = {
  productVariantId: string;
  productName: string;
  variantName: string;
};

type AdjustDrawerProps = {
  open: boolean;
  loading: boolean;
  submitting: boolean;
  formError: string;
  target: AdjustTarget | null;
  variants: ProductVariant[];
  currency: Currency;
  stores: Store[];
  initialEntriesByVariant: Record<string, StockEntryInitialEntry[]>;
  isMobile: boolean;
  showStoreSelector?: boolean;
  showApplyToAllStores?: boolean;
  applyToAllStores?: boolean;
  onApplyToAllStoresChange?: (checked: boolean) => void;
  fixedStoreId?: string;
  onClose: () => void;
  onSubmit: (items: InventoryReceiveItem[]) => Promise<void>;
};

export default function AdjustDrawer({
  open,
  loading,
  submitting,
  formError,
  target,
  variants,
  currency,
  stores,
  initialEntriesByVariant,
  isMobile,
  showStoreSelector = true,
  showApplyToAllStores = false,
  applyToAllStores = false,
  onApplyToAllStoresChange,
  fixedStoreId,
  onClose,
  onSubmit,
}: AdjustDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title="Stok Duzeltme"
      description={target ? `${target.productName} / ${target.variantName}` : ""}
      closeDisabled={submitting}
      className={cn(isMobile ? "!max-w-none" : "!max-w-[560px]")}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            label="Iptal"
            type="button"
            onClick={onClose}
            disabled={submitting}
            variant="secondary"
          />
        </div>
      }
    >
      <div className="space-y-3 p-5">
        {loading ? (
          <p className="text-sm text-muted">Magaza bilgileri yukleniyor...</p>
        ) : (
          <>
            {showApplyToAllStores && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-surface2/40 px-3 py-2.5">
                <span className="text-xs font-semibold text-muted">Tum Magazalara Uygula</span>
                <ToggleSwitch
                  checked={applyToAllStores}
                  onChange={(checked) => onApplyToAllStoresChange?.(checked)}
                  disabled={submitting}
                />
              </div>
            )}
            <StockEntryForm
              variants={variants}
              productCurrency={currency}
              stores={stores}
              initialEntriesByVariant={initialEntriesByVariant}
              mode="adjust"
              showStoreSelector={showStoreSelector}
              fixedStoreId={fixedStoreId}
              onSubmit={onSubmit}
              submitting={submitting}
            />
          </>
        )}

        {formError && <p className="text-sm text-error">{formError}</p>}
      </div>
    </Drawer>
  );
}
