"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ScoredVerseList } from "@/components/semantic/ScoredVerseList";
import { api, ApiError } from "@/lib/api/client";
import type { ScoredVerse, Tafsir, Verse } from "@/lib/api/types";
import { verseAudioUrl } from "@/lib/audio";
import { useAuth } from "@/lib/auth/AuthContext";

type Panel = "none" | "note" | "tafsir" | "related";

export function VerseToolbar({ verse }: { verse: Verse }) {
  const { user, bookmarks, notes, toggleBookmark, saveNote, removeNote } = useAuth();
  const [panel, setPanel] = useState<Panel>("none");
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const bookmarked = bookmarks.has(verse.id);
  const note = notes.get(verse.id);

  function toggleAudio() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      void el.play();
    }
  }

  const btn =
    "rounded px-2 py-1 text-xs text-lapis/60 hover:bg-waraq/20 hover:text-lapis dark:text-parchment/60 dark:hover:text-parchment";

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-1">
        {/* Bookmark */}
        {user ? (
          <button
            onClick={() => toggleBookmark(verse.id)}
            className={btn}
            aria-pressed={bookmarked}
            title={bookmarked ? "Remove bookmark" : "Bookmark"}
          >
            {bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
          </button>
        ) : (
          <Link href="/account" className={btn} title="Sign in to bookmark">
            ☆ Bookmark
          </Link>
        )}

        {/* Audio */}
        <button onClick={toggleAudio} className={btn} title="Play recitation">
          {playing ? "❚❚ Pause" : "▶ Listen"}
        </button>

        {/* Note */}
        {user ? (
          <button
            onClick={() => setPanel((p) => (p === "note" ? "none" : "note"))}
            className={btn}
            title="Note"
          >
            {note ? "✎ Note" : "✎ Add note"}
          </button>
        ) : (
          <Link href="/account" className={btn} title="Sign in to take notes">
            ✎ Add note
          </Link>
        )}

        {/* Tafsir */}
        <button
          onClick={() => setPanel((p) => (p === "tafsir" ? "none" : "tafsir"))}
          className={btn}
          title="Tafsir (Ibn Kathir)"
        >
          📖 Tafsir
        </button>

        {/* Related verses (semantic cross-reference) */}
        <button
          onClick={() => setPanel((p) => (p === "related" ? "none" : "related"))}
          className={btn}
          title="Semantically related verses"
        >
          🔗 Related
        </button>

        <audio
          ref={audioRef}
          src={verseAudioUrl(verse.surah_number, verse.number)}
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      </div>

      {panel === "note" && user && (
        <NoteEditor
          initial={note?.body ?? ""}
          hasNote={Boolean(note)}
          onSave={(body) => saveNote(verse.id, body)}
          onDelete={() => removeNote(verse.id)}
          onClose={() => setPanel("none")}
        />
      )}

      {panel === "tafsir" && <TafsirPanel verseKey={verse.verse_key} />}

      {panel === "related" && <RelatedPanel verseId={verse.id} />}
    </div>
  );
}

function RelatedPanel({ verseId }: { verseId: number }) {
  const [verses, setVerses] = useState<ScoredVerse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .crossReferences(verseId, 8)
      .then((res) => active && setVerses(res.data.verses))
      .catch(
        (e) =>
          active &&
          setError(e instanceof ApiError ? e.message : "Failed to load related verses"),
      );
    return () => {
      active = false;
    };
  }, [verseId]);

  return (
    <div className="mt-2 rounded-lg border border-sand bg-white/70 p-4 dark:bg-lapis/40">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-lapis/50 dark:text-parchment/50">
        Semantically related verses
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!verses && !error && (
        <p className="text-sm text-lapis/50 dark:text-parchment/50">Loading…</p>
      )}
      {verses && verses.length === 0 && (
        <p className="text-sm text-lapis/50 dark:text-parchment/50">
          No related verses (embeddings may not be built yet).
        </p>
      )}
      {verses && verses.length > 0 && <ScoredVerseList verses={verses} />}
    </div>
  );
}

function NoteEditor({
  initial,
  hasNote,
  onSave,
  onDelete,
  onClose,
}: {
  initial: string;
  hasNote: boolean;
  onSave: (body: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}) {
  const [body, setBody] = useState(initial);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mt-2 rounded-lg border border-sand bg-white/70 p-3 dark:bg-lapis/40">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Your note on this verse…"
        className="w-full rounded border border-sand bg-white px-2 py-1 text-sm text-lapis focus:border-khatulistiwa focus:outline-none"
      />
      <div className="mt-2 flex gap-2 text-xs">
        <button
          disabled={busy || !body.trim()}
          onClick={async () => {
            setBusy(true);
            await onSave(body.trim());
            setBusy(false);
            onClose();
          }}
          className="rounded bg-khatulistiwa px-3 py-1 text-parchment disabled:opacity-50"
        >
          Save
        </button>
        {hasNote && (
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await onDelete();
              setBusy(false);
              onClose();
            }}
            className="rounded border border-red-300 px-3 py-1 text-red-600"
          >
            Delete
          </button>
        )}
        <button onClick={onClose} className="px-2 py-1 text-lapis/50">
          Cancel
        </button>
      </div>
    </div>
  );
}

function TafsirPanel({ verseKey }: { verseKey: string }) {
  const [tafsir, setTafsir] = useState<Tafsir | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .tafsir(verseKey, "en")
      .then((res) => active && setTafsir(res.data))
      .catch(
        (e) =>
          active &&
          setError(e instanceof ApiError ? e.message : "Failed to load tafsir"),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [verseKey]);

  return (
    <div className="mt-2 rounded-lg border border-sand bg-white/70 p-4 dark:bg-lapis/40">
      {loading && <p className="text-sm text-lapis/50">Loading tafsir…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {tafsir && (
        <>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-lapis/50 dark:text-parchment/50">
            {tafsir.resource_name}
          </div>
          <div
            className="tafsir-body max-h-96 overflow-y-auto text-sm leading-relaxed text-lapis/90 dark:text-parchment/80"
            dangerouslySetInnerHTML={{ __html: tafsir.text }}
          />
        </>
      )}
    </div>
  );
}
