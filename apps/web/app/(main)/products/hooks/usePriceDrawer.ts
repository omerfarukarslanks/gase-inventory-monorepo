"use client";
import { useState } from "react";
import type { PriceTarget } from "@/components/stock/PriceDrawer";
import type { Product } from "@/lib/products";

type Options = {
  onSuccess: () => Promise<void>;
};

export function usePriceDrawer({ onSuccess: _onSuccess }: Options) {
  const [priceOpen, setPriceOpen] = useState(false);
  const [priceTarget, setPriceTarget] = useState<PriceTarget | null>(null);
  const [priceProductId, setPriceProductId] = useState<string | null>(null);

  const openProductPriceDrawer = (product: Product) => {
    setPriceTarget({
      mode: "product",
      productId: product.id,
      productName: product.name,
      stores: [],
      initial: {
        unitPrice: product.unitPrice ?? null,
        currency: product.currency ?? "TRY",
        discountPercent: product.discountPercent ?? null,
        discountAmount: product.discountAmount ?? null,
        taxPercent: product.taxPercent ?? null,
        taxAmount: product.taxAmount ?? null,
        lineTotal: product.lineTotal ?? null,
      },
    });
    setPriceProductId(product.id);
    setPriceOpen(true);
  };

  const closePriceDrawer = () => {
    setPriceOpen(false);
    setPriceTarget(null);
    setPriceProductId(null);
  };

  return {
    priceOpen,
    priceTarget,
    priceProductId,
    openProductPriceDrawer,
    closePriceDrawer,
  };
}
