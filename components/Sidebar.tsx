"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  PencilLine,
  Timer,
  CalendarCheck,
  ScrollText,
  MessageCircle,
  LayoutDashboard,
  Upload,
  BookOpen,
  Brain,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { NAV_SINGLES, NAV_GROUPS, isActiveHref } from "@/lib/nav";
import { useT } from "@/components/i18n/LocaleProvider";

const SINGLE_ICONS: Record<string, LucideIcon> = {
  "/review": GraduationCap,
  "/practice": PencilLine,
  "/planner": CalendarCheck,
  "/digest": ScrollText,
};

// Icon per group (keyed to lib/nav NAV_GROUPS).
const GROUP_ICONS: Record<string, LucideIcon> = {
  mock: Timer,
  "study-aids": MessageCircle,
  insights: LayoutDashboard,
  content: Upload,
  library: BookOpen,
};

// One flat list of {href, label, icon, isActive} for the desktop sidebar:
// daily-use singles first, then one entry per clustered group (links to its
// first tab, highlights when any of its tabs is active).
function buildNavItems(pathname: string) {
  const singles = NAV_SINGLES.map((s) => ({
    href: s.href,
    label: s.label,
    groupKey: null as string | null,
    Icon: SINGLE_ICONS[s.href],
    active: isActiveHref(pathname, s.href),
  }));
  const groups = NAV_GROUPS.map((g) => ({
    href: g.tabs[0].href,
    label: g.label,
    groupKey: g.key,
    Icon: GROUP_ICONS[g.key],
    active: g.tabs.some((t) => isActiveHref(pathname, t.href)),
  }));
  return [...singles, ...groups];
}

export function Sidebar({ examName }: { examName?: string }) {
  const pathname = usePathname();
  const { t, tNav, tGroup } = useT();
  const items = buildNavItems(pathname);
  return (
    <nav className="bg-surface border-r border-border h-full w-60 shrink-0 p-4 hidden md:flex md:flex-col gap-1">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 pb-4 pt-1">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-on-accent shadow-accent">
          <Brain size={20} strokeWidth={2} />
        </span>
        <span className="text-h3 font-extrabold tracking-tight text-primary">
          {examName || "PrepMind"}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        {items.map(({ href, label, groupKey, Icon, active }) => (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-full px-3.5 py-2.5 text-body transition-all duration-150 ${
              active
                ? "bg-accent text-on-accent font-semibold shadow-accent"
                : "text-secondary hover:bg-hover hover:text-primary"
            }`}
          >
            {Icon && <Icon size={18} strokeWidth={active ? 2.2 : 1.75} />}
            {groupKey ? tGroup(groupKey, label) : tNav(href, label)}
          </Link>
        ))}
      </div>

      {/* Footer card — quiet nudge toward insights (mirrors the reference's
          bottom card slot without inventing a paywall). */}
      <Link
        href="/dashboard"
        className="mt-auto block overflow-hidden rounded-2xl bg-gradient-to-br from-accent to-accent-light p-4 text-on-accent shadow-accent transition-transform duration-150 hover:-translate-y-0.5"
      >
        <Sparkles size={20} strokeWidth={2} className="mb-2" />
        <p className="text-small font-semibold leading-snug">{t("shell.footerTitle")}</p>
        <p className="text-caption font-medium text-on-accent/80">{t("shell.footerSub")}</p>
      </Link>
    </nav>
  );
}

// The daily-use core for the small-screen bottom bar (the full set lives in the
// desktop sidebar). Keeps the bar uncrowded (UIdesignspec §5). Tutor stays one
// tap away even though it lives under the Study aids group on desktop.
const mobileItems: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/review", label: "Review", Icon: GraduationCap },
  { href: "/practice", label: "Practice", Icon: PencilLine },
  { href: "/mock", label: "Mock", Icon: Timer },
  { href: "/planner", label: "Planner", Icon: CalendarCheck },
  { href: "/tutor", label: "Tutor", Icon: MessageCircle },
];

// Short Kannada labels for the narrow mobile tabs (the full nav labels are too
// long for a tab cell). English keeps its existing short labels.
const MOBILE_KN: Record<string, string> = {
  "/review": "ಪುನರಾವರ್ತನೆ",
  "/practice": "ಅಭ್ಯಾಸ",
  "/mock": "ಅಣಕು",
  "/planner": "ಯೋಜಕ",
  "/tutor": "ಬೋಧಕ",
};

// Mobile bottom tab bar — the sidebar's small-screen form (UIdesignspec §5).
export function MobileTabBar() {
  const pathname = usePathname();
  const { locale } = useT();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-10 flex border-t border-border bg-surface shadow-lg">
      {mobileItems.map(({ href, label, Icon }) => {
        const active = isActiveHref(pathname, href);
        const text = locale === "kn" ? MOBILE_KN[href] ?? label : label;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-caption font-medium transition-colors ${
              active ? "text-accent-strong" : "text-secondary"
            }`}
          >
            <span
              className={`grid h-8 w-12 place-items-center rounded-full transition-colors ${
                active ? "bg-accent-subtle" : ""
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.75} />
            </span>
            {text}
          </Link>
        );
      })}
    </nav>
  );
}
