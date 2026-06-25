import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type CardVariant = "default" | "interactive" | "inset";

const cardVariants: Record<CardVariant, string> = {
  default: "shadow-sm",
  interactive:
    "shadow-sm transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-bg",
  inset: "bg-surface-2 shadow-none",
};

export function Card({
  children,
  className = "",
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-5 text-fg",
        cardVariants[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}

type BadgeTone = "gold" | "emerald" | "blue" | "neutral" | "danger" | "accent";

const badgeTones: Record<BadgeTone, string> = {
  gold: "bg-waraq/20 text-[#8a6d1f] dark:text-waraq",
  emerald: "bg-emerald/20 text-[#1e7e44] dark:text-emerald",
  blue: "bg-khatulistiwa/15 text-khatulistiwa dark:text-accent",
  neutral: "bg-surface-2 text-muted",
  danger: "bg-danger/15 text-danger",
  accent: "bg-accent/15 text-accent",
};

export function Badge({
  children,
  tone = "gold",
  size = "md",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-mono",
        size === "sm" ? "px-2 py-0.5 text-[0.65rem]" : "px-2.5 py-0.5 text-xs",
        badgeTones[tone],
      )}
    >
      {children}
    </span>
  );
}
