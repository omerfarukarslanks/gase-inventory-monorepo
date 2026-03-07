import MainAppShell from "@/components/layout/MainAppShell";

export const dynamic = "force-dynamic";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <MainAppShell>{children}</MainAppShell>;
}
