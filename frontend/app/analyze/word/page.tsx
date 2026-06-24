import { WordSearch } from "@/components/analytics/WordSearch";

export const metadata = { title: "Word Frequency · Quranlytics" };

export default function WordAnalyzePage({
  searchParams,
}: {
  searchParams: { word?: string };
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl">Word Frequency</h1>
        <p className="text-lapis/60">
          Search any Arabic word to see its total count and distribution across
          all 114 surahs.
        </p>
      </header>
      <WordSearch initialWord={searchParams.word ?? ""} />
    </div>
  );
}
