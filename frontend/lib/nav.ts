// Single source of truth for primary navigation.
// Consumed by Header (desktop menus), MobileNav (drawer), Breadcrumbs, and the
// /analyze hub. Keep labels short — they render as menu items and crumbs.

export interface NavItem {
  href: string;
  label: string;
  description: string;
}

export interface NavGroup {
  label: string;
  /** Landing route for the group (used for active-state + breadcrumb). */
  href: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Read",
    href: "/",
    items: [
      {
        href: "/",
        label: "Reader",
        description: "Browse all 114 surahs with translations.",
      },
    ],
  },
  {
    label: "Analyze",
    href: "/analyze",
    items: [
      {
        href: "/analyze/word",
        label: "Word Frequency",
        description: "Count a word across the Quran and see its distribution.",
      },
      {
        href: "/analyze/root",
        label: "Root Explorer",
        description: "Walk a trilateral root and its derived forms.",
      },
      {
        href: "/analyze/cooccurrence",
        label: "Co-occurrence",
        description: "Find verses where two words appear together.",
      },
      {
        href: "/analyze/rare",
        label: "Rare Words",
        description: "Surface words that appear only once or twice.",
      },
      {
        href: "/analyze/refrain",
        label: "Refrains",
        description: "Find repeated phrases and verbatim refrains across the Quran.",
      },
      {
        href: "/analyze/structure",
        label: "Structure",
        description: "Verse rhythm, paired surahs, and ring structures.",
      },
      {
        href: "/analyze/stats",
        label: "Statistics",
        description: "Per-surah word, letter, and unique-form counts.",
      },
    ],
  },
  {
    label: "Explore",
    href: "/explore",
    items: [
      {
        href: "/semantic",
        label: "Semantic Search",
        description: "Search by meaning across English, Indonesian, Arabic.",
      },
      {
        href: "/themes",
        label: "Themes",
        description: "Verses clustered by semantic theme.",
      },
      {
        href: "/explore/names",
        label: "99 Names",
        description: "The Asmā' al-Ḥusnā — roots, occurrences, and verses.",
      },
      {
        href: "/explore",
        label: "Miracle Facts",
        description: "Documented patterns verified against live data.",
      },
    ],
  },
  {
    label: "Community",
    href: "/discoveries",
    items: [
      {
        href: "/discoveries",
        label: "Discoveries",
        description: "Patterns shared by the community.",
      },
    ],
  },
];

// Flat lookup of route -> label, for breadcrumbs on deep routes.
export const NAV_LABELS: Record<string, string> = NAV_GROUPS.reduce(
  (acc, group) => {
    acc[group.href] = group.label;
    for (const item of group.items) acc[item.href] = item.label;
    return acc;
  },
  {} as Record<string, string>,
);
