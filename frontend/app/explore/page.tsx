import { ClaimsExplorer } from "@/components/analytics/ClaimsExplorer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ToolIntro } from "@/components/ui/ToolIntro";
import { api } from "@/lib/api/client";
import type { NumericClaims } from "@/lib/api/types";

export const metadata = { title: "Miracle Facts Explorer · Quranlytics" };
export const revalidate = 3600;

async function getClaims(): Promise<NumericClaims | null> {
  try {
    return (await api.numericClaims()).data;
  } catch {
    return null;
  }
}

export default async function ExplorePage() {
  const data = await getClaims();

  return (
    <div className="space-y-6">
      <ToolIntro
        title="Miracle Facts — Checked Honestly"
        description="Popular numeric claims about the Quran, each checked live against the corpus and labelled Holds up / Depends how you count / Doesn’t hold. We show the real numbers and the verses — and make no claim about what any number proves."
      />
      {!data || data.claims.length === 0 ? (
        <EmptyState
          icon="🔢"
          title="No data available"
          description="Run the ingestion + build_frequency_cache commands on the backend, then reload."
        />
      ) : (
        <ClaimsExplorer
          claims={data.claims}
          categories={data.categories}
          methodology={data.methodology}
        />
      )}
    </div>
  );
}
