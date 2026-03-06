"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionUser } from "@/lib/authz";

const ALLOWED_ROLES = ["OWNER", "ADMIN", "MANAGER"];

export function useAdminGuard(): boolean {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const user = getSessionUser();
    const role = (user as { role?: string } | null)?.role;
    if (role && ALLOWED_ROLES.includes(role)) {
      setAllowed(true);
    } else {
      router.replace("/dashboard");
    }
  }, [router]);

  return allowed;
}
