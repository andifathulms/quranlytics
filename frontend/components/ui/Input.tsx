import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** "arabic" applies RTL direction + the Quran font for Arabic entry. */
  script?: "latin" | "arabic";
  label?: ReactNode;
  error?: string | null;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { script = "latin", label, error, className = "", id, ...props },
  ref,
) {
  const arabic = script === "arabic";
  const field = (
    <input
      ref={ref}
      id={id}
      dir={arabic ? "rtl" : props.dir}
      aria-invalid={error ? true : undefined}
      className={cn(
        "w-full rounded-lg border border-border bg-surface px-4 py-2 text-fg placeholder:text-muted",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        arabic && "text-xl font-quran",
        error && "border-danger",
        className,
      )}
      {...props}
    />
  );

  if (!label && !error) return field;

  return (
    <label className="block space-y-1">
      {label && <span className="text-sm font-medium text-fg">{label}</span>}
      {field}
      {error && <span className="block text-sm text-danger">{error}</span>}
    </label>
  );
});
