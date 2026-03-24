"use client";

import { useEffect, useState } from "react";
import type { PermissionName } from "@/lib/authz";
import { getSessionProfileSnapshot, subscribeToSessionChange } from "@/lib/session";

/**
 * Reads permissions from the session user stored in localStorage.
 * Returns helper functions to check permissions reactively.
 */
export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    setPermissions(getSessionProfileSnapshot().permissions);
    return subscribeToSessionChange(() => setPermissions(getSessionProfileSnapshot().permissions));
  }, []);

  const can = (permission: PermissionName): boolean =>
    permissions.includes(permission);

  const canAny = (perms: PermissionName[]): boolean =>
    perms.some((p) => permissions.includes(p));

  return { can, canAny, permissions };
}
