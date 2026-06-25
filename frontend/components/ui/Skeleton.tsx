import { cn } from "@/lib/cn";

// Base shimmer block. Compose the shapes below or use directly.
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded bg-surface-2", className)}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-5",
        className,
      )}
      aria-hidden="true"
    >
      <Skeleton className="mb-3 h-5 w-1/3" />
      <SkeletonText lines={2} />
    </div>
  );
}

// Row of 114 cells mirroring the word-frequency heatmap footprint.
export function SkeletonHeatmap({ className = "" }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)} aria-hidden="true">
      {Array.from({ length: 114 }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-6" />
      ))}
    </div>
  );
}
