"use client";

import type { Currency } from "@/lib/products";
import {
  CURRENCY_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  type IsActiveFilter,
  parseIsActiveFilter,
} from "@/components/products/types";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import SearchInput from "@/components/ui/SearchInput";

type ProductFiltersProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  onNewProduct: () => void;
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
  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Urunler</h1>
          <p className="text-sm text-muted">Urun listesi ve yonetimi</p>
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Ara..."
            containerClassName="w-full lg:w-64"
          />
          <Button
            label={showAdvancedFilters ? "Detaylı Filtreyi Gizle" : "Detaylı Filtre"}
            onClick={onToggleAdvancedFilters}
            variant="secondary"
            className="w-full px-2.5 py-2 lg:w-auto lg:px-3"
          />
          <Button
            label="Yeni Urun"
            onClick={onNewProduct}
            variant="primarySoft"
            className="w-full px-2.5 py-2 lg:w-auto lg:px-3"
          />
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="grid gap-3 rounded-xl2 border border-border bg-surface p-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Para Birimi</label>
            <SearchableDropdown
              options={CURRENCY_FILTER_OPTIONS}
              value={currencyFilter}
              onChange={(value) => onCurrencyFilterChange(value as Currency | "")}
              placeholder="Tüm Para Birimleri"
              emptyOptionLabel="Tüm Para Birimleri"
              inputAriaLabel="Para birimi filtresi"
              clearAriaLabel="Para birimi filtresini temizle"
              toggleAriaLabel="Para birimi listesini aç"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Ürün Durumu</label>
            <SearchableDropdown
              options={STATUS_FILTER_OPTIONS}
              value={productStatusFilter === "all" ? "all" : String(productStatusFilter)}
              onChange={(value) => onProductStatusFilterChange(parseIsActiveFilter(value))}
              placeholder="Ürün Durumu"
              showEmptyOption={false}
              allowClear={false}
              inputAriaLabel="Ürün durum filtresi"
              toggleAriaLabel="Ürün durum listesini aç"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Varyant Durumu</label>
            <SearchableDropdown
              options={STATUS_FILTER_OPTIONS}
              value={variantStatusFilter === "all" ? "all" : String(variantStatusFilter)}
              onChange={(value) => onVariantStatusFilterChange(parseIsActiveFilter(value))}
              placeholder="Varyant Durumu"
              showEmptyOption={false}
              allowClear={false}
              inputAriaLabel="Varyant durum filtresi"
              toggleAriaLabel="Varyant durum listesini aç"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Satış Fiyatı Min</label>
            <input
              type="number"
              value={salePriceMin}
              onChange={(e) => onSalePriceMinChange(e.target.value)}
              placeholder="0"
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Satış Fiyatı Max</label>
            <input
              type="number"
              value={salePriceMax}
              onChange={(e) => onSalePriceMaxChange(e.target.value)}
              placeholder="1000"
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Alış Fiyatı Min</label>
            <input
              type="number"
              value={purchasePriceMin}
              onChange={(e) => onPurchasePriceMinChange(e.target.value)}
              placeholder="0"
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Alış Fiyatı Max</label>
            <input
              type="number"
              value={purchasePriceMax}
              onChange={(e) => onPurchasePriceMaxChange(e.target.value)}
              placeholder="1000"
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-4">
            <Button
              label="Detaylı Filtreleri Temizle"
              onClick={onClearAdvancedFilters}
              variant="secondary"
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      )}
    </>
  );
}
