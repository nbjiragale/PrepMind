import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar, MobileTabBar } from "@/components/Sidebar";
import { SectionTabs } from "@/components/SectionTabs";
import { getExamConfig } from "@/lib/db/queries/examConfig";

const BRAND = "PrepMind";

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
  themeColor: "#FAF9F5",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const examName = await activeExamName();
  return (
    <html lang="en">
      <body className="bg-canvas text-primary">
        <div className="flex h-dvh">
          <Sidebar examName={examName} />
          <main className="flex flex-1 flex-col overflow-hidden">
            <SectionTabs />
            <div className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</div>
          </main>
        </div>
        <MobileTabBar />
      </body>
    </html>
  );
}
