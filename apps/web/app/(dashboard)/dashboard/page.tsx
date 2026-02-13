import { KpiCard } from "@/components/ui/KpiCard";
import {
  lowStockItems,
  recentTransactions,
  stockByCategory,
  storePerf,
  topProducts,
} from "@/components/dashboard/data";
import { WeeklySalesChart, CategoryPieChart, MonthlyBarChart } from "@/components/dashboard/Chart";

const fmtCurrency = (n: number) => "₺" + n.toLocaleString("tr-TR");

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Günlük Satış" value={fmtCurrency(130500)} hint="Dünkü: ₺116.200" delta={12.4} variant="primary" />
        <KpiCard title="Toplam Stok Değeri" value={fmtCurrency(2840000)} hint="8.760 ürün çeşidi" delta={3.2} variant="accent" />
        <KpiCard title="Aktif Ürünler" value="4,286" hint="Bu ay +248 yeni" delta={5.8} variant="primary" />
        <KpiCard title="Bekleyen Transfer" value="18" hint="7 acil transfer" delta={-15} variant="warning" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="xl:col-span-2 rounded-xl2 border border-border bg-surface p-5 shadow-glow animate-su">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="text-sm font-semibold text-text">Haftalık Satış & İade</div>
              <div className="text-xs text-muted">Son 7 gün</div>
            </div>
            <div className="text-xs text-text2">
              <span className="mr-3 inline-flex items-center gap-2">
                <span className="h-[3px] w-3 rounded bg-primary" /> Satış
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-[3px] w-3 rounded bg-error" /> İade
              </span>
            </div>
          </div>
          <WeeklySalesChart />
        </section>

        <section className="rounded-xl2 border border-border bg-surface p-5 shadow-glow animate-su">
          <div className="mb-3">
            <div className="text-sm font-semibold text-text">Kategori Bazlı Stok</div>
            <div className="text-xs text-muted">Toplam 8,760 ürün</div>
          </div>

          <CategoryPieChart />

          <div className="mt-2 space-y-2">
            {stockByCategory.map((x) => (
              <div key={x.name} className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-sm" style={{ background: x.color }} />
                <span className="flex-1 text-text2">{x.name}</span>
                <span className="font-semibold text-text">{x.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl2 border border-border bg-surface p-5 shadow-glow animate-su">
          <div className="mb-4">
            <div className="text-sm font-semibold text-text">Aylık Gelir & Gider</div>
            <div className="text-xs text-muted">Son 6 ay trendi</div>
          </div>
          <MonthlyBarChart />
        </section>

        <section className="rounded-xl2 border border-border bg-surface p-5 shadow-glow animate-su">
          <div className="mb-4">
            <div className="text-sm font-semibold text-text">Mağaza Performansı</div>
            <div className="text-xs text-muted">Aylık satış / hedef</div>
          </div>

          <div className="space-y-4">
            {storePerf.map((s) => {
              const pct = Math.round((s.satis / s.hedef) * 100);
              const over = pct >= 100;
              return (
                <div key={s.name}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <div className="text-sm font-semibold text-text">{s.name}</div>
                    <div className={`text-sm font-semibold ${over ? "text-primary" : "text-text2"}`}>{pct}%</div>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-border/40">
                    <div
                      className={`h-full rounded-full ${over ? "bg-primary" : pct > 80 ? "bg-accent" : "bg-warning"}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between text-xs text-muted">
                    <span>{fmtCurrency(s.satis)}</span>
                    <span>Hedef: {fmtCurrency(s.hedef)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="xl:col-span-2 rounded-xl2 border border-border bg-surface p-5 shadow-glow animate-su">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-text">En Çok Satan Ürünler</div>
              <div className="text-xs text-muted">Bu haftaki satış miktarı</div>
            </div>
            <button className="text-sm font-semibold text-primary hover:text-primaryHover">Tümünü Gör →</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-separate border-spacing-y-2">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-muted">
                  <th className="px-3 py-2 text-left">Ürün</th>
                  <th className="px-3 py-2 text-left">SKU</th>
                  <th className="px-3 py-2 text-right">Satış</th>
                  <th className="px-3 py-2 text-right">Stok</th>
                  <th className="px-3 py-2 text-right">Trend</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.sku} className="rounded-xl2 bg-surface2/60 hover:bg-surface2">
                    <td className="rounded-l-xl2 px-3 py-3 text-sm font-semibold text-text">{p.name}</td>
                    <td className="px-3 py-3 font-mono text-xs text-muted">{p.sku}</td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-text">{p.satis.toLocaleString()}</td>
                    <td className={`px-3 py-3 text-right text-sm ${p.stok < 300 ? "font-semibold text-error" : "text-text2"}`}>
                      {p.stok.toLocaleString()}
                    </td>
                    <td className="rounded-r-xl2 px-3 py-3 text-right text-sm font-semibold">
                      <span className={p.trend >= 0 ? "text-primary" : "text-error"}>
                        {p.trend >= 0 ? "▲" : "▼"} {Math.abs(p.trend)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-xl2 border border-border bg-surface p-5 shadow-glow animate-su">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-text">Düşük Stok Uyarıları</div>
              <span className="rounded-full bg-error/10 px-2.5 py-1 text-xs font-bold text-error">{lowStockItems.length}</span>
            </div>

            <div className="space-y-2">
              {lowStockItems.map((x) => (
                <div key={x.name} className="flex items-center gap-3 rounded-xl2 border border-border bg-surface2 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-text">{x.name}</div>
                    <div className="text-xs text-muted">{x.magaza}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-error">{x.stok}</div>
                    <div className="text-[10px] text-muted">min: {x.min}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl2 border border-border bg-surface p-5 shadow-glow animate-su">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-text">Son İşlemler</div>
              <button className="text-xs font-semibold text-primary hover:text-primaryHover">Tümü →</button>
            </div>

            <div className="space-y-2">
              {recentTransactions.map((tx, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl2 px-2 py-2 hover:bg-surface2">
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-xl2 ${
                      tx.durum === "ok" ? "bg-primary/10 text-primary" : tx.durum === "return" ? "bg-error/10 text-error" : "bg-warning/10 text-warning"
                    }`}
                  >
                    {tx.durum === "ok" ? "₺" : tx.durum === "return" ? "↩" : "⇄"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between">
                      <div className="text-sm font-semibold text-text">{tx.tip}</div>
                      <div className={`text-sm font-bold ${tx.tutar < 0 ? "text-error" : "text-text"}`}>
                        {tx.tutar < 0 ? "-" : ""}₺{Math.abs(tx.tutar).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted">
                      <span className="truncate">{tx.magaza}</span>
                      <span>{tx.zaman}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
