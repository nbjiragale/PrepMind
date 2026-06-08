import type { MetadataRoute } from "next";
import { getExamConfig } from "@/lib/db/queries/examConfig";

// Reads exam_config at request time — keep out of the build-time static prerender.
export const dynamic = "force-dynamic";

const BRAND = "PrepMind";

// PWA manifest (L2). Installable; warm-ivory theming. Name derives from the
// active exam config when present.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let examName: string | undefined;
  try {
    examName = (await getExamConfig())?.exam_name ?? undefined;
  } catch {
    examName = undefined; // no DB at build time → brand only
  }
  return {
    name: examName ? `${BRAND} · ${examName}` : BRAND,
    short_name: BRAND,
    description: "Spaced-repetition review, practice, and study planning.",
    start_url: "/review",
    display: "standalone",
    background_color: "#FAF9F5",
    theme_color: "#FAF9F5",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
