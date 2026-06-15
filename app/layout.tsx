import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_Kannada } from "next/font/google";
import "./globals.css";
import { Sidebar, MobileTabBar } from "@/components/Sidebar";
import { SectionTabs } from "@/components/SectionTabs";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { getExamConfig } from "@/lib/db/queries/examConfig";
import { getLocale } from "@/lib/i18n/server";

const BRAND = "PrepMind";

// Friendly geometric sans — the typographic voice of the UI.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

// Kannada glyphs — Jakarta has none, so Kannada text falls through to this in
// the font stack (per-glyph fallback) for the 'kn' locale.
const notoKannada = Noto_Sans_Kannada({
  subsets: ["kannada"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-kannada",
});

// Branding reads run during the build-time prerender of /_not-found too, where no
// DATABASE_URL is set — degrade to the brand name instead of failing the build.
async function activeExamName(): Promise<string | undefined> {
  try {
    return (await getExamConfig())?.exam_name ?? undefined;
  } catch {
    return undefined;
  }
}

// Title derives from config: "PrepMind · <exam>" once an exam is configured.
export async function generateMetadata(): Promise<Metadata> {
  const examName = await activeExamName();
  const title = examName ? `${BRAND} · ${examName}` : BRAND;
  return {
    title,
    description: "Spaced-repetition review, practice, and study planning.",
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: BRAND, statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  themeColor: "#F4F2FC",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [examName, locale] = await Promise.all([activeExamName(), getLocale()]);
  return (
    <html lang={locale} className={`${jakarta.variable} ${notoKannada.variable}`}>
      <body className="bg-canvas text-primary">
        <LocaleProvider locale={locale}>
          <div className="flex h-dvh">
            <Sidebar examName={examName} />
            <main className="flex flex-1 flex-col overflow-hidden">
              <SectionTabs />
              <div className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</div>
            </main>
          </div>
          <MobileTabBar />
        </LocaleProvider>
      </body>
    </html>
  );
}
