import type { SalesDraftSeed, StockFocusSeed } from "@/src/lib/workflows";
import { useProductDetail } from "./hooks/useProductDetail";
import { useProductList } from "./hooks/useProductList";
import { ProductDetailView } from "./views/ProductDetailView";
import { ProductListView } from "./views/ProductListView";

type ProductsScreenProps = {
  isActive?: boolean;
  onOpenSalesDraft?: (seed?: SalesDraftSeed) => void;
  onOpenStockFocus?: (seed: StockFocusSeed) => void;
  onBack?: () => void;
};

export default function ProductsScreen({
  isActive = true,
  onOpenSalesDraft,
  onOpenStockFocus,
  onBack,
}: ProductsScreenProps = {}) {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    products,
    loading,
    error,
    activeFilterLabel,
    hasFilters,
    fetchProducts,
    resetFilters,
  } = useProductList({ isActive });

  const { detail, detailError, selectedId, openProduct, closeDetail } = useProductDetail();

  if (detail.product || detail.loading) {
    return (
      <ProductDetailView
        detail={detail}
        error={detailError}
        selectedId={selectedId}
        onClose={closeDetail}
        onRetry={(id) => void openProduct(id)}
        onOpenSalesDraft={onOpenSalesDraft}
        onOpenStockFocus={onOpenStockFocus}
      />
    );
  }

  return (
    <ProductListView
      search={search}
      onChangeSearch={setSearch}
      statusFilter={statusFilter}
      onChangeStatusFilter={setStatusFilter}
      products={products}
      loading={loading}
      error={error}
      activeFilterLabel={activeFilterLabel}
      hasFilters={hasFilters}
      onOpenProduct={(id) => void openProduct(id)}
      onFetchProducts={() => void fetchProducts()}
      onResetFilters={resetFilters}
    />
  );
}
