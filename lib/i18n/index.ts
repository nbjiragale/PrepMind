import type { Locale } from "./config";
import { ui, navByHref, groupByKey, type UiKey } from "./messages.ts";

export type { UiKey } from "./messages.ts";
export type { Locale } from "./config";

// Interpolate {name} placeholders. Single-language lookup — server components
// pass the request locale, client components get it from the LocaleProvider.
export function t(locale: Locale, key: UiKey, vars?: Record<string, string | number>): string {
  let s = ui[locale]?.[key] ?? ui.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{${k}}`).join(String(v));
    }
  }
  return s;
}

export function tNav(locale: Locale, href: string, fallback: string): string {
  return navByHref[locale]?.[href] ?? navByHref.en[href] ?? fallback;
}

export function tGroup(locale: Locale, key: string, fallback: string): string {
  return groupByKey[locale]?.[key] ?? groupByKey.en[key] ?? fallback;
}
