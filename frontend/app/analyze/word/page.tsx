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
          { label: "نور", href: "/analyze/word?word=نور" },
          { label: "قلب", href: "/analyze/word?word=قلب" },
          { label: "صبر", href: "/analyze/word?word=صبر" },
          { label: "جنة", href: "/analyze/word?word=جنة" },
          { label: "علم", href: "/analyze/word?word=علم" },
        ]}
      />
      <WordSearch initialWord={searchParams.word ?? ""} />
    </div>
  );
}
