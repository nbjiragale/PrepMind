"use client";

interface Props<T extends string | number> {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

// A small segmented control — used for the 1–5 confidence prompt.
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  disabled,
  ariaLabel,
}: Props<T>) {
  return (
    <div role="group" aria-label={ariaLabel} className="inline-flex rounded-full border border-border-strong bg-surface p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`min-w-9 rounded-full px-3 py-1.5 text-body transition-all duration-150 disabled:opacity-50 ${
              active ? "bg-accent text-on-accent font-semibold shadow-accent" : "text-secondary hover:bg-hover"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
