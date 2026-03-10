"use client";

import { useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useStores } from "@/hooks/useStores";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useLang } from "@/context/LangContext";
import { getAllSuppliers, type Supplier } from "@/lib/suppliers";

import { useStockScope } from "./hooks/useStockScope";
import { useStockList } from "./hooks/useStockList";
import { useStockReceive } from "./hooks/useStockReceive";
import { useStockAdjust } from "./hooks/useStockAdjust";
import { useStockTransfer } from "./hooks/useStockTransfer";
import { useProductInventoryDrawer } from "./hooks/useProductInventoryDrawer";

import StockFilters from "@/components/stock/StockFilters";
import StockTable from "@/components/stock/StockTable";
import StockPagination from "@/components/stock/StockPagination";
import AdjustDrawer from "@/components/stock/AdjustDrawer";
import TransferDrawer from "@/components/stock/TransferDrawer";
import ReceiveDrawer from "@/components/stock/ReceiveDrawer";
import ProductInventoryDrawer from "@/components/stock/ProductInventoryDrawer";

/* ── Page ── */

export default function StockPage() {
  const { t } = useLang();
  const { can } = usePermissions();
  const stores = useStores();
  const isMobile = !useMediaQuery();
  const canTenantOnly = can("TENANT_ONLY");

  /* ── Suppliers ── */
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  useEffect(() => {
    getAllSuppliers({ isActive: true })
      .then(setSuppliers)
      .catch(() => setSuppliers([]));
  }, []);

  /* ── Scope ── */
  const scope = useStockScope();

  /* ── List ── */
  const list = useStockList({
    scopeReady: scope.scopeReady,
    isStoreScopedUser: scope.isStoreScopedUser,
    scopedStoreId: scope.scopedStoreId,
    t,
  });

  /* ── Receive drawer ── */
  const receive = useStockReceive({
    stores,
    getVariantStores: list.getVariantStores,
    resolveVariantStores: list.resolveVariantStores,
    onSuccess: list.setSuccess,
    refetchList: list.refetch,
    t,
  });

  /* ── Adjust drawer ── */
  const adjust = useStockAdjust({
    getVariantStores: list.getVariantStores,
    resolveVariantStores: list.resolveVariantStores,
    isStoreScopedUser: scope.isStoreScopedUser,
    onSuccess: list.setSuccess,
    refetchList: list.refetch,
    fetchVariantStores: list.fetchVariantStores,
    t,
  });

  /* ── Transfer drawer ── */
  const transfer = useStockTransfer({
    getVariantStores: list.getVariantStores,
    resolveVariantStores: list.resolveVariantStores,
    onSuccess: list.setSuccess,
    refetchList: list.refetch,
    fetchVariantStores: list.fetchVariantStores,
    t,
  });

  /* ── Product inventory drawer ── */
  const productDrawer = useProductInventoryDrawer({
    refetchList: list.refetch,
    onSuccess: list.setSuccess,
  });

  /* ── Derived ── */
  const storeOptions = useMemo(
    () => stores.map((s) => ({ value: s.id, label: s.name })),
    [stores],
  );

  const adjustFormVariant = useMemo(
    () =>
      adjust.adjustTarget
        ? [
            {
              id: adjust.adjustTarget.productVariantId,
              name: adjust.adjustTarget.variantName,
              code: adjust.adjustTarget.variantName,
            },
          ]
        : [],
    [adjust.adjustTarget],
  );

  const adjustFormCurrency = useMemo(() => {
    if (!adjust.adjustTarget) return "TRY" as const;
    const storesForVariant = list.variantStoresById[adjust.adjustTarget.productVariantId] ?? [];
    const currency = storesForVariant[0]?.currency;
    if (currency === "TRY" || currency === "USD" || currency === "EUR") return currency;
    return "TRY" as const;
  }, [adjust.adjustTarget, list.variantStoresById]);

  const filteredProducts = useMemo(() => {
    const q = list.debouncedSearch.trim().toLowerCase();
    if (!q) return list.products;
    return list.products.filter((product) => {
      if (product.productName.toLowerCase().includes(q)) return true;
      return (product.variants ?? []).some((variant) => {
        if (variant.variantName.toLowerCase().includes(q)) return true;
        if ((variant.variantCode ?? "").toLowerCase().includes(q)) return true;
        return (list.variantStoresById[variant.productVariantId] ?? variant.stores ?? []).some(
          (store) => store.storeName.toLowerCase().includes(q),
        );
      });
    });
  }, [list.products, list.debouncedSearch, list.variantStoresById]);

  /* ── Render ── */

  return (
    <div className="space-y-4">
      <StockFilters
        searchTerm={list.searchTerm}
        onSearchChange={list.setSearchTerm}
        storeFilterIds={list.storeFilterIds}
        onStoreFilterChange={list.setStoreFilterIds}
        storeOptions={storeOptions}
        canTenantOnly={canTenantOnly}
      />

      {list.success && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          {list.success}
        </div>
      )}

      <StockTable
        products={filteredProducts}
        loading={list.loading}
        error={list.error}
        getVariantStores={list.getVariantStores}
        onReceive={receive.openReceiveDrawer}
        onAdjust={adjust.openAdjustDrawer}
        onTransfer={transfer.openTransferDrawer}
        onProductReceive={(params) => productDrawer.openProductDrawer("receive", params)}
        onProductAdjust={(params) => productDrawer.openProductDrawer("adjust", params)}
        onProductTransfer={(params) => productDrawer.openProductDrawer("transfer", params)}
        canReceive={can("STOCK_RECEIVE")}
        canAdjust={can("STOCK_ADJUST")}
        canTransfer={can("STOCK_TRANSFER")}
        footer={
          !list.loading && !list.error ? (
            <StockPagination
              page={list.page}
              totalPages={list.totalPages}
              limit={list.limit}
              total={list.total}
              loading={list.loading}
              onPageChange={list.setPage}
              onLimitChange={(next) => {
                list.setLimit(next);
                list.setPage(1);
              }}
            />
          ) : null
        }
      />

      <AdjustDrawer
        open={adjust.adjustOpen}
        loading={adjust.adjustLoading}
        submitting={adjust.adjustSubmitting}
        formError={adjust.adjustFormError}
        target={adjust.adjustTarget}
        variants={adjustFormVariant}
        currency={adjustFormCurrency}
        stores={stores}
        initialEntriesByVariant={adjust.adjustInitial}
        isMobile={isMobile}
        showStoreSelector={canTenantOnly && !adjust.adjustApplyToAllStores}
        canTenantOnly={canTenantOnly}
        applyToAllStores={adjust.adjustApplyToAllStores}
        onApplyToAllStoresChange={adjust.setAdjustApplyToAllStores}
        fixedStoreId={scope.isStoreScopedUser ? scope.scopedStoreId : undefined}
        onClose={adjust.closeAdjustDrawer}
        onSubmit={adjust.submitAdjust}
      />

      <TransferDrawer
        open={transfer.transferOpen}
        loading={transfer.transferLoading}
        submitting={transfer.transferSubmitting}
        formError={transfer.transferFormError}
        target={transfer.transferTarget}
        form={transfer.transferForm}
        allStoreOptions={storeOptions}
        isMobile={isMobile}
        onClose={transfer.closeTransferDrawer}
        onFormChange={(patch) => transfer.setTransferForm((prev) => ({ ...prev, ...patch }))}
        onSubmit={transfer.submitTransfer}
      />

      <ReceiveDrawer
        open={receive.receiveOpen}
        loading={receive.receiveLoading}
        submitting={receive.receiveSubmitting}
        formError={receive.receiveFormError}
        target={receive.receiveTarget}
        variants={receive.receiveVariants}
        currency={receive.receiveCurrency}
        stores={stores}
        suppliers={suppliers}
        supplierId={receive.receiveSupplierId}
        onSupplierChange={receive.setReceiveSupplierId}
        initialEntriesByVariant={receive.receiveInitial}
        isMobile={isMobile}
        canTenantOnly={canTenantOnly}
        fixedStoreId={scope.isStoreScopedUser ? scope.scopedStoreId : undefined}
        onClose={receive.closeReceiveDrawer}
        onSubmit={receive.submitReceive}
      />

      <ProductInventoryDrawer
        open={productDrawer.productDrawerOpen}
        operation={productDrawer.productDrawerOperation}
        target={productDrawer.productDrawerTarget}
        stores={stores}
        canTenantOnly={canTenantOnly}
        suppliers={suppliers}
        isMobile={isMobile}
        onClose={productDrawer.closeProductDrawer}
        onSuccess={(msg) => void productDrawer.handleProductSuccess(msg)}
      />
    </div>
  );
}
