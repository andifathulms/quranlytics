import { RootExplorer } from "@/components/analytics/RootExplorer";

export const metadata = { title: "Root Explorer · Quranlytics" };

export default function RootAnalyzePage({
  searchParams,
}: {
  searchParams: { root?: string };
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl">Root Explorer</h1>
        <p className="text-lapis/60">
          Enter a trilateral root (e.g. كتب) to see every derived word, its
          forms, and frequency.
        </p>
      </header>
      <RootExplorer initialRoot={searchParams.root ?? ""} />
    </div>
  );
}
