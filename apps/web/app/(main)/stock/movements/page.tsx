import type { Metadata } from "next";
import MovementsPageClient from "./MovementsPageClient";

export const metadata: Metadata = {
  title: "Stok Hareketleri",
  robots: { index: false, follow: false },
};

export default function StockMovementsPage() {
  return (
    <>
      <h1 className="sr-only">Stok Hareketleri</h1>
      <MovementsPageClient />
    </>
  );
}
