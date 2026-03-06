import "./globals.css";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import ThemeProvider from "@/components/theme/ThemeProvider";
import { LangProvider } from "@/context/LangContext";

const dm = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: {
    default: "StockPulse — Stok & Satış Yönetimi",
    template: "%s | StockPulse",
  },
  description:
    "StockPulse ile stok takibi, satış yönetimi ve raporlamayı tek platformdan kolayca yönetin.",
  keywords: ["stok yönetimi", "satış takibi", "envanter", "POS", "mağaza yönetimi"],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "StockPulse",
    title: "StockPulse — Stok & Satış Yönetimi",
    description:
      "StockPulse ile stok takibi, satış yönetimi ve raporlamayı tek platformdan kolayca yönetin.",
  },
  twitter: {
    card: "summary_large_image",
    title: "StockPulse — Stok & Satış Yönetimi",
    description:
      "StockPulse ile stok takibi, satış yönetimi ve raporlamayı tek platformdan kolayca yönetin.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={dm.className}>
        <ThemeProvider>
          <LangProvider>{children}</LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
