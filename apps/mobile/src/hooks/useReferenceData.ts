import { useStoreList } from "./useStoreList";
import { useSupplierList } from "./useSupplierList";

/**
 * Loads stores and suppliers together. Returns a combined loading/error state.
 * Use this in screens that need both (e.g. StockScreen, SalesScreen).
 */
export function useReferenceData() {
  const stores = useStoreList();
  const suppliers = useSupplierList();

  const loading = stores.loading || suppliers.loading;
  const error = stores.error ?? suppliers.error ?? null;

  function refetch() {
    stores.refetch();
    suppliers.refetch();
  }

  return {
    stores: stores.stores,
    suppliers: suppliers.suppliers,
    loading,
    error,
    refetch,
  };
}
