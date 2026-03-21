import type { Metadata } from "next";
import UnitsPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Birimler",
  robots: { index: false, follow: false },
};

export default function UnitsPage() {
  return <UnitsPageClient />;
}
