import Link from "next/link";
import { Target, PieChart, Timer, Flag, ArrowRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ReadinessCard } from "@/components/dashboard/ReadinessCard";
import { MasteryHeatmap } from "@/components/dashboard/MasteryHeatmap";
import { CoverageBars } from "@/components/dashboard/CoverageBars";
import { StreakCounter } from "@/components/dashboard/StreakCounter";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { StatTile } from "@/components/dashboard/StatTile";
import {
  getHeatmap,
  getCoverage,
  getReviewDays,
  getReadinessConcepts,
  getRecentMockFractions,
} from "@/lib/db/queries/insights";
import { getTopicTrends } from "@/lib/db/queries/snapshots";
import { requireExamConfig } from "@/lib/exam/guard";
import { guessProbability } from "@/lib/exam/subjects";
import { computeReadiness } from "@/lib/readiness";
import { computeStreak } from "@/lib/streak";

export const dynamic = "force-dynamic";

// Epic J — insights dashboard: readiness, heatmap, trends, coverage, streak.
export default async function DashboardPage() {
  const [heatmap, coverage, reviewDays, rcConcepts, mockFractions, trends, config] =
    await Promise.all([
      getHeatmap(),
      getCoverage(),
      getReviewDays(),
      getReadinessConcepts(),
      getRecentMockFractions(5),
      getTopicTrends(8),
      requireExamConfig(),
    ]);

  const sectionMarks = config.sections.reduce((sum, s) => sum + s.marks, 0);
  const totalMarks = sectionMarks > 0 ? sectionMarks : 100;
  const negRatio = config.negative_mark_ratio;
  // Target = the exam's qualifying band (from config), applied to total marks.
  const targetMarks = Math.round(totalMarks * config.qualifying_fraction);

  const readiness = computeReadiness({
    totalMarks,
    concepts: rcConcepts.map((c) => ({
      pKnown: c.p_known,
      examWeight: c.exam_weight,
      attempted: c.attempted,
    })),
    mockScoreFractions: mockFractions,
    negRatio,
    guessProbability: guessProbability(config.options_per_question),
    targetMarks,
  });

  const today = new Date().toISOString().slice(0, 10);
  const streak = computeStreak(reviewDays, today);

  const hasData = heatmap.length > 0;
  const coveragePct = Math.round(readiness.coverage * 100);

  return (
    <div className="mx-auto max-w-shell px-6 py-8 md:px-8">
      <header className="mb-7">
        <h1 className="text-h1 flex items-center gap-2">
          Dashboard <span aria-hidden>📊</span>
        </h1>
        <p className="text-secondary text-body mt-1">
          Where you stand, how you&apos;re trending, and how ready you are — with honest uncertainty.
        </p>
      </header>

      {!hasData ? (
        <Card className="p-8">
          <p className="text-body-lg text-secondary">
            Add concepts and start practising — your insights appear here as data accrues.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* Hero + streak */}
          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent to-accent-light p-7 text-on-accent shadow-accent">
              <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
              <div className="absolute -bottom-14 right-16 h-32 w-32 rounded-full bg-white/10" />
              <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-caption font-semibold">
                  <Sparkles size={13} strokeWidth={2.4} /> Today
                </span>
                <h2 className="mt-3 max-w-md text-h1 font-extrabold leading-tight">
                  Keep the momentum going
                </h2>
                <p className="mt-1.5 max-w-md text-body text-on-accent/85">
                  Tracking at{" "}
                  <span className="font-bold">
                    {Math.round(readiness.expected)}/{totalMarks}
                  </span>{" "}
                  marks. A short review now keeps your edge sharp.
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Link
                    href="/review"
                    className="inline-flex items-center gap-1.5 rounded-full bg-surface px-5 py-2.5 text-body font-semibold text-accent-strong transition-transform duration-150 hover:-translate-y-0.5"
                  >
                    Start review <ArrowRight size={16} strokeWidth={2.4} />
                  </Link>
                  <Link
                    href="/planner"
                    className="inline-flex items-center rounded-full bg-white/15 px-5 py-2.5 text-body font-semibold text-on-accent transition-colors hover:bg-white/25"
                  >
                    Today&apos;s plan
                  </Link>
                </div>
              </div>
            </div>
            <StreakCounter streak={streak} />
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile icon={Target} tone="purple" value={Math.round(readiness.expected)} label={`Projected / ${totalMarks} marks`} />
            <StatTile icon={PieChart} tone="mint" value={`${coveragePct}%`} label="Syllabus covered" />
            <StatTile icon={Timer} tone="blue" value={readiness.nMocks} label={`Mock${readiness.nMocks === 1 ? "" : "s"} taken`} />
            <StatTile icon={Flag} tone="yellow" value={targetMarks} label="Target to qualify" />
          </div>

          <ReadinessCard readiness={readiness} totalMarks={totalMarks} targetMarks={targetMarks} />

          <TrendChart points={trends} />

          <Card className="p-6">
            <h2 className="text-h3 mb-4">Mastery heatmap</h2>
            <MasteryHeatmap cells={heatmap} />
          </Card>

          <CoverageBars rows={coverage} />
        </div>
      )}
    </div>
  );
}
