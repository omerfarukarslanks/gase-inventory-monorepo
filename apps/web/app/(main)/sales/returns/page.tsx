import type { Metadata } from "next";
import ReturnsPageClient from "./ReturnsPageClient";

export const metadata: Metadata = {
  title: "İadeler",
  robots: { index: false, follow: false },
};

export default function SalesReturnsPage() {
  return (
    <>
      <h1 className="sr-only">İadeler</h1>
      <ReturnsPageClient />
    </>
  );
}
