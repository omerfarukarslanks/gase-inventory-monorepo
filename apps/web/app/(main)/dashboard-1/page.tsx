"use client";

import { useState } from "react";
import { KpiCard } from "@/components/ui/KpiCard";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { WeeklySalesChart, CategoryPieChart, MonthlyBarChart } from "@/components/dashboard/Chart";
import { recentTransactions, lowStockItems } from "@/components/dashboard/data";

export default function DashboardPage() {
    const [period, setPeriod] = useState("this-week");
    const periodOptions = [
        { value: "this-week", label: "Bu Hafta" },
        { value: "last-month", label: "Gecen Ay" },
    ] as const;

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Günlük Satış"
                    value="₺8,490"
                    hint="Geçen Haftaya Göre"
                    delta={12.4}
                    variant="primary"
                />
                <KpiCard
                    title="Stok Miktarı"
                    value="4,250"
                    hint="Birim Ürün"
                    delta={-2.1}
                    variant="accent"
                />
                <KpiCard
                    title="Aktif Siparişler"
                    value="14"
                    hint="Son: 45 dk önce"
                    delta={5.2}
                    variant="warning"
                />
                <KpiCard
                    title="İadeler"
                    value="₺1,240"
                    hint="Bu hafta"
                    delta={-8.4}
                    variant="error"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Chart */}
                <div className="col-span-1 rounded-2xl border border-border bg-surface p-6 shadow-glow lg:col-span-2">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-text">Haftalık Satış Grafiği</h3>
                            <p className="text-sm text-muted">Geçen haftayla karşılaştırmalı</p>
                        </div>
                        <SearchableDropdown
                            options={[...periodOptions]}
                            value={period}
                            onChange={setPeriod}
                            placeholder="Donem"
                            showEmptyOption={false}
                            allowClear={false}
                            inputAriaLabel="Dashboard donem secimi"
                            toggleAriaLabel="Dashboard donem listesini ac"
                            className="w-[140px]"
                        />
                    </div>
                    <WeeklySalesChart />
                </div>

                {/* Pie Chart */}
                <div className="col-span-1 flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-glow">
                    <h3 className="mb-1 text-lg font-semibold text-text">Kategori Dağılımı</h3>
                    <p className="mb-6 text-sm text-muted">Stok değerine göre</p>
                    <div className="flex-1">
                        <CategoryPieChart />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-text2">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            <span>Gıda (%34)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                            <span>İçecek (%22)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-yellow-500" />
                            <span>Temizlik (%15)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-purple-500" />
                            <span>Kişisel (%10)</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Recent Transactions */}
                <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
                    <h3 className="mb-4 text-lg font-semibold text-text">Son İşlemler</h3>
                    <div className="space-y-4">
                        {recentTransactions.map((tx, i) => (
                            <div key={i} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tx.tip === "İade" ? "bg-red-500/10 text-red-500" :
                                            tx.tip === "Stok Giriş" ? "bg-blue-500/10 text-blue-500" :
                                                "bg-green-500/10 text-green-500"
                                        }`}>
                                        {tx.tip === "İade" ? "↩" : tx.tip === "Stok Giriş" ? "📥" : "🛒"}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-text">{tx.magaza}</div>
                                        <div className="text-xs text-muted">{tx.zaman}</div>
                                    </div>
                                </div>
                                <div className={`text-sm font-semibold ${tx.tutar < 0 ? "text-red-500" : "text-text"}`}>
                                    {tx.tutar > 0 ? "+" : ""}
                                    {tx.tutar.toLocaleString("tr-TR")} ₺
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-text">Kritik Stok Uyarıları</h3>
                        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-500">
                            {lowStockItems.length} Ürün
                        </span>
                    </div>
                    <div className="space-y-3">
                        {lowStockItems.map((item, i) => (
                            <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-bg/50 p-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                    <div>
                                        <div className="text-sm font-medium text-text">{item.name}</div>
                                        <div className="text-xs text-muted">{item.magaza}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-red-500">{item.stok} adet</div>
                                    <div className="text-[10px] text-muted">Min: {item.min}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
