import type { Metadata } from "next";
import SalesPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Satışlar",
  robots: { index: false, follow: false },
};

export default function SalesPage() {
  return (
    <>
      <h1 className="sr-only">Satışlar</h1>
      <SalesPageClient />
    </>
  );
}
