"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { t as translate, tNav as navLabel, tGroup as groupLabel, type UiKey } from "@/lib/i18n";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

// Set once in the root layout with the request locale (resolved server-side from
// exam_config). Client components read it via the hooks below.
export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

// Bound translator for client components: const t = useT(); t("review.reveal").
export function useT() {
  const locale = useLocale();
  return useMemo(
    () => ({
      t: (key: UiKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
      tNav: (href: string, fallback: string) => navLabel(locale, href, fallback),
      tGroup: (key: string, fallback: string) => groupLabel(locale, key, fallback),
      locale,
    }),
    [locale]
  );
}
