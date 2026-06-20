"use client";

import { useCallback, useEffect, useState } from "react";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";

const amsLanguageStorageKey = "real-ams.language.v1";

export function useAmsLanguage(defaultLanguage: AmsLanguage = "en") {
  const [language, setLanguageState] = useState<AmsLanguage>(defaultLanguage);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(amsLanguageStorageKey);
    if (isAmsLanguage(storedLanguage)) {
      window.queueMicrotask(() => setLanguageState(storedLanguage));
    }
  }, []);

  const setLanguage = useCallback((nextLanguage: AmsLanguage) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(amsLanguageStorageKey, nextLanguage);
  }, []);

  return [language, setLanguage] as const;
}

function isAmsLanguage(value: string | null): value is AmsLanguage {
  return value === "en" || value === "es";
}
