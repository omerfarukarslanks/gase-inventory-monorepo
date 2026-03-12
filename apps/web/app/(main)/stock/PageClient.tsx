"use client";

import { useEffect, useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useStores } from "@/hooks/useStores";
import { useViewportMode } from "@/hooks/useViewportMode";
import { useLang } from "@/context/LangContext";
import type { InventoryProductStockItem } from "@/lib/inventory";

import { useStockScope } from "./hooks/useStockScope";
import { useStockList } from "./hooks/useStockList";
import { useStockReceive } from "./hooks/useStockReceive";
import { useStockAdjust } from "./hooks/useStockAdjust";
import { useStockTransfer } from "./hooks/useStockTransfer";
import { useProductInventoryDrawer } from "./hooks/useProductInventoryDrawer";
import { useSuppliers } from "./hooks/useSuppliers";
import { useStockDerived } from "./hooks/useStockDerived";

import { PageShell } from "@/components/layout/PageShell";
import StockFilters from "@/components/stock/StockFilters";
import StockTable from "@/components/stock/StockTable";
import StockPagination from "@/components/stock/StockPagination";
import AdjustDrawer from "@/components/stock/AdjustDrawer";
import TransferDrawer from "@/components/stock/TransferDrawer";
import ReceiveDrawer from "@/components/stock/ReceiveDrawer";
import ProductInventoryDrawer, { type ProductInventoryOperation } from "@/components/stock/ProductInventoryDrawer";
import StockMobileList from "@/components/stock/StockMobileList";
import StockTaskFlow, { type StockTaskMode } from "@/components/stock/StockTaskFlow";
import type { VariantActionParams } from "@/components/stock/StockTable";

export default function StockPage() {
  const { t } = useLang();
  const { can } = usePermissions();
  const viewportMode = useViewportMode();
  const isMobile = viewportMode === "mobile";
  const stores = useStores();
  const canTenantOnly = can("TENANT_ONLY");

  const { suppliers } = useSuppliers();
  const scope = useStockScope();

  const list = useStockList({
    scopeReady: scope.scopeReady,
    isStoreScopedUser: scope.isStoreScopedUser,
    scopedStoreId: scope.scopedStoreId,
    t,
  });

  const receive = useStockReceive({
    stores,
    getVariantStores: list.getVariantStores,
    resolveVariantStores: list.resolveVariantStores,
    onSuccess: list.setSuccess,
    refetchList: list.refetch,
    t,
  });

  const adjust = useStockAdjust({
    getVariantStores: list.getVariantStores,
    resolveVariantStores: list.resolveVariantStores,
    isStoreScopedUser: scope.isStoreScopedUser,
    onSuccess: list.setSuccess,
    refetchList: list.refetch,
    fetchVariantStores: list.fetchVariantStores,
    t,
  });

  const transfer = useStockTransfer({
    getVariantStores: list.getVariantStores,
    resolveVariantStores: list.resolveVariantStores,
    onSuccess: list.setSuccess,
    refetchList: list.refetch,
    fetchVariantStores: list.fetchVariantStores,
    t,
  });

  const productDrawer = useProductInventoryDrawer({
    refetchList: list.refetch,
    onSuccess: list.setSuccess,
  });

  const derived = useStockDerived({
    stores,
    adjustTarget: adjust.adjustTarget,
    variantStoresById: list.variantStoresById,
    products: list.products,
    debouncedSearch: list.debouncedSearch,
  });

  const [stockTaskOpen, setStockTaskOpen] = useState(false);
  const [stockTaskMode, setStockTaskMode] = useState<StockTaskMode>("task");
  const [stockInitialProduct, setStockInitialProduct] = useState<InventoryProductStockItem | null>(null);
  const [pendingMobileOperation, setPendingMobileOperation] = useState(false);

  const mobileOperationOpen = receive.receiveOpen || adjust.adjustOpen || transfer.transferOpen;

  useEffect(() => {
    if (isMobile) return;
    setStockTaskOpen(false);
    setStockTaskMode("task");
    setStockInitialProduct(null);
    setPendingMobileOperation(false);
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) return;
    if (!pendingMobileOperation) return;
    if (mobileOperationOpen) return;
    if (!list.success) return;

    setStockTaskMode("success");
    setStockTaskOpen(true);
    setPendingMobileOperation(false);
  }, [isMobile, list.success, mobileOperationOpen, pendingMobileOperation]);

  const openStockTask = (product: InventoryProductStockItem | null = null) => {
    if (list.success) list.setSuccess("");
    setStockInitialProduct(product);
    setStockTaskMode("task");
    setStockTaskOpen(true);
    setPendingMobileOperation(false);
  };

  const closeStockTask = () => {
    setStockTaskOpen(false);
    setStockInitialProduct(null);
  };

  const handleStockTaskOperation = (params: VariantActionParams, operation: ProductInventoryOperation) => {
    setPendingMobileOperation(true);
    setStockTaskOpen(false);

    if (operation === "receive") {
      void receive.openReceiveDrawer(params);
      return;
    }
    if (operation === "adjust") {
      void adjust.openAdjustDrawer(params);
      return;
    }
    void transfer.openTransferDrawer(params);
  };

  const footer =
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
    ) : null;

  return (
    <PageShell
      filters={
        <StockFilters
          searchTerm={list.searchTerm}
          onSearchChange={list.setSearchTerm}
          storeFilterIds={list.storeFilterIds}
          onStoreFilterChange={list.setStoreFilterIds}
          storeOptions={derived.storeOptions}
          canTenantOnly={canTenantOnly}
        />
      }
    >
      {list.success ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          {list.success}
        </div>
      ) : null}

      {isMobile ? (
        <StockMobileList
          products={derived.filteredProducts}
          loading={list.loading}
          error={list.error}
          onStartTask={(product) => openStockTask(product)}
          footer={footer}
        />
      ) : (
        <StockTable
          products={derived.filteredProducts}
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
          footer={footer}
        />
      )}

      <StockTaskFlow
        open={stockTaskOpen}
        mode={stockTaskMode}
        products={derived.filteredProducts}
        initialProduct={stockInitialProduct}
        successMessage={list.success}
        onClose={closeStockTask}
        onStartOperation={handleStockTaskOperation}
        onStartAnother={() => openStockTask(null)}
      />

      <AdjustDrawer
        open={adjust.adjustOpen}
        loading={adjust.adjustLoading}
        submitting={adjust.adjustSubmitting}
        formError={adjust.adjustFormError}
        target={adjust.adjustTarget}
        variants={derived.adjustFormVariant}
        currency={derived.adjustFormCurrency}
        stores={stores}
        initialEntriesByVariant={adjust.adjustInitial}
        isMobile={isMobile}
        showStoreSelector={
          isMobile
            ? !scope.scopedStoreId
            : canTenantOnly && !adjust.adjustApplyToAllStores
        }
        canTenantOnly={isMobile ? false : canTenantOnly}
        applyToAllStores={adjust.adjustApplyToAllStores}
        onApplyToAllStoresChange={adjust.setAdjustApplyToAllStores}
        fixedStoreId={
          isMobile
            ? scope.scopedStoreId || undefined
            : scope.isStoreScopedUser
              ? scope.scopedStoreId
              : undefined
        }
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
        allStoreOptions={derived.storeOptions}
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
        canTenantOnly={isMobile ? !scope.scopedStoreId : canTenantOnly}
        fixedStoreId={isMobile ? scope.scopedStoreId || undefined : scope.isStoreScopedUser ? scope.scopedStoreId : undefined}
        onClose={receive.closeReceiveDrawer}
        onSubmit={receive.submitReceive}
      />

      {!isMobile ? (
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
      ) : null}
    </PageShell>
  );
}
