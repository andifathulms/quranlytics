"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ArabicKeyboard } from "@/components/analytics/ArabicKeyboard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const ARABIC = /[؀-ۿ]/;

// Resolve a query to a destination route.
function resolve(raw: string): string | null {
  const q = raw.trim();
  if (!q) return null;

  // "2:255" → surah:verse → open the surah (anchor to the verse).
  const verseMatch = q.match(/^(\d{1,3}):(\d{1,3})$/);
  if (verseMatch) return `/${verseMatch[1]}#${verseMatch[1]}-${verseMatch[2]}`;

  // Bare surah number.
  if (/^\d{1,3}$/.test(q)) {
    const n = Number(q);
    if (n >= 1 && n <= 114) return `/${n}`;
  }

  // Arabic text → word-frequency analyzer.
  if (ARABIC.test(q)) return `/analyze/word?word=${encodeURIComponent(q)}`;

  // Anything else → semantic (meaning-based) search.
  return `/semantic?q=${encodeURIComponent(q)}`;
}

export function GlobalSearch() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  // Global hotkeys: "/" or Cmd/Ctrl-K to open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQuery("");
  }, [open]);

  function submit() {
    const href = resolve(query);
    if (!href) return;
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search (press /)"
        className="flex items-center gap-2 rounded-md border border-parchment/20 px-2.5 py-1 text-sm text-parchment/70 hover:text-waraq focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-waraq focus-visible:ring-offset-2 focus-visible:ring-offset-lapis"
      >
        <span aria-hidden="true">⌕</span>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded bg-parchment/10 px-1 text-xs sm:inline">
          /
        </kbd>
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div className="relative w-full max-w-lg space-y-3 rounded-xl border border-border bg-surface p-4 shadow-xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                className="flex gap-2"
              >
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Surah number, Arabic word, or a concept…"
                  className="flex-1"
                />
                <Button type="submit">Go</Button>
              </form>
              <p className="text-xs text-muted">
                Try <span className="font-mono">2:255</span> for a verse,{" "}
                <span className="font-mono">رحمة</span> for word frequency, or
                “patience in hardship” for semantic search.
              </p>
              <ArabicKeyboard onInsert={(ch) => setQuery((q) => q + ch)} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
