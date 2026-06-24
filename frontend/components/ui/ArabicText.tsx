// Canonical wrapper for Quranic Arabic text.
// Per CLAUDE.md: Arabic is NEVER rendered in a generic <p>. It always carries
// the Quran font + dir="rtl", and is never truncated, translated, or altered.
import type { ReactNode } from "react";

export function ArabicText({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span dir="rtl" lang="ar" className={`font-quran ${className}`}>
      {children}
    </span>
  );
}
