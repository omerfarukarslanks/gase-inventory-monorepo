import type { Metadata } from "next";
import StoresPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Mağazalar",
  robots: { index: false, follow: false },
};

export default function StoresPage() {
  return (
    <>
      <h1 className="sr-only">Mağazalar</h1>
      <StoresPageClient />
    </>
  );
}
