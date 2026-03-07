import type { Metadata } from "next";
import ProductCategoriesPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Ürün Kategorileri",
  robots: { index: false, follow: false },
};

export default function ProductCategoriesPage() {
  return (
    <>
      <h1 className="sr-only">Ürün Kategorileri</h1>
      <ProductCategoriesPageClient />
    </>
  );
}
