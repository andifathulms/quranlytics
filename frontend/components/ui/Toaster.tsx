"use client";

import { cn } from "@/lib/cn";
import { useToast } from "@/lib/toast/ToastContext";
import type { ToastTone } from "@/lib/toast/ToastContext";

const toneStyles: Record<ToastTone, string> = {
  success: "border-positive/40 bg-positive/15 text-[#1e7e44] dark:text-positive",
  error: "border-danger/40 bg-danger/15 text-danger",
  info: "border-border bg-surface text-fg",
};

// Stacked, auto-dismissing notifications. Mounted once in providers.
export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={cn(
            "pointer-events-auto max-w-md rounded-lg border px-4 py-2 text-sm shadow-md transition-opacity",
            toneStyles[t.tone],
          )}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
