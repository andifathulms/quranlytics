import { SemanticSearch } from "@/components/semantic/SemanticSearch";

export const metadata = { title: "Semantic Search · Quranlytics" };

export default function SemanticPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl">Semantic Search</h1>
        <p className="text-lapis/60 dark:text-parchment/60">
          Search by meaning, not keywords. Ask a question or describe a concept
          in English, Indonesian, or Arabic and find the most relevant verses.
        </p>
      </header>
      <SemanticSearch />
    </div>
  );
}
