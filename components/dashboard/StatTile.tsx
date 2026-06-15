import type { LucideIcon } from "lucide-react";

type Tone = "purple" | "mint" | "blue" | "yellow" | "pink" | "peach";

// Full-tile pastel cards for at-a-glance stats (the reference's "24 Enrolled /
// 34 Lesson / 10 Certificate" tiles). One hue per tile, colorful but quiet.
const tones: Record<Tone, { tile: string; chip: string; ink: string }> = {
  purple: { tile: "bg-pastel-purple", chip: "text-pastel-purple-ink", ink: "text-pastel-purple-ink" },
  mint: { tile: "bg-pastel-mint", chip: "text-pastel-mint-ink", ink: "text-pastel-mint-ink" },
  blue: { tile: "bg-pastel-blue", chip: "text-pastel-blue-ink", ink: "text-pastel-blue-ink" },
  yellow: { tile: "bg-pastel-yellow", chip: "text-pastel-yellow-ink", ink: "text-pastel-yellow-ink" },
  pink: { tile: "bg-pastel-pink", chip: "text-pastel-pink-ink", ink: "text-pastel-pink-ink" },
  peach: { tile: "bg-pastel-peach", chip: "text-pastel-peach-ink", ink: "text-pastel-peach-ink" },
};

export function StatTile({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
  tone: Tone;
}) {
  const t = tones[tone];
  return (
    <div className={`rounded-xl p-5 ${t.tile}`}>
      <div className="flex items-center gap-3.5">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface/70 ${t.chip}`}>
          <Icon size={22} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className={`font-mono text-h2 font-extrabold leading-none ${t.ink}`}>{value}</p>
          <p className="mt-1 truncate text-small font-medium text-primary/70">{label}</p>
        </div>
      </div>
    </div>
  );
}
