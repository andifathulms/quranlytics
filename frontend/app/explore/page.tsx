import { MiracleCard, type MiracleFact } from "@/components/analytics/MiracleCard";

export const metadata = { title: "Explore · Quranlytics" };

// Curated, documented claims. Each is verified live against the ingested data —
// Quranlytics presents the numbers and lets the reader draw their own
// conclusions (no automated assertions about what a pattern "proves").
const FACTS: MiracleFact[] = [
  {
    id: "day-365",
    category: "Numerical",
    title: "The word 'Day' (يوم)",
    word: "يوم",
    claimed: 365,
    description:
      "A widely shared claim holds that the singular word for 'day' occurs 365 times. Verify the live count yourself.",
  },
  {
    id: "month-12",
    category: "Numerical",
    title: "The word 'Month' (شهر)",
    word: "شهر",
    claimed: 12,
    description:
      "The word for 'month' is said to appear 12 times — matching the months of the year.",
  },
  {
    id: "dunya-akhira",
    category: "Linguistic",
    title: "This life (دنيا)",
    word: "دنيا",
    claimed: 115,
    description:
      "The word for 'this world' is often cited as balanced against the word for 'the hereafter'. Check the count.",
  },
  {
    id: "angels-devils",
    category: "Thematic",
    title: "Angels (ملائكة)",
    word: "ملائكة",
    claimed: 88,
    description:
      "A claimed balance between references to angels and to devils. Verify the angels count first.",
  },
];

const CATEGORIES = ["Numerical", "Linguistic", "Structural", "Thematic"] as const;

export default function ExplorePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl">Miracle Facts Explorer</h1>
        <p className="max-w-2xl text-lapis/60">
          Documented numerical and linguistic patterns. Click any card to verify
          the claim against live data. Quranlytics shows the count — you draw the
          conclusion.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 text-xs">
        {CATEGORIES.map((c) => (
          <span
            key={c}
            className="rounded-full border border-sand px-3 py-1 text-lapis/60"
          >
            {c}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FACTS.map((f) => (
          <MiracleCard key={f.id} fact={f} />
        ))}
      </div>
    </div>
  );
}
