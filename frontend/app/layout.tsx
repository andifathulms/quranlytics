import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Header } from "@/components/ui/Header";
import { SkipLink } from "@/components/ui/SkipLink";

import { amiriQuran, inter, jetbrainsMono, playfair } from "./fonts";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quranlytics — Read. Understand patterns. Discover miracles.",
  description:
    "A Quran reader with a built-in analytical layer: word frequencies, root morphology, co-occurrence, and numerical pattern verification.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${amiriQuran.variable} ${playfair.variable} ${jetbrainsMono.variable} font-sans min-h-screen bg-bg text-fg transition-colors`}
      >
        <Providers>
          <SkipLink />
          <Header />
          <main id="main" className="mx-auto max-w-6xl px-4 py-8">
            <Breadcrumbs />
            {children}
          </main>
          <footer className="border-t border-sand py-6 text-center text-xs text-lapis/60 dark:border-khatulistiwa/40 dark:text-parchment/50">
            Quranic text rendered exactly as sourced · Read the Quran. Understand
            its patterns. Discover its miracles.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
