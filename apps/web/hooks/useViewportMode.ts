"use client";

import { useEffect, useState } from "react";

export type ViewportMode = "mobile" | "tablet" | "desktop";

function getModeFromWidth(width: number): ViewportMode {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function getViewportModeSnapshot(): ViewportMode {
  if (typeof window === "undefined") return "desktop";
  return getModeFromWidth(window.innerWidth);
}

export function useViewportMode(): ViewportMode {
  const [mode, setMode] = useState<ViewportMode>(() => getViewportModeSnapshot());

  useEffect(() => {
    const onResize = () => setMode(getViewportModeSnapshot());

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return mode;
}
