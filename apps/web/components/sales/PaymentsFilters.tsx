"use client";

import { useMemo, useState } from "react";
import PageFilterBar from "@/components/ui/PageFilterBar";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { useLang } from "@/context/LangContext";
import { getPaymentMethodLabel, getPaymentStatusLabel } from "@/lib/status-labels";

type PaymentsFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  showStoreFilter: boolean;
  storeId: string;
  onStoreIdChange: (value: string) => void;
  storeOptions: Array<{ value: string; label: string }>;
  paymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
};

export default function PaymentsFilters({
  searchTerm,
  onSearchTermChange,
  showStoreFilter,
  storeId,
  onStoreIdChange,
  storeOptions,
  paymentMethod,
  onPaymentMethodChange,
  status,
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}: PaymentsFiltersProps) {
  const { t } = useLang();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const paymentMethodOptions = useMemo(
    () => [
      { value: "CASH", label: getPaymentMethodLabel("CASH", t) },
      { value: "CARD", label: getPaymentMethodLabel("CARD", t) },
      { value: "TRANSFER", label: getPaymentMethodLabel("TRANSFER", t) },
      { value: "OTHER", label: getPaymentMethodLabel("OTHER", t) },
    ],
    [t],
  );

  const statusOptions = useMemo(
    () => [
      { value: "ACTIVE", label: getPaymentStatusLabel("ACTIVE", t) },
      { value: "UPDATED", label: getPaymentStatusLabel("UPDATED", t) },
      { value: "CANCELLED", label: getPaymentStatusLabel("CANCELLED", t) },
    ],
    [t],
  );

  return (
    <PageFilterBar
      title={t("salesPayments.title")}
      subtitle={t("salesPayments.subtitle")}
      searchTerm={searchTerm}
      onSearchTermChange={onSearchTermChange}
      searchPlaceholder={t("salesPayments.searchPlaceholder")}
      showAdvancedFilters={showAdvancedFilters}
      onToggleAdvancedFilters={() => setShowAdvancedFilters((prev) => !prev)}
      filterLabel={t("common.filter")}
      hideFilterLabel={t("common.hideFilter")}
      mobileAdvancedFiltersTitle={t("common.filter")}
      advancedFilters={(
        <>
          {showStoreFilter ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">{t("salesPayments.storeLabel")}</label>
              <SearchableDropdown
                options={storeOptions}
                value={storeId}
                onChange={onStoreIdChange}
                placeholder={t("salesPayments.storePlaceholder")}
                inputAriaLabel={t("salesPayments.storeLabel")}
                toggleAriaLabel={t("salesPayments.storeLabel")}
                showEmptyOption={false}
                allowClear={false}
              />
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("salesPayments.paymentMethodLabel")}</label>
            <SearchableDropdown
              options={paymentMethodOptions}
              value={paymentMethod}
              onChange={onPaymentMethodChange}
              placeholder={t("salesPayments.paymentMethodPlaceholder")}
              emptyOptionLabel={t("salesPayments.allPaymentMethods")}
              inputAriaLabel={t("salesPayments.paymentMethodLabel")}
              toggleAriaLabel={t("salesPayments.paymentMethodLabel")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("salesPayments.statusLabel")}</label>
            <SearchableDropdown
              options={statusOptions}
              value={status}
              onChange={onStatusChange}
              placeholder={t("salesPayments.statusPlaceholder")}
              showEmptyOption={false}
              allowClear={false}
              inputAriaLabel={t("salesPayments.statusLabel")}
              toggleAriaLabel={t("salesPayments.statusLabel")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("salesPayments.startDateLabel")}</label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => onStartDateChange(event.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("salesPayments.endDateLabel")}</label>
            <input
              type="date"
              value={endDate}
              onChange={(event) => onEndDateChange(event.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </>
      )}
    />
  );
}
