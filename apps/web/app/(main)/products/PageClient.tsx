"use client";

import { type FormEvent, useMemo } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useStores } from "@/hooks/useStores";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useLang } from "@/context/LangContext";

import { useProductScope } from "./hooks/useProductScope";
import { useProductList } from "./hooks/useProductList";
import { useProductDrawer } from "./hooks/useProductDrawer";
import { usePriceDrawer } from "./hooks/usePriceDrawer";

import ProductFilters from "@/components/products/ProductFilters";
import ProductTable from "@/components/products/ProductTable";
import ProductPagination from "@/components/products/ProductPagination";
import ProductDrawerStep1 from "@/components/products/ProductDrawerStep1";
import ProductDrawerStep2 from "@/components/products/ProductDrawerStep2";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import PriceDrawer from "@/components/stock/PriceDrawer";

export default function ProductsPage() {
  const { can } = usePermissions();
  const { t } = useLang();
  const canTenantOnly = can("TENANT_ONLY");
  const allStores = useStores();
  const stores = canTenantOnly ? allStores : [];
  const isMobile = !useMediaQuery();

  const scope = useProductScope();
  const list = useProductList({ scopeReady: scope.scopeReady, t });

  const drawer = useProductDrawer({
    scopedStoreId: scope.scopedStoreId,
    canTenantOnly,
    onSuccess: list.fetchProducts,
    t,
  });

  const price = usePriceDrawer({ onSuccess: list.fetchProducts });

  const storeOptions = useMemo(
    () => stores.filter((s) => s.isActive).map((s) => ({ value: s.id, label: s.name })),
    [stores],
  );

  const totalPages = list.meta?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <ProductFilters
        searchTerm={list.searchTerm}
        onSearchChange={list.setSearchTerm}
        showAdvancedFilters={list.showAdvancedFilters}
        onToggleAdvancedFilters={() => list.setShowAdvancedFilters((prev) => !prev)}
        onNewProduct={drawer.onOpenDrawer}
        canCreate={can("PRODUCT_CREATE")}
        currencyFilter={list.currencyFilter}
        onCurrencyFilterChange={list.setCurrencyFilter}
        productStatusFilter={list.productStatusFilter}
        onProductStatusFilterChange={list.setProductStatusFilter}
        variantStatusFilter={list.variantStatusFilter}
        onVariantStatusFilterChange={list.setVariantStatusFilter}
        salePriceMin={list.defaultSalePriceMinFilter}
        onSalePriceMinChange={list.setDefaultSalePriceMinFilter}
        salePriceMax={list.defaultSalePriceMaxFilter}
        onSalePriceMaxChange={list.setDefaultSalePriceMaxFilter}
        purchasePriceMin={list.defaultPurchasePriceMinFilter}
        onPurchasePriceMinChange={list.setDefaultPurchasePriceMinFilter}
        purchasePriceMax={list.defaultPurchasePriceMaxFilter}
        onPurchasePriceMaxChange={list.setDefaultPurchasePriceMaxFilter}
        onClearAdvancedFilters={list.clearAdvancedFilters}
      />

      <ProductTable
        products={list.products}
        loading={list.loading}
        error={list.error}
        expandedProductIds={list.expandedProductIds}
        productVariantsById={list.productVariantsById}
        productVariantsLoadingById={list.productVariantsLoadingById}
        productVariantsErrorById={list.productVariantsErrorById}
        togglingProductIds={list.togglingProductIds}
        togglingVariantIds={list.togglingVariantIds}
        onToggleExpand={list.toggleExpandedProduct}
        onEdit={drawer.onEditProduct}
        onToggleActive={list.onToggleProductActive}
        onToggleVariantActive={list.onToggleVariantActive}
        onProductPrice={price.openProductPriceDrawer}
        canUpdate={can("PRODUCT_UPDATE")}
        canPriceUpdate={can("PRICE_MANAGE")}
        footer={
          list.meta && !list.loading && !list.error ? (
            <ProductPagination
              page={list.currentPage}
              totalPages={totalPages}
              pageSize={list.pageSize}
              total={list.meta.total}
              loading={list.loading}
              onPageChange={list.onPageChange}
              onPageSizeChange={list.onChangePageSize}
            />
          ) : null
        }
      />

      {/* ── Drawer ── */}
      <Drawer
        open={drawer.drawerOpen}
        onClose={drawer.onCloseDrawer}
        side="right"
        title={drawer.editingProductId ? t("products.update") : t("products.create")}
        description={drawer.step === 1 ? `1/2 - ${t("products.step1")}` : `2/2 - ${t("products.step2")}`}
        closeDisabled={drawer.submitting || drawer.loadingDetail}
        className={cn(isMobile ? "!max-w-none" : "!max-w-[540px]")}
        footer={
          <div className="flex items-center justify-between">
            <div>
              {drawer.step === 2 && (
                <Button
                  label={t("common.back")}
                  type="button"
                  onClick={drawer.goToStep1}
                  disabled={drawer.submitting}
                  variant="secondary"
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                label={t("common.cancel")}
                type="button"
                onClick={drawer.onCloseDrawer}
                disabled={drawer.submitting || drawer.loadingDetail}
                variant="secondary"
              />
              {drawer.step === 1 ? (
                <Button
                  label={t("common.continue")}
                  type="submit"
                  form="product-form"
                  disabled={drawer.submitting || drawer.loadingDetail}
                  variant="primarySolid"
                />
              ) : drawer.step === 2 ? (
                <Button
                  label={
                    drawer.submitting
                      ? drawer.editingProductId
                        ? t("common.updating")
                        : t("common.creating")
                      : t("common.save")
                  }
                  type="submit"
                  form="product-form"
                  disabled={drawer.submitting || drawer.loadingDetail}
                  loading={drawer.submitting}
                  variant="primarySolid"
                />
              ) : null}
            </div>
          </div>
        }
      >
        <form
          id="product-form"
          onSubmit={(e: FormEvent<HTMLFormElement>) => void drawer.onSubmitProduct(e)}
          className="space-y-4 p-5"
        >
          {drawer.loadingDetail ? (
            <div className="text-sm text-muted">{t("common.loading")}</div>
          ) : drawer.step === 1 ? (
            <ProductDrawerStep1
              form={drawer.form}
              errors={drawer.errors}
              calculatedLineTotal={drawer.calculatedLineTotal}
              storeOptions={storeOptions}
              categoryOptions={drawer.categoryOptions}
              productInfoOpen={drawer.step1ProductInfoOpen}
              onToggleProductInfo={() => drawer.setStep1ProductInfoOpen((prev) => !prev)}
              storeScopeOpen={drawer.step1StoreScopeOpen}
              onToggleStoreScope={() => drawer.setStep1StoreScopeOpen((prev) => !prev)}
              formError={drawer.formError}
              onFormChange={drawer.onFormChange}
              onFormPatch={drawer.onFormPatch}
              onClearError={drawer.onClearError}
              canTenantOnly={canTenantOnly}
            />
          ) : drawer.step === 2 ? (
            <ProductDrawerStep2
              variants={drawer.variants}
              expandedVariantKeys={drawer.expandedVariantKeys}
              variantErrors={drawer.variantErrors}
              attributeDefinitions={drawer.attributeDefinitions}
              formError={drawer.formError}
              onToggleVariantPanel={drawer.toggleVariantPanel}
              onRemoveVariant={drawer.removeVariant}
              onAddAttribute={drawer.addAttribute}
              onRemoveAttribute={drawer.removeAttribute}
              onUpdateAttribute={drawer.updateVariantAttribute}
            />
          ) : null}
        </form>
      </Drawer>

      <PriceDrawer
        open={price.priceOpen}
        target={price.priceTarget}
        allStoreOptions={storeOptions}
        isMobile={isMobile}
        showStoreScopeControls={!canTenantOnly}
        fixedStoreId={canTenantOnly ? scope.scopedStoreId : undefined}
        onClose={price.closePriceDrawer}
        onSuccess={() => {
          if (price.priceTarget?.mode === "product") {
            void list.fetchProducts();
            if (price.priceProductId && list.expandedProductIds.includes(price.priceProductId)) {
              void list.fetchTableVariants(price.priceProductId, list.variantStatusFilter);
            }
          } else if (price.priceProductId) {
            void list.fetchTableVariants(price.priceProductId, list.variantStatusFilter);
          }
        }}
      />
    </div>
  );
}
