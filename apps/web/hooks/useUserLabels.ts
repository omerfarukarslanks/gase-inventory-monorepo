"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getUser } from "@/lib/users";
import { useSessionProfile } from "@/hooks/useSessionProfile";

function buildUserLabel(name?: string, surname?: string) {
  return [name, surname].filter(Boolean).join(" ").trim();
}

export function useUserLabels(userIds: string[]) {
  const { userId, displayName } = useSessionProfile();
  const requestedIdsRef = useRef<Set<string>>(new Set());
  const [labels, setLabels] = useState<Record<string, string>>({});

  const normalizedIds = useMemo(
    () => [...new Set(userIds.filter((id) => typeof id === "string" && id.trim()))],
    [userIds],
  );

  useEffect(() => {
    let cancelled = false;

    const unresolvedIds = normalizedIds.filter((id) => {
      if (id === userId && displayName) return false;
      return !labels[id] && !requestedIdsRef.current.has(id);
    });
    if (unresolvedIds.length === 0) return () => {
      cancelled = true;
    };

    unresolvedIds.forEach((id) => requestedIdsRef.current.add(id));

    void Promise.all(
      unresolvedIds.map(async (id) => {
        try {
          const user = await getUser(id);
          return {
            id,
            label: buildUserLabel(user.name, user.surname) || user.email || id,
          };
        } catch {
          return { id, label: id };
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      setLabels((previous) => {
        const next = { ...previous };
        entries.forEach((entry) => {
          next[entry.id] = entry.label;
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [displayName, labels, normalizedIds, userId]);

  return userId && displayName
    ? { ...labels, [userId]: displayName }
    : labels;
}
