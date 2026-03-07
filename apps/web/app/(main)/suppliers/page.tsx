import type { Metadata } from "next";
import SuppliersPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Tedarikçiler",
  robots: { index: false, follow: false },
};

export default function SuppliersPage() {
  return (
    <>
      <h1 className="sr-only">Tedarikçiler</h1>
      <SuppliersPageClient />
    </>
  );
}
