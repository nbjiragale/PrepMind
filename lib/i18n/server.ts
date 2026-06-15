import { cache } from "react";
import { getExamConfig } from "@/lib/db/queries/examConfig";
import { coerceLocale, DEFAULT_LOCALE, type Locale } from "./config";

// Active locale for the current request, read from exam_config.locale. Cached
// per request (React cache) so repeated calls in one render don't re-query.
// Degrades to the default when unconfigured or the DB is unreachable (e.g. the
// build-time prerender of /_not-found), mirroring the layout's branding read.
export const getLocale = cache(async (): Promise<Locale> => {
  try {
    const config = await getExamConfig();
    return coerceLocale(config?.locale);
  } catch {
    return DEFAULT_LOCALE;
  }
});
