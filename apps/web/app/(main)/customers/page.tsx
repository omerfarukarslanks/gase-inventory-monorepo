import type { Metadata } from "next";
import CustomersPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Müşteriler",
  robots: { index: false, follow: false },
};

export default function CustomersPage() {
  return (
    <>
      <h1 className="sr-only">Müşteriler</h1>
      <CustomersPageClient />
    </>
  );
}
