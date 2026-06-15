"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { groupForPath, isActiveHref } from "@/lib/nav";
import { useT } from "@/components/i18n/LocaleProvider";

// Section tab bar for clustered screens (Insights, Study aids, Content,
// Library). Rendered once in the layout; reads the route to pick the active
// group and tab. Returns nothing on top-level routes. Underline style per
// UIdesignspec ("Tab active: text-primary + 2px accent underline, not boxed").
export function SectionTabs() {
  const pathname = usePathname();
  const { tNav, tGroup } = useT();
  const group = groupForPath(pathname);
  if (!group) return null;

  return (
    <div className="shrink-0 bg-canvas/80 px-6 pt-4 md:px-8 backdrop-blur-sm">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={tGroup(group.key, group.label)}>
        {group.tabs.map((t) => {
          const active = isActiveHref(pathname, t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-small font-semibold transition-all duration-150 ${
                active
                  ? "bg-accent text-on-accent shadow-accent"
                  : "text-secondary hover:bg-hover hover:text-primary"
              }`}
            >
              {tNav(t.href, t.label)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
