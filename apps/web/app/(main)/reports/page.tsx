"use client";

import Link from "next/link";
import { useLang } from "@/context/LangContext";

export default function ReportsPage() {
  const { t } = useLang();

  const reportCategories = [
    {
      title: t("reports.salesTitle"),
      items: [
        { href: "/reports/sales-summary", label: t("reports.salesSummary"), desc: t("reports.salesSummaryDesc") },
        { href: "/reports/cancellations", label: t("reports.cancellations"), desc: t("reports.cancellationsDesc") },
        { href: "/reports/product-performance", label: t("reports.productPerformance"), desc: t("reports.productPerformanceDesc") },
        { href: "/reports/supplier-performance", label: t("reports.supplierPerformance"), desc: t("reports.supplierPerformanceDesc") },
      ],
    },
    {
      title: t("reports.stockTitle"),
      items: [
        { href: "/reports/stock-summary", label: t("reports.stockSummary"), desc: t("reports.stockSummaryDesc") },
        { href: "/reports/low-stock", label: t("reports.lowStock"), desc: t("reports.lowStockDesc") },
        { href: "/reports/dead-stock", label: t("reports.deadStock"), desc: t("reports.deadStockDesc") },
        { href: "/reports/inventory-movements", label: t("reports.inventoryMovements"), desc: t("reports.inventoryMovementsDesc") },
        { href: "/reports/turnover", label: t("reports.turnover"), desc: t("reports.turnoverDesc") },
      ],
    },
    {
      title: t("reports.financialTitle"),
      items: [
        { href: "/reports/revenue-trend", label: t("reports.revenueTrend"), desc: t("reports.revenueTrendDesc") },
        { href: "/reports/profit-margin", label: t("reports.profitMargin"), desc: t("reports.profitMarginDesc") },
        { href: "/reports/discount-summary", label: t("reports.discountSummary"), desc: t("reports.discountSummaryDesc") },
        { href: "/reports/vat-summary", label: t("reports.vatSummary"), desc: t("reports.vatSummaryDesc") },
      ],
    },
    {
      title: t("reports.storeAndEmployee"),
      items: [
        { href: "/reports/store-performance", label: t("reports.storePerformance"), desc: t("reports.storePerformanceDesc") },
        { href: "/reports/employee-performance", label: t("reports.employeePerformance"), desc: t("reports.employeePerformanceDesc") },
      ],
    },
    {
      title: t("reports.customerTitle"),
      items: [{ href: "/reports/customers", label: t("reports.customerAnalysis"), desc: t("reports.customerAnalysisDesc") }],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text">{t("reports.title")}</h1>
        <p className="text-sm text-muted">{t("reports.subtitle")}</p>
      </div>

      {reportCategories.map((category) => (
        <section key={category.title}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{category.title}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {category.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-xl2 border border-border bg-surface p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <h3 className="text-sm font-semibold text-text group-hover:text-primary">{item.label}</h3>
                <p className="mt-1 text-xs text-muted">{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
