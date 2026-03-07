import "./globals.css";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import ThemeProvider from "@/components/theme/ThemeProvider";
import { LangProvider } from "@/context/LangContext";

const dm = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://app.stockpulse.com"),
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "StockPulse",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "StockPulse ile stok takibi, satış yönetimi ve raporlamayı tek platformdan kolayca yönetin.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "TRY",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={dm.className}>
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-component */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          <LangProvider>{children}</LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
