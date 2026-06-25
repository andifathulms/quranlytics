"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { NAV_GROUPS } from "@/lib/nav";
import type { NavGroup } from "@/lib/nav";

import { AuthMenu } from "./AuthMenu";
import { GlobalSearch } from "./GlobalSearch";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";

function isGroupActive(group: NavGroup, pathname: string): boolean {
  if (group.href !== "/" && pathname.startsWith(group.href)) return true;
  return group.items.some(
    (item) =>
      item.href === pathname ||
      (item.href !== "/" && pathname.startsWith(item.href)),
  );
}

function DesktopNav({ pathname }: { pathname: string }) {
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
      {NAV_GROUPS.map((group) => {
        const active = isGroupActive(group, pathname);
        // Single-item groups are plain links; multi-item groups get a dropdown.
        if (group.items.length === 1) {
          return (
            <Link
              key={group.label}
              href={group.items[0].href}
              className={cn(
                "rounded px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-waraq focus-visible:ring-offset-2 focus-visible:ring-offset-lapis",
                active ? "text-waraq" : "text-parchment/80 hover:text-waraq",
              )}
            >
              {group.label}
            </Link>
          );
        }
        return (
          <div key={group.label} className="group relative">
            <button
              className={cn(
                "rounded px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-waraq focus-visible:ring-offset-2 focus-visible:ring-offset-lapis",
                active ? "text-waraq" : "text-parchment/80 hover:text-waraq",
              )}
              aria-haspopup="true"
            >
              {group.label}
              <span aria-hidden="true" className="ml-1 text-[0.6rem]">
                ▾
              </span>
            </button>
            <div
              className="invisible absolute left-0 top-full z-40 min-w-[16rem] pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
            >
              <ul className="rounded-lg border border-border bg-surface p-2 shadow-lg">
                {group.items.map((item) => {
                  const itemActive = item.href === pathname;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "block rounded-md px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                          itemActive
                            ? "bg-surface-2"
                            : "hover:bg-surface-2",
                        )}
                      >
                        <span className="block text-sm font-medium text-fg">
                          {item.label}
                        </span>
                        <span className="block text-xs text-muted">
                          {item.description}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-sand bg-lapis text-parchment dark:border-khatulistiwa/40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="font-display text-xl text-waraq focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-waraq focus-visible:ring-offset-2 focus-visible:ring-offset-lapis"
        >
          Quranlytics
        </Link>

        <DesktopNav pathname={pathname} />

        <div className="flex items-center gap-3">
          <GlobalSearch />
          <ThemeToggle />
          <div className="hidden md:block">
            <AuthMenu />
          </div>
          <MobileNav pathname={pathname} />
        </div>
      </div>
    </header>
  );
}
