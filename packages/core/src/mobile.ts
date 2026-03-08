import type { LoginUserResponse } from "./auth";
import type { PermissionName } from "./authz";

export function hasPermissionFromSession(
  user: Pick<LoginUserResponse, "permissions"> | null | undefined,
  permission: PermissionName,
): boolean {
  return Boolean(user?.permissions?.includes(permission));
}
