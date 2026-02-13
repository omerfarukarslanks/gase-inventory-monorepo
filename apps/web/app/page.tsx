"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Tarayıcı tarafında çalışacak kontrol
    const checkAuth = () => {
      // localStorage kontrolü
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");

      if (token && user) {
        // Token ve kullanıcı bilgisi varsa dashboard'a yönlendir
        router.replace("/dashboard");
      } else {
        // Yoksa login sayfasına yönlendir
        router.replace("/auth/login");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg text-text">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="h-12 w-12 rounded-full bg-surface2 border border-border"></div>
        <div className="text-sm font-medium text-muted">Yükleniyor...</div>
      </div>
    </div>
  );
}
