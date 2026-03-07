import type { Metadata } from "next";
import AttributesPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Özellikler",
  robots: { index: false, follow: false },
};

export default function AttributesPage() {
  return (
    <>
      <h1 className="sr-only">Özellikler</h1>
      <AttributesPageClient />
    </>
  );
}
