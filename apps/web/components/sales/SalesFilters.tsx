"use client";

import PageFilterBar from "@/components/ui/PageFilterBar";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import SearchableMultiSelectDropdown from "@/components/ui/SearchableMultiSelectDropdown";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { PAYMENT_STATUS_OPTIONS, SALES_STATUS_OPTIONS } from "@/components/sales/types";
import { useLang } from "@/context/LangContext";
import { useViewportMode } from "@/hooks/useViewportMode";

type SalesFiltersProps = {
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  onNewSale: () => void;
  canCreate?: boolean;
  canTenantOnly: boolean;
  storeOptions: Array<{ value: string; label: string }>;
  salesStoreIds: string[];
  onSalesStoreIdsChange: (values: string[]) => void;
  receiptNoFilter: string;
  onReceiptNoFilterChange: (value: string) => void;
  nameFilter: string;
  onNameFilterChange: (value: string) => void;
  surnameFilter: string;
  onSurnameFilterChange: (value: string) => void;
  statusFilters: string[];
  onStatusFiltersChange: (values: string[]) => void;
  paymentStatusFilter: string;
  onPaymentStatusFilterChange: (value: string) => void;
  minUnitPriceFilter: string;
  onMinUnitPriceFilterChange: (value: string) => void;
  maxUnitPriceFilter: string;
  onMaxUnitPriceFilterChange: (value: string) => void;
  minLineTotalFilter: string;
  onMinLineTotalFilterChange: (value: string) => void;
  maxLineTotalFilter: string;
  onMaxLineTotalFilterChange: (value: string) => void;
  includeLines: boolean;
  onIncludeLinesChange: (checked: boolean) => void;
  onResetPage: () => void;
};

export default function SalesFilters({
  showAdvancedFilters,
  onToggleAdvancedFilters,
  onNewSale,
  canCreate = true,
  canTenantOnly,
  storeOptions,
  salesStoreIds,
  onSalesStoreIdsChange,
  receiptNoFilter,
  onReceiptNoFilterChange,
  nameFilter,
  onNameFilterChange,
  surnameFilter,
  onSurnameFilterChange,
  statusFilters,
  onStatusFiltersChange,
  paymentStatusFilter,
  onPaymentStatusFilterChange,
  minUnitPriceFilter,
  onMinUnitPriceFilterChange,
  maxUnitPriceFilter,
  onMaxUnitPriceFilterChange,
  minLineTotalFilter,
  onMinLineTotalFilterChange,
  maxLineTotalFilter,
  onMaxLineTotalFilterChange,
  includeLines,
  onIncludeLinesChange,
  onResetPage,
}: SalesFiltersProps) {
  const { t } = useLang();
  const viewportMode = useViewportMode();
  const isMobile = viewportMode === "mobile";

  return (
    <PageFilterBar
      title="Satis"
      subtitle="Fisler, odemeler ve iadeleri yonetin."
      searchTerm={receiptNoFilter}
      onSearchTermChange={(value) => {
        onReceiptNoFilterChange(value);
        onResetPage();
      }}
      searchPlaceholder={t("sales.receiptNo")}
      showAdvancedFilters={showAdvancedFilters}
      onToggleAdvancedFilters={onToggleAdvancedFilters}
      filterLabel={t("common.filter")}
      hideFilterLabel={t("common.hideFilter")}
      canCreate={canCreate}
      createLabel={t("sales.new")}
      onCreate={onNewSale}
      mobileAdvancedFiltersTitle={t("common.filter")}
      advancedFilters={
        <>
          {canTenantOnly && !isMobile ? (
            <div className="lg:col-span-3">
              <label className="mb-1 block text-xs font-semibold text-muted">{t("sales.filterByStore")}</label>
              <SearchableMultiSelectDropdown
                options={storeOptions}
                values={salesStoreIds}
                onChange={(values) => {
                  onSalesStoreIdsChange(values);
                  onResetPage();
                }}
                placeholder={t("sales.allStores")}
              />
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Receipt No</label>
            <input
              type="text"
              value={receiptNoFilter}
              onChange={(event) => {
                onReceiptNoFilterChange(event.target.value);
                onResetPage();
              }}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("sales.firstName")}</label>
            <input
              type="text"
              value={nameFilter}
              onChange={(event) => {
                onNameFilterChange(event.target.value);
                onResetPage();
              }}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("sales.surname")}</label>
            <input
              type="text"
              value={surnameFilter}
              onChange={(event) => {
                onSurnameFilterChange(event.target.value);
                onResetPage();
              }}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className={isMobile ? "md:col-span-2" : undefined}>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("common.status")}</label>
            <SearchableMultiSelectDropdown
              options={SALES_STATUS_OPTIONS}
              values={statusFilters}
              onChange={(values) => {
                onStatusFiltersChange(values);
                onResetPage();
              }}
              placeholder={t("sales.statusSelect")}
            />
          </div>

          <div className={isMobile ? "md:col-span-2" : undefined}>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("sales.paymentStatus")}</label>
            <SearchableDropdown
              options={PAYMENT_STATUS_OPTIONS}
              value={paymentStatusFilter}
              onChange={(value) => {
                onPaymentStatusFilterChange(value);
                onResetPage();
              }}
              placeholder={t("sales.paymentStatusSelect")}
              emptyOptionLabel={t("sales.allPaymentStatuses")}
            />
          </div>

          {!isMobile ? (
            <>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">{t("sales.minUnitPrice")}</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={minUnitPriceFilter}
                  onChange={(event) => {
                    onMinUnitPriceFilterChange(event.target.value);
                    onResetPage();
                  }}
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">{t("sales.maxUnitPrice")}</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={maxUnitPriceFilter}
                  onChange={(event) => {
                    onMaxUnitPriceFilterChange(event.target.value);
                    onResetPage();
                  }}
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">{t("sales.minLineTotal")}</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={minLineTotalFilter}
                  onChange={(event) => {
                    onMinLineTotalFilterChange(event.target.value);
                    onResetPage();
                  }}
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">{t("sales.maxLineTotal")}</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={maxLineTotalFilter}
                  onChange={(event) => {
                    onMaxLineTotalFilterChange(event.target.value);
                    onResetPage();
                  }}
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </>
          ) : null}

          <div className={isMobile ? "md:col-span-2" : "flex items-end"}>
            <div className="flex w-full items-center justify-between rounded-xl border border-border bg-surface2/40 px-3 py-2">
              <span className="text-xs font-semibold text-muted">{t("sales.includeLines")}</span>
              <ToggleSwitch
                checked={includeLines}
                onChange={(checked) => {
                  onIncludeLinesChange(checked);
                  onResetPage();
                }}
              />
            </div>
          </div>
        </>
      }
    />
  );
}
