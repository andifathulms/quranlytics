import type { Metadata } from "next";
import Link from "next/link";

import { AuthMenu } from "@/components/ui/AuthMenu";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

import { amiriQuran, inter, jetbrainsMono, playfair } from "./fonts";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quranlytics — Read. Understand patterns. Discover miracles.",
  description:
    "A Quran reader with a built-in analytical layer: word frequencies, root morphology, co-occurrence, and numerical pattern verification.",
};

const NAV = [
  { href: "/", label: "Reader" },
  { href: "/analyze/word", label: "Word Frequency" },
  { href: "/analyze/root", label: "Root Explorer" },
  { href: "/analyze/cooccurrence", label: "Co-occurrence" },
  { href: "/analyze/rare", label: "Rare Words" },
  { href: "/analyze/structure", label: "Structure" },
  { href: "/analyze/stats", label: "Statistics" },
  { href: "/semantic", label: "Semantic" },
  { href: "/themes", label: "Themes" },
  { href: "/explore", label: "Explore" },
  { href: "/discoveries", label: "Discoveries" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${amiriQuran.variable} ${playfair.variable} ${jetbrainsMono.variable} font-sans min-h-screen bg-parchment text-lapis transition-colors dark:bg-lapis dark:text-parchment`}
      >
        <Providers>
          <header className="border-b border-sand bg-lapis text-parchment dark:border-khatulistiwa/40">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
              <Link href="/" className="font-display text-xl text-waraq">
                Quranlytics
              </Link>
              <nav className="flex flex-wrap gap-4 text-sm">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-parchment/80 transition-colors hover:text-waraq"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <AuthMenu />
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="border-t border-sand py-6 text-center text-xs text-lapis/60 dark:border-khatulistiwa/40 dark:text-parchment/50">
            Quranic text rendered exactly as sourced · Read the Quran. Understand
            its patterns. Discover its miracles.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
