"use client";

import { useEffect, useState } from "react";
import {
  EMPTY_PROFILE_SNAPSHOT,
  getSessionProfileSnapshot,
  subscribeToSessionChange,
  type SessionProfileSnapshot,
} from "@/lib/session";

export function useSessionProfile(): SessionProfileSnapshot {
  const [profile, setProfile] = useState<SessionProfileSnapshot>(EMPTY_PROFILE_SNAPSHOT);

  useEffect(() => {
    setProfile(getSessionProfileSnapshot());
    return subscribeToSessionChange(() => setProfile(getSessionProfileSnapshot()));
  }, []);

  return profile;
}
