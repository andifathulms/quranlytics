import { RefrainExplorer } from "@/components/analytics/RefrainExplorer";
import { ToolIntro } from "@/components/ui/ToolIntro";

export const metadata = { title: "Refrains & Repeated Phrases · Quranlytics" };

export default function RefrainPage() {
  return (
    <div className="space-y-6">
      <ToolIntro
        title="Refrains & Repeated Phrases"
        description="Repetition (tikrār) is a hallmark of Quranic discourse — Surah Ar-Rahman repeats one verse 31 times. Search for any phrase, or browse the verses that recur verbatim. Quranlytics surfaces the data and lets you draw your own conclusions."
      />
      <RefrainExplorer />
    </div>
  );
}
