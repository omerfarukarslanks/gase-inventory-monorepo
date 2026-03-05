"use client";

import { useEffect, useState } from "react";
import type { PermissionName } from "@/lib/authz";

/**
 * Reads permissions from the session user stored in localStorage.
 * Returns helper functions to check permissions reactively.
 */
export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return;
      const user = JSON.parse(raw) as { permissions?: string[] };
      setPermissions(user.permissions ?? []);
    } catch {
      setPermissions([]);
    }
  }, []);

  const can = (permission: PermissionName): boolean =>
    permissions.includes(permission);

  const canAny = (perms: PermissionName[]): boolean =>
    perms.some((p) => permissions.includes(p));

  return { can, canAny, permissions };
}
