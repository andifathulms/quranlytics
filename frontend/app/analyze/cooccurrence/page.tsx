import { CooccurrenceSearch } from "@/components/analytics/CooccurrenceSearch";
import { ToolIntro } from "@/components/ui/ToolIntro";

export const metadata = { title: "Co-occurrence · Quranlytics" };

export default function CooccurrencePage() {
  return (
    <div className="space-y-6">
      <ToolIntro
        title="Word Co-occurrence"
        description="Find every verse where two words appear together — e.g. رحمة (mercy) and عذاب (punishment)."
      />
      <CooccurrenceSearch />
    </div>
  );
}
