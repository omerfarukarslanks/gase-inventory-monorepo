import type { Metadata } from "next";
import PaymentsPageClient from "./PaymentsPageClient";

export const metadata: Metadata = {
  title: "Tahsilatlar",
  robots: { index: false, follow: false },
};

export default function SalesPaymentsPage() {
  return (
    <>
      <h1 className="sr-only">Tahsilatlar</h1>
      <PaymentsPageClient />
    </>
  );
}
