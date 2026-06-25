"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_LABELS } from "@/lib/nav";

interface Crumb {
  href: string;
  label: string;
}

// Humanize an unknown path segment (e.g. "at-tawbah" -> "At Tawbah").
function humanize(segment: string): string {
  const decoded = decodeURIComponent(segment);
  return decoded
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  let href = "";
  for (const segment of segments) {
    href += `/${segment}`;
    crumbs.push({ href, label: NAV_LABELS[href] ?? humanize(segment) });
  }
  return crumbs;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  // Home needs no trail.
  if (pathname === "/") return null;

  const crumbs = buildCrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/" className="hover:text-fg hover:underline">
            Home
          </Link>
        </li>
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1">
              <span aria-hidden="true">/</span>
              {last ? (
                <span className="font-medium text-fg" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-fg hover:underline"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
