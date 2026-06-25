import Link from "next/link";
import type { ReactNode } from "react";

export interface ToolExample {
  label: string;
  /** Where the chip jumps to — usually the same tool with prefilled params. */
  href: string;
}

// Shared page heading for the analysis/explore tools: title, one-line
// description, and optional "try an example" chips that deep-link with
// prefilled query params.
export function ToolIntro({
  title,
  description,
  examples,
}: {
  title: string;
  description: ReactNode;
  examples?: ToolExample[];
}) {
  return (
    <header className="space-y-3">
      <div>
        <h1 className="font-display text-3xl text-fg">{title}</h1>
        <p className="mt-1 max-w-2xl text-muted">{description}</p>
      </div>
      {examples && examples.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted">
            Try
          </span>
          {examples.map((ex) => (
            <Link
              key={ex.href}
              href={ex.href}
              className="rounded-full border border-border px-3 py-1 text-sm text-fg hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              {ex.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
