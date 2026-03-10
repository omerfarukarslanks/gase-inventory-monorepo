import {
  getProductPackageById,
  updateProductPackage,
  type ProductPackage,
} from "@gase/core";
import { useCallback, useState } from "react";

type UsePackageDetailParams = {
  onToggleSuccess: () => Promise<void>;
};

export function usePackageDetail({ onToggleSuccess }: UsePackageDetailParams) {
  const [selectedPackage, setSelectedPackage] = useState<ProductPackage | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");

  const openPackage = useCallback(async (packageId: string) => {
    setDetailLoading(true);
    setError("");
    try {
      const detail = await getProductPackageById(packageId);
      setSelectedPackage(detail);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Paket detayi getirilemedi.");
      setSelectedPackage(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedPackage(null);
    setError("");
  }, []);

  const togglePackageActive = useCallback(async () => {
    if (!selectedPackage) return;

    setToggling(true);
    setError("");
    try {
      const updated = await updateProductPackage(selectedPackage.id, {
        name: selectedPackage.name,
        code: selectedPackage.code,
        description: selectedPackage.description ?? undefined,
        isActive: !(selectedPackage.isActive ?? true),
        items: (selectedPackage.items ?? []).map((item) => ({
          productVariantId: item.productVariant.id,
          quantity: item.quantity,
        })),
      });
      setSelectedPackage(updated);
      await onToggleSuccess();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Paket durumu guncellenemedi.");
    } finally {
      setToggling(false);
    }
  }, [selectedPackage, onToggleSuccess]);

  return {
    selectedPackage,
    setSelectedPackage,
    detailLoading,
    toggling,
    error,
    setError,
    openPackage,
    closeDetail,
    togglePackageActive,
  };
}
