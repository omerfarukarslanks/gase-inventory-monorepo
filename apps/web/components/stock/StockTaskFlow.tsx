"use client";

import { useEffect, useMemo, useState } from "react";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import type {
  InventoryProductStockItem,
  InventoryVariantStockItem,
  InventoryStoreStockItem,
} from "@/lib/inventory";
import type { ProductInventoryOperation } from "@/components/stock/ProductInventoryDrawer";
import type { VariantActionParams } from "@/components/stock/StockTable";

export type StockMobileView = "list" | "task" | "success";
export type StockTaskMode = "task" | "success";
export type StockTaskStep = "product" | "variant" | "operation" | "success";

type StockTaskFlowProps = {
  open: boolean;
  mode: StockTaskMode;
  products: InventoryProductStockItem[];
  initialProduct: InventoryProductStockItem | null;
  successMessage: string;
  onClose: () => void;
  onStartOperation: (params: VariantActionParams, operation: ProductInventoryOperation) => void;
  onStartAnother: () => void;
};

const OPERATION_OPTIONS: Array<{ key: ProductInventoryOperation; title: string; description: string }> = [
  {
    key: "receive",
    title: "Stok Girisi",
    description: "Secili varyant icin stok miktari ekleyin.",
  },
  {
    key: "adjust",
    title: "Stok Duzeltme",
    description: "Fiziksel sayim sonucuna gore miktari guncelleyin.",
  },
  {
    key: "transfer",
    title: "Transfer",
    description: "Magazalar arasinda stok hareketi baslatin.",
  },
];

function formatNumber(value: number | null | undefined) {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return "0";
  return numeric.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

export default function StockTaskFlow({
  open,
  mode,
  products,
  initialProduct,
  successMessage,
  onClose,
  onStartOperation,
  onStartAnother,
}: StockTaskFlowProps) {
  const [step, setStep] = useState<StockTaskStep>("product");
  const [selectedProduct, setSelectedProduct] = useState<InventoryProductStockItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<InventoryVariantStockItem | null>(null);

  useEffect(() => {
    if (!open || mode !== "task") return;
    setSelectedProduct(initialProduct);
    setSelectedVariant(null);
    setStep(initialProduct ? "variant" : "product");
  }, [initialProduct, mode, open]);

  const selectedVariantStores = useMemo<InventoryStoreStockItem[]>(
    () => selectedVariant?.stores ?? [],
    [selectedVariant],
  );

  const handleBack = () => {
    if (mode === "success") {
      onClose();
      return;
    }

    if (step === "operation") {
      setStep("variant");
      return;
    }
    if (step === "variant") {
      if (initialProduct) {
        onClose();
      } else {
        setStep("product");
        setSelectedProduct(null);
      }
      return;
    }

    onClose();
  };

  const renderTaskContent = () => {
    if (mode === "success") {
      return (
        <div className="space-y-4">
          <div className="rounded-xl2 border border-primary/30 bg-primary/10 p-4">
            <p className="text-sm font-semibold text-primary">{successMessage || "Islem tamamlandi."}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
            Mobil gorev akisi tamamlandi. Isterseniz yeni bir urun icin ayni akisla devam edebilirsiniz.
          </div>
        </div>
      );
    }

    if (step === "product") {
      return (
        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
              Islem baslatmak icin urun bulunamadi.
            </div>
          ) : (
            products.map((product) => (
              <button
                key={product.productId}
                type="button"
                onClick={() => {
                  setSelectedProduct(product);
                  setSelectedVariant(null);
                  setStep("variant");
                }}
                className="w-full rounded-xl2 border border-border bg-surface p-4 text-left transition-colors hover:bg-surface2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-text">{product.productName}</div>
                    <div className="mt-1 text-xs text-muted">{(product.variants ?? []).length} varyant</div>
                  </div>
                  <span className="text-sm font-semibold text-primary">{formatNumber(product.totalQuantity)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      );
    }

    if (step === "variant") {
      const variants = selectedProduct?.variants ?? [];
      return (
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-surface2/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Secili Urun</p>
            <p className="mt-2 text-sm font-semibold text-text">{selectedProduct?.productName ?? "-"}</p>
          </div>

          {variants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
              Bu urun icin varyant bulunamadi.
            </div>
          ) : (
            variants.map((variant) => (
              <button
                key={variant.productVariantId}
                type="button"
                onClick={() => {
                  setSelectedVariant(variant);
                  setStep("operation");
                }}
                className="w-full rounded-xl2 border border-border bg-surface p-4 text-left transition-colors hover:bg-surface2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-text">{variant.variantName}</div>
                    <div className="mt-1 text-xs text-muted">{variant.variantCode ?? "-"}</div>
                  </div>
                  <span className="text-sm font-semibold text-primary">{formatNumber(variant.totalQuantity)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-surface2/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Secili Varyant</p>
          <p className="mt-2 text-sm font-semibold text-text">{selectedVariant?.variantName ?? "-"}</p>
          <p className="mt-1 text-xs text-muted">{selectedProduct?.productName ?? "-"}</p>
          {selectedVariantStores.length > 0 ? (
            <p className="mt-2 text-xs text-muted">
              {selectedVariantStores.length} magazada stok kaydi bulundu.
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          {OPERATION_OPTIONS.map((operation) => (
            <button
              key={operation.key}
              type="button"
              onClick={() => {
                if (!selectedProduct || !selectedVariant) return;
                onStartOperation(
                  {
                    productVariantId: selectedVariant.productVariantId,
                    productName: selectedProduct.productName,
                    variantName: selectedVariant.variantName,
                    stores: selectedVariantStores,
                  },
                  operation.key,
                );
              }}
              className="w-full rounded-xl2 border border-border bg-surface p-4 text-left transition-colors hover:bg-surface2"
            >
              <div className="text-sm font-semibold text-text">{operation.title}</div>
              <p className="mt-1 text-sm text-muted">{operation.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={mode === "success" ? "Islem Tamamlandi" : "Stok Gorev Akisi"}
      description={
        mode === "success"
          ? "Stok operasyonu tamamlandi."
          : step === "product"
            ? "Bir urun secin."
            : step === "variant"
              ? "Bir varyant secin."
              : "Islem tipini secin."
      }
      mobileFullscreen
      footer={
        mode === "success" ? (
          <div className="flex items-center justify-between gap-2">
            <Button label="Listeye Don" onClick={onClose} variant="secondary" className="min-w-[120px]" />
            <Button label="Yeni Islem" onClick={onStartAnother} variant="primarySolid" className="min-w-[120px]" />
          </div>
        ) : (
          <div className="flex items-center justify-start gap-2">
            <Button
              label={step === "product" ? "Kapat" : "Geri"}
              onClick={handleBack}
              variant="secondary"
              className="min-w-[96px]"
            />
          </div>
        )
      }
    >
      <div className="space-y-4 p-5">
        {mode === "task" ? (
          <div className="flex flex-wrap gap-2">
            {[
              { key: "product", label: "Urun" },
              { key: "variant", label: "Varyant" },
              { key: "operation", label: "Islem" },
            ].map((item) => (
              <span
                key={item.key}
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  item.key === step
                    ? "bg-primary text-white"
                    : ["product", "variant", "operation"].indexOf(item.key) <
                        ["product", "variant", "operation"].indexOf(step)
                      ? "bg-primary/15 text-primary"
                      : "bg-surface2 text-muted"
                }`}
              >
                {item.label}
              </span>
            ))}
          </div>
        ) : null}

        {renderTaskContent()}
      </div>
    </Drawer>
  );
}
