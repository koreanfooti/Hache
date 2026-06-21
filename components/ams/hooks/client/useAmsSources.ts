"use client";

import { useEffect, useState } from "react";
import type { AmsAuthRole } from "@/lib/ams/auth-rules";
import {
  initialLoadSummary,
  initialSourceData,
  loadAmsLoadSummary,
  loadAmsSourceData,
} from "@/lib/ams/client";
import type { LoadSummary, SourceData } from "@/lib/ams/types";

export function useAmsSources(role: AmsAuthRole = "technicalStaff") {
  const [loadSummary, setLoadSummary] = useState<LoadSummary>(initialLoadSummary);
  const [sourceData, setSourceData] = useState<SourceData>(initialSourceData);

  useEffect(() => {
    let cancelled = false;

    loadAmsLoadSummary(role)
      .then((summary) => {
        if (!cancelled) setLoadSummary(summary);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadSummary({
            ...initialLoadSummary,
            status: error instanceof Error ? error.message : "Unable to load WIMU/GPS feed.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [role]);

  useEffect(() => {
    let cancelled = false;

    loadAmsSourceData(role)
      .then((data) => {
        if (!cancelled) setSourceData(data);
      })
      .catch((error) => {
        if (!cancelled) {
          setSourceData({
            ...initialSourceData,
            status: error instanceof Error ? error.message : "Unable to load AMS source data.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [role]);

  return { loadSummary, sourceData };
}
