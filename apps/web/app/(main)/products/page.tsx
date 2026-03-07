import type { Metadata } from "next";
import ProductsPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Ürünler",
  robots: { index: false, follow: false },
};

export default function ProductsPage() {
  return (
    <>
      <h1 className="sr-only">Ürünler</h1>
      <ProductsPageClient />
    </>
  );
}
