import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionUserRole, isStoreScopedRole } from "@/lib/authz";

/**
 * Redirects store-scoped roles to /dashboard.
 * Returns true once the access check has passed.
 */
export function useAdminGuard(): boolean {
  const router = useRouter();
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    const role = getSessionUserRole();
    if (isStoreScopedRole(role)) {
      router.replace("/dashboard");
      return;
    }
    setAccessChecked(true);
  }, [router]);

  return accessChecked;
}
