import type { HTMLAttributes } from "react";

type Tone = "neutral" | "success" | "warning" | "danger" | "accent" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-subtle text-secondary",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  danger: "bg-danger-subtle text-danger",
  accent: "bg-accent-subtle text-accent-strong",
  info: "bg-info-subtle text-info",
};

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className = "", ...props }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-semibold ${tones[tone]} ${className}`}
      {...props}
    />
  );
}
