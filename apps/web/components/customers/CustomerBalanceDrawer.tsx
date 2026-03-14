"use client";

import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { useLang } from "@/context/LangContext";
import type { CustomerBalance } from "@/lib/customers";
import { formatCount } from "@/components/customers/types";

type CustomerBalanceDrawerProps = {
  open: boolean;
  onClose: () => void;
  customerBalanceLoading: boolean;
  customerBalanceError: string;
  customerBalance: CustomerBalance | null;
  selectedBalanceCustomerId: string | null;
  selectedBalanceCustomerName: string;
  onRefresh: () => void;
};

export default function CustomerBalanceDrawer({
  open,
  onClose,
  customerBalanceLoading,
  customerBalanceError,
  customerBalance,
  selectedBalanceCustomerId,
  selectedBalanceCustomerName,
  onRefresh,
}: CustomerBalanceDrawerProps) {
  const { t } = useLang();

  const balanceNumeric = Number(customerBalance?.balance ?? 0);
  const balanceToneClass =
    Number.isNaN(balanceNumeric) || balanceNumeric === 0
      ? "text-text"
      : balanceNumeric > 0
        ? "text-error"
        : "text-primary";
  const balanceStatusLabel =
    Number.isNaN(balanceNumeric) || balanceNumeric === 0
      ? "Bakiye Kapali"
      : balanceNumeric > 0
        ? "Musteri Borclu"
        : "Musteri Alacakli";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={t("customers.balance")}
      description={customerBalance?.customerName || selectedBalanceCustomerName}
      closeDisabled={customerBalanceLoading}
      mobileFullscreen
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            label={customerBalanceLoading ? t("common.loading") : t("common.refresh")}
            type="button"
            onClick={onRefresh}
            disabled={!selectedBalanceCustomerId}
            variant="secondary"
          />
          <Button
            label={t("common.close")}
            type="button"
            onClick={onClose}
            disabled={customerBalanceLoading}
            variant="primarySolid"
          />
        </div>
      }
    >
      <div className="space-y-4 p-5">
        {customerBalanceLoading ? (
          <div className="text-sm text-muted">Cari bakiye bilgisi yukleniyor...</div>
        ) : customerBalanceError ? (
          <p className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
            {customerBalanceError}
          </p>
        ) : customerBalance ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface2/50 p-3">
                <p className="text-xs font-semibold text-muted">Toplam Satis</p>
                <p className="mt-1 text-lg font-semibold text-text">
                  {formatCount(customerBalance.totalSalesCount)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface2/50 p-3">
                <p className="text-xs font-semibold text-muted">Toplam Satis Tutari</p>
                <p className="mt-1 text-lg font-semibold text-text">
                  {formatPrice(customerBalance.totalSaleAmount)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface2/50 p-3">
                <p className="text-xs font-semibold text-muted">Toplam Tahsilat</p>
                <p className="mt-1 text-lg font-semibold text-text">
                  {formatPrice(customerBalance.totalPaidAmount)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface2/50 p-3">
                <p className="text-xs font-semibold text-muted">Toplam Iade</p>
                <p className="mt-1 text-lg font-semibold text-text">
                  {formatPrice(customerBalance.totalReturnAmount)}
                </p>
              </div>
            </div>

            <div className="rounded-xl2 border border-primary/30 bg-primary/10 p-4">
              <p className="text-xs font-semibold text-muted">Cari Durum</p>
              <p className={`mt-1 text-2xl font-bold ${balanceToneClass}`}>
                {formatPrice(customerBalance.balance)}
              </p>
              <p className="mt-1 text-xs font-semibold text-muted">{balanceStatusLabel}</p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">Cari bakiye bilgisi bulunamadi.</p>
        )}
      </div>
    </Drawer>
  );
}
