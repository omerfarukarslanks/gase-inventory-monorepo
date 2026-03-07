import type { Metadata } from "next";
import UsersPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Kullanıcılar",
  robots: { index: false, follow: false },
};

export default function UsersPage() {
  return (
    <>
      <h1 className="sr-only">Kullanıcılar</h1>
      <UsersPageClient />
    </>
  );
}
