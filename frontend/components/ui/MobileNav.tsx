"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { NAV_GROUPS } from "@/lib/nav";

import { AuthMenu } from "./AuthMenu";

// Hamburger + slide-in drawer for small screens. Traps focus, closes on Esc /
// backdrop / navigation, and locks body scroll while open.
export function MobileNav({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    // Move focus into the panel.
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="rounded p-1.5 text-parchment/80 hover:text-waraq focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-waraq focus-visible:ring-offset-2 focus-visible:ring-offset-lapis"
      >
        <span aria-hidden="true" className="block text-xl leading-none">
          ☰
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            className="absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col overflow-y-auto bg-surface p-5 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-lg text-gold">Menu</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded p-1 text-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span aria-hidden="true" className="text-xl leading-none">
                  ×
                </span>
              </button>
            </div>

            <nav className="flex-1 space-y-5" aria-label="Mobile">
              {NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                    {group.label}
                  </p>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = item.href === pathname;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "block rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                              active
                                ? "bg-surface-2 font-medium text-fg"
                                : "text-fg hover:bg-surface-2",
                            )}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="mt-4 border-t border-border pt-4">
              <AuthMenu variant="surface" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
