import { getProductById, getProductVariants, type Product, type ProductVariant } from "@gase/core";
import { useState } from "react";

export type ProductDetailState = {
  loading: boolean;
  product: Product | null;
  variants: ProductVariant[];
};

const initialDetail: ProductDetailState = {
  loading: false,
  product: null,
  variants: [],
};

export function useProductDetail() {
  const [detail, setDetail] = useState<ProductDetailState>(initialDetail);
  const [detailError, setDetailError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const openProduct = async (productId: string) => {
    setDetailError("");
    setSelectedId(productId);
    setDetail({ loading: true, product: null, variants: [] });

    try {
      const [product, variants] = await Promise.all([
        getProductById(productId),
        getProductVariants(productId, { isActive: "all" }),
      ]);
      setDetail({ loading: false, product, variants });
    } catch (nextError) {
      setDetailError(nextError instanceof Error ? nextError.message : "Urun detayi getirilemedi.");
      setDetail({ loading: false, product: null, variants: [] });
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(initialDetail);
    setDetailError("");
  };

  return {
    detail,
    detailError,
    selectedId,
    openProduct,
    closeDetail,
  };
}
