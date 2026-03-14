"use client";

import { useEffect, useMemo } from "react";
import { useAiReportContext } from "@/context/AiReportContext";
import type { AiReportContext } from "@/lib/analytics";

export function useSyncAiReportContext(nextContext: AiReportContext) {
  const { setContext } = useAiReportContext();
  const serialized = useMemo(() => JSON.stringify(nextContext), [nextContext]);

  useEffect(() => {
    setContext(JSON.parse(serialized) as AiReportContext);
  }, [serialized, setContext]);
}
