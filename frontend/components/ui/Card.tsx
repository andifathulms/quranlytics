import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-sand bg-white/70 p-5 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "gold",
}: {
  children: ReactNode;
  tone?: "gold" | "emerald" | "blue";
}) {
  const tones = {
    gold: "bg-waraq/20 text-[#8a6d1f]",
    emerald: "bg-emerald/20 text-[#1e7e44]",
    blue: "bg-khatulistiwa/15 text-khatulistiwa",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
