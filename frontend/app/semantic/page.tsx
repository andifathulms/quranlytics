import { SemanticSearch } from "@/components/semantic/SemanticSearch";
import { ToolIntro } from "@/components/ui/ToolIntro";

export const metadata = { title: "Semantic Search · Quranlytics" };

export default function SemanticPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  return (
    <div className="space-y-6">
      <ToolIntro
        title="Semantic Search"
        description="Search by meaning, not keywords. Ask a question or describe a concept in English, Indonesian, or Arabic and find the most relevant verses."
      />
      <SemanticSearch initialQuery={searchParams.q ?? ""} />
    </div>
  );
}
