import type { Metadata } from "next";
import ProductPackagesPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Urun Paketleri",
  robots: { index: false, follow: false },
};

export default function ProductPackagesPage() {
  return (
    <>
      <h1 className="sr-only">Urun Paketleri</h1>
      <ProductPackagesPageClient />
    </>
  );
}
