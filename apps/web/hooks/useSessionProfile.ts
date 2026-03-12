"use client";

import { useEffect, useState } from "react";
import { getSessionProfileSnapshot, subscribeToSessionChange, type SessionProfileSnapshot } from "@/lib/session";

export function useSessionProfile(): SessionProfileSnapshot {
  const [profile, setProfile] = useState<SessionProfileSnapshot>(() => getSessionProfileSnapshot());

  useEffect(() => subscribeToSessionChange(() => setProfile(getSessionProfileSnapshot())), []);

  return profile;
}
