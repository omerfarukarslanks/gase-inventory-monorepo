export const salesWeekly = [
  { day: "Pzt", satis: 12400, iade: 820 },
  { day: "Sal", satis: 15800, iade: 650 },
  { day: "Çar", satis: 13200, iade: 940 },
  { day: "Per", satis: 18600, iade: 1100 },
  { day: "Cum", satis: 22400, iade: 780 },
  { day: "Cmt", satis: 28900, iade: 1450 },
  { day: "Paz", satis: 19200, iade: 620 },
];

export const stockByCategory = [
  { name: "Gıda", value: 3420, color: "rgb(var(--primary))" },
  { name: "İçecek", value: 2180, color: "#3B82F6" },
  { name: "Temizlik", value: 1540, color: "rgb(var(--warning))" },
  { name: "Kişisel Bakım", value: 980, color: "#8B5CF6" },
  { name: "Diğer", value: 640, color: "rgb(var(--error))" },
];

export const monthlyTrend = [
  { ay: "Oca", gelir: 284000, gider: 210000 },
  { ay: "Şub", gelir: 312000, gider: 225000 },
  { ay: "Mar", gelir: 298000, gider: 218000 },
  { ay: "Nis", gelir: 345000, gider: 240000 },
  { ay: "May", gelir: 378000, gider: 255000 },
  { ay: "Haz", gelir: 402000, gider: 270000 },
];

export const topProducts = [
  { name: "Organik Süt 1L", sku: "MLK-001", satis: 1240, stok: 856, trend: 12.4 },
  { name: "Tam Buğday Ekmek", sku: "BRD-015", satis: 980, stok: 420, trend: 8.2 },
  { name: "Doğal Su 500ml", sku: "WTR-003", satis: 2400, stok: 3200, trend: -2.1 },
  { name: "Zeytinyağı 1L", sku: "OIL-008", satis: 560, stok: 180, trend: 18.6 },
  { name: "Beyaz Peynir 500g", sku: "CHE-012", satis: 890, stok: 340, trend: 5.3 },
];

export const lowStockItems = [
  { name: "Zeytinyağı 1L", stok: 180, min: 500, magaza: "Kadıköy Şube" },
  { name: "Tereyağı 250g", stok: 45, min: 200, magaza: "Beşiktaş Şube" },
  { name: "Çamaşır Deterjanı 3L", stok: 28, min: 150, magaza: "Merkez Depo" },
  { name: "Diş Macunu 75ml", stok: 62, min: 300, magaza: "Şişli Şube" },
];

export const recentTransactions = [
  { tip: "Satış", tutar: 2480, magaza: "Kadıköy", zaman: "2 dk önce", durum: "ok" as const },
  { tip: "Transfer", tutar: 8400, magaza: "Merkez → Beşiktaş", zaman: "15 dk önce", durum: "pending" as const },
  { tip: "İade", tutar: -340, magaza: "Şişli", zaman: "28 dk önce", durum: "return" as const },
  { tip: "Satış", tutar: 5620, magaza: "Beşiktaş", zaman: "45 dk önce", durum: "ok" as const },
  { tip: "Stok Giriş", tutar: 12800, magaza: "Merkez Depo", zaman: "1 saat önce", durum: "ok" as const },
];

export const storePerf = [
  { name: "Kadıköy", satis: 145200, hedef: 160000 },
  { name: "Beşiktaş", satis: 128400, hedef: 140000 },
  { name: "Şişli", satis: 98600, hedef: 120000 },
  { name: "Bakırköy", satis: 112800, hedef: 110000 },
];
