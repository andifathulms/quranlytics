"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Badge, Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Note } from "@/lib/api/types";

export default function SavedPage() {
  const { user, ready, bookmarks, notes, toggleBookmark, removeNote, saveNote } =
    useAuth();
  const router = useRouter();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (ready && !user) router.replace("/account");
  }, [ready, user, router]);

  const query = q.trim().toLowerCase();
  const bookmarkList = useMemo(
    () =>
      Array.from(bookmarks.values()).filter(
        (b) => !query || b.verse_key.includes(query),
      ),
    [bookmarks, query],
  );
  const noteList = useMemo(
    () =>
      Array.from(notes.values()).filter(
        (n) =>
          !query ||
          n.verse_key.includes(query) ||
          n.body.toLowerCase().includes(query),
      ),
    [notes, query],
  );

  if (!ready || !user) {
    return <p className="text-muted">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Saved</h1>
          <p className="text-muted">Manage your bookmarks and notes.</p>
        </div>
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search verse key or note text…"
          aria-label="Search saved items"
          className="w-full sm:w-72"
        />
      </header>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl">
          Bookmarks <Badge tone="gold">{bookmarkList.length}</Badge>
        </h2>
        {bookmarkList.length === 0 ? (
          <p className="text-sm text-muted">No matching bookmarks.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {bookmarkList.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1 rounded-lg border border-sand px-2 py-1 text-sm"
              >
                <Link
                  href={`/${b.verse_key.split(":")[0]}`}
                  className="font-mono text-khatulistiwa hover:underline"
                >
                  {b.verse_key}
                </Link>
                <button
                  onClick={() => toggleBookmark(b.verse)}
                  aria-label={`Remove bookmark ${b.verse_key}`}
                  className="text-muted hover:text-danger"
                  title="Remove"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl">
          Notes <Badge tone="emerald">{noteList.length}</Badge>
        </h2>
        {noteList.length === 0 ? (
          <p className="text-sm text-muted">No matching notes.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {noteList.map((n) => (
              <NoteItem
                key={n.id}
                note={n}
                onSave={(body) => saveNote(n.verse, body)}
                onDelete={() => removeNote(n.verse)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function NoteItem({
  note,
  onSave,
  onDelete,
}: {
  note: Note;
  onSave: (body: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(note.body);
  const [busy, setBusy] = useState(false);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <Link
          href={`/${note.verse_key.split(":")[0]}`}
          className="font-mono text-xs text-khatulistiwa hover:underline"
        >
          {note.verse_key}
        </Link>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => {
              setBody(note.body);
              setEditing((e) => !e);
            }}
            className="text-muted hover:text-fg"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          <button
            onClick={onDelete}
            className="text-muted hover:text-danger"
          >
            Delete
          </button>
        </div>
      </div>
      {editing ? (
        <div className="mt-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="w-full rounded border border-sand bg-surface px-2 py-1 text-sm focus:border-khatulistiwa focus:outline-none"
          />
          <button
            disabled={busy || !body.trim()}
            onClick={async () => {
              setBusy(true);
              await onSave(body.trim());
              setBusy(false);
              setEditing(false);
            }}
            className="mt-1 rounded bg-khatulistiwa px-3 py-1 text-xs text-parchment disabled:opacity-50"
          >
            Save
          </button>
        </div>
      ) : (
        <p className="mt-1 whitespace-pre-wrap text-sm">{note.body}</p>
      )}
    </Card>
  );
}
