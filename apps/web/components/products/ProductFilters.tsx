"use client";

import type { Currency } from "@/lib/products";
import {
  CURRENCY_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  type IsActiveFilter,
  parseIsActiveFilter,
} from "@/components/products/types";
import PageFilterBar from "@/components/ui/PageFilterBar";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { useLang } from "@/context/LangContext";

type ProductFiltersProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  onNewProduct: () => void;
  canCreate?: boolean;
  currencyFilter: Currency | "";
  onCurrencyFilterChange: (value: Currency | "") => void;
  productStatusFilter: IsActiveFilter;
  onProductStatusFilterChange: (value: IsActiveFilter) => void;
  variantStatusFilter: IsActiveFilter;
  onVariantStatusFilterChange: (value: IsActiveFilter) => void;
  salePriceMin: string;
  onSalePriceMinChange: (value: string) => void;
  salePriceMax: string;
  onSalePriceMaxChange: (value: string) => void;
  purchasePriceMin: string;
  onPurchasePriceMinChange: (value: string) => void;
  purchasePriceMax: string;
  onPurchasePriceMaxChange: (value: string) => void;
  onClearAdvancedFilters: () => void;
};

export default function ProductFilters({
  searchTerm,
  onSearchChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  onNewProduct,
  canCreate = true,
  currencyFilter,
  onCurrencyFilterChange,
  productStatusFilter,
  onProductStatusFilterChange,
  variantStatusFilter,
  onVariantStatusFilterChange,
  salePriceMin,
  onSalePriceMinChange,
  salePriceMax,
  onSalePriceMaxChange,
  purchasePriceMin,
  onPurchasePriceMinChange,
  purchasePriceMax,
  onPurchasePriceMaxChange,
  onClearAdvancedFilters,
}: ProductFiltersProps) {
  const { t } = useLang();

  return (
    <PageFilterBar
      title={t("products.title")}
      subtitle={t("products.subtitle")}
      searchTerm={searchTerm}
      onSearchTermChange={onSearchChange}
      searchPlaceholder={t("common.search")}
      showAdvancedFilters={showAdvancedFilters}
      onToggleAdvancedFilters={onToggleAdvancedFilters}
      filterLabel={t("common.filter")}
      hideFilterLabel={t("common.hideFilter")}
      canCreate={canCreate}
      createLabel={t("products.new")}
      onCreate={onNewProduct}
      mobileAdvancedFiltersTitle={t("common.filter")}
      advancedFilters={(
        <>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">{t("products.currencyLabel")}</label>
            <SearchableDropdown
              options={CURRENCY_FILTER_OPTIONS}
              value={currencyFilter}
              onChange={(value) => onCurrencyFilterChange(value as Currency | "")}
              placeholder={t("products.allCurrencies")}
              emptyOptionLabel={t("products.allCurrencies")}
              inputAriaLabel="Para birimi filtresi"
              clearAriaLabel="Para birimi filtresini temizle"
              toggleAriaLabel="Para birimi listesini aç"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">{t("products.productStatus")}</label>
            <SearchableDropdown
              options={STATUS_FILTER_OPTIONS}
              value={productStatusFilter === "all" ? "all" : String(productStatusFilter)}
              onChange={(value) => onProductStatusFilterChange(parseIsActiveFilter(value))}
              placeholder={t("products.productStatus")}
              showEmptyOption={false}
              allowClear={false}
              inputAriaLabel="Ürün durum filtresi"
              toggleAriaLabel="Ürün durum listesini aç"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">{t("products.variantStatus")}</label>
            <SearchableDropdown
              options={STATUS_FILTER_OPTIONS}
              value={variantStatusFilter === "all" ? "all" : String(variantStatusFilter)}
              onChange={(value) => onVariantStatusFilterChange(parseIsActiveFilter(value))}
              placeholder={t("products.variantStatus")}
              showEmptyOption={false}
              allowClear={false}
              inputAriaLabel="Varyant durum filtresi"
              toggleAriaLabel="Varyant durum listesini aç"
            />
          </div>
          <div className="space-y-1 lg:col-span-2">
            <label className="text-xs font-semibold text-muted">{t("products.salePriceMin")}</label>
            <input
              type="number"
              value={salePriceMin}
              onChange={(e) => onSalePriceMinChange(e.target.value)}
              placeholder="0"
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1 lg:col-span-2">
            <label className="text-xs font-semibold text-muted">{t("products.salePriceMax")}</label>
            <input
              type="number"
              value={salePriceMax}
              onChange={(e) => onSalePriceMaxChange(e.target.value)}
              placeholder="1000"
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1 lg:col-span-2">
            <label className="text-xs font-semibold text-muted">{t("products.purchasePriceMin")}</label>
            <input
              type="number"
              value={purchasePriceMin}
              onChange={(e) => onPurchasePriceMinChange(e.target.value)}
              placeholder="0"
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1 lg:col-span-2">
            <label className="text-xs font-semibold text-muted">{t("products.purchasePriceMax")}</label>
            <input
              type="number"
              value={purchasePriceMax}
              onChange={(e) => onPurchasePriceMaxChange(e.target.value)}
              placeholder="1000"
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <button
              type="button"
              onClick={onClearAdvancedFilters}
              className="inline-flex rounded-xl2 border border-border bg-surface px-3 py-2 text-sm text-text transition-colors hover:bg-surface2"
            >
              {t("products.clearAdvancedFilters")}
            </button>
          </div>
        </>
      )}
    />
  );
}
