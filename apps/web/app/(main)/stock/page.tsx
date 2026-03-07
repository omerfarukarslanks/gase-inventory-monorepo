import type { Metadata } from "next";
import StockPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Stok",
  robots: { index: false, follow: false },
};

export default function StockPage() {
  return (
    <>
      <h1 className="sr-only">Stok</h1>
      <StockPageClient />
    </>
  );
}
