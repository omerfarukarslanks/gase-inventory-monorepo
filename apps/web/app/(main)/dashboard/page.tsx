import type { Metadata } from "next";
import DashboardPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <>
      <h1 className="sr-only">Dashboard</h1>
      <DashboardPageClient />
    </>
  );
}
