import { RootExplorer } from "@/components/analytics/RootExplorer";
import { ToolIntro } from "@/components/ui/ToolIntro";

export const metadata = { title: "Root Explorer · Quranlytics" };

export default function RootAnalyzePage({
  searchParams,
}: {
  searchParams: { root?: string };
}) {
  return (
    <div className="space-y-6">
      <ToolIntro
        title="Root Explorer"
        description="Enter a trilateral root (e.g. كتب) to see every derived word, its forms, and frequency."
        examples={[
          { label: "كتب", href: "/analyze/root?root=كتب" },
          { label: "علم", href: "/analyze/root?root=علم" },
          { label: "رحم", href: "/analyze/root?root=رحم" },
        ]}
      />
      <RootExplorer initialRoot={searchParams.root ?? ""} />
    </div>
  );
}
