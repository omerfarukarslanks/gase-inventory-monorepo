import "./globals.css";
import { DM_Sans } from "next/font/google";
import ThemeProvider from "@/components/theme/ThemeProvider";
import { LangProvider } from "@/context/LangContext";

const dm = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={dm.className}>
        <ThemeProvider>
          <LangProvider>{children}</LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
