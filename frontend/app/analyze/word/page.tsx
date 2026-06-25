import { WordSearch } from "@/components/analytics/WordSearch";
import { ToolIntro } from "@/components/ui/ToolIntro";

export const metadata = { title: "Word Frequency · Quranlytics" };

export default function WordAnalyzePage({
  searchParams,
}: {
  searchParams: { word?: string };
}) {
  return (
    <div className="space-y-6">
      <ToolIntro
        title="Word Frequency"
        description="Search any Arabic word to see its total count and distribution across all 114 surahs."
        examples={[
          { label: "ٱللَّه", href: "/analyze/word?word=الله" },
          { label: "يوم", href: "/analyze/word?word=يوم" },
          { label: "رحمة", href: "/analyze/word?word=رحمة" },
        ]}
      />
      <WordSearch initialWord={searchParams.word ?? ""} />
    </div>
  );
}
