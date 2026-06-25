import { cn } from "@/lib/cn";

import { Button } from "./Button";

// Standard error surface. Replaces the ad-hoc red banner duplicated across tools.
export function ErrorBanner({
  message,
  onRetry,
  className = "",
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger",
        className,
      )}
    >
      <span>{message}</span>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
