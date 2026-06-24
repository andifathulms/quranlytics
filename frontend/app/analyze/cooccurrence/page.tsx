import { CooccurrenceSearch } from "@/components/analytics/CooccurrenceSearch";

export const metadata = { title: "Co-occurrence · Quranlytics" };

export default function CooccurrencePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl">Word Co-occurrence</h1>
        <p className="text-lapis/60">
          Find every verse where two words appear together — e.g. رحمة (mercy)
          and عذاب (punishment).
        </p>
      </header>
      <CooccurrenceSearch />
    </div>
  );
}
