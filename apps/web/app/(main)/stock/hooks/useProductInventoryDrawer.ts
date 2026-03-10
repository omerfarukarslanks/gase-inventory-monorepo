"use client";
import { useState } from "react";
import type {
  ProductInventoryOperation,
  ProductInventoryTarget,
} from "@/components/stock/ProductInventoryDrawer";
import type { ProductActionParams } from "@/components/stock/StockTable";

type Options = {
  refetchList: () => Promise<void>;
  onSuccess: (message: string) => void;
};

export function useProductInventoryDrawer({ refetchList, onSuccess }: Options) {
  const [productDrawerOpen, setProductDrawerOpen] = useState(false);
  const [productDrawerOperation, setProductDrawerOperation] = useState<ProductInventoryOperation | null>(null);
  const [productDrawerTarget, setProductDrawerTarget] = useState<ProductInventoryTarget | null>(null);

  const openProductDrawer = (operation: ProductInventoryOperation, params: ProductActionParams) => {
    setProductDrawerOperation(operation);
    setProductDrawerTarget({
      productId: params.productId,
      productName: params.productName,
      variants: params.variants,
    });
    setProductDrawerOpen(true);
  };

  const closeProductDrawer = () => {
    setProductDrawerOpen(false);
    setProductDrawerOperation(null);
    setProductDrawerTarget(null);
  };

  const handleProductSuccess = async (msg: string) => {
    onSuccess(msg);
    closeProductDrawer();
    await refetchList();
  };

  return {
    productDrawerOpen,
    productDrawerOperation,
    productDrawerTarget,
    openProductDrawer,
    closeProductDrawer,
    handleProductSuccess,
  };
}
