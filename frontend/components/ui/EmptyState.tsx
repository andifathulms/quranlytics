import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

// Friendly "nothing here" surface with optional icon + call to action.
export function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      {icon && <div className="mb-3 text-3xl text-muted">{icon}</div>}
      <h3 className="font-display text-lg text-fg">{title}</h3>
      {description && (
        <div className="mt-1 max-w-md text-sm text-muted">{description}</div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
