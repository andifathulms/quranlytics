"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { auth } from "@/lib/api/auth";
import type { Bookmark, Note, ReadingProgress, User } from "@/lib/api/types";

const TOKEN_KEY = "quranlytics.token";

interface AuthState {
  user: User | null;
  token: string | null;
  ready: boolean; // initial token/user load finished
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  // user data
  bookmarks: Map<number, Bookmark>; // verseId -> Bookmark
  notes: Map<number, Note>; // verseId -> Note
  toggleBookmark: (verseId: number) => Promise<void>;
  saveNote: (verseId: number, body: string) => Promise<void>;
  removeNote: (verseId: number) => Promise<void>;
  // reading progress
  progress: ReadingProgress | null;
  recordRead: (surah: number, verse: number) => void;
  setReadingGoal: (goal: number) => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [bookmarks, setBookmarks] = useState<Map<number, Bookmark>>(new Map());
  const [notes, setNotes] = useState<Map<number, Note>>(new Map());
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  // Debounce reading-position pings: keep only the latest while scrolling.
  const pendingPos = useRef<{ s: number; v: number } | null>(null);
  const pingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadUserData = useCallback(async (tok: string) => {
    const [bm, nt, pr] = await Promise.all([
      auth.listBookmarks(tok),
      auth.listNotes(tok),
      auth.getProgress(tok).catch(() => null),
    ]);
    setBookmarks(new Map(bm.map((b: Bookmark) => [b.verse, b])));
    setNotes(new Map(nt.map((n: Note) => [n.verse, n])));
    setProgress(pr);
  }, []);

  // Restore session from localStorage on mount.
  useEffect(() => {
    const tok = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (!tok) {
      setReady(true);
      return;
    }
    setToken(tok);
    auth
      .me(tok)
      .then((u) => {
        setUser(u);
        return loadUserData(tok);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setReady(true));
  }, [loadUserData]);

  const establish = useCallback(
    async (tok: string) => {
      localStorage.setItem(TOKEN_KEY, tok);
      setToken(tok);
      const u = await auth.me(tok);
      setUser(u);
      await loadUserData(tok);
    },
    [loadUserData],
  );

  const login = useCallback(
    async (username: string, password: string) => {
      const { access } = await auth.login(username, password);
      await establish(access);
    },
    [establish],
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      await auth.register(username, email, password);
      const { access } = await auth.login(username, password);
      await establish(access);
    },
    [establish],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setBookmarks(new Map());
    setNotes(new Map());
    setProgress(null);
  }, []);

  // Record a reading position: update the resume point optimistically, then
  // sync to the server (debounced) so scrolling doesn't spam the API.
  const recordRead = useCallback(
    (surah: number, verse: number) => {
      if (!token) return;
      pendingPos.current = { s: surah, v: verse };
      setProgress((p) =>
        p
          ? {
              ...p,
              last_surah: surah,
              last_verse: verse,
              last_verse_key: `${surah}:${verse}`,
            }
          : p,
      );
      if (pingTimer.current) clearTimeout(pingTimer.current);
      pingTimer.current = setTimeout(() => {
        const pos = pendingPos.current;
        if (pos) {
          auth
            .recordProgress(token, pos.s, pos.v)
            .then(setProgress)
            .catch(() => {});
        }
      }, 2500);
    },
    [token],
  );

  const setReadingGoal = useCallback(
    async (goal: number) => {
      if (!token) return;
      const updated = await auth.setProgressGoal(token, goal);
      setProgress(updated);
    },
    [token],
  );

  const toggleBookmark = useCallback(
    async (verseId: number) => {
      if (!token) return;
      const existing = bookmarks.get(verseId);
      if (existing) {
        await auth.deleteBookmark(token, existing.id);
        setBookmarks((m) => {
          const next = new Map(m);
          next.delete(verseId);
          return next;
        });
      } else {
        const created = await auth.createBookmark(token, verseId);
        setBookmarks((m) => new Map(m).set(verseId, created));
      }
    },
    [token, bookmarks],
  );

  const saveNote = useCallback(
    async (verseId: number, body: string) => {
      if (!token) return;
      const existing = notes.get(verseId);
      const saved = existing
        ? await auth.updateNote(token, existing.id, body)
        : await auth.createNote(token, verseId, body);
      setNotes((m) => new Map(m).set(verseId, saved));
    },
    [token, notes],
  );

  const removeNote = useCallback(
    async (verseId: number) => {
      if (!token) return;
      const existing = notes.get(verseId);
      if (!existing) return;
      await auth.deleteNote(token, existing.id);
      setNotes((m) => {
        const next = new Map(m);
        next.delete(verseId);
        return next;
      });
    },
    [token, notes],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      ready,
      login,
      register,
      logout,
      bookmarks,
      notes,
      toggleBookmark,
      saveNote,
      removeNote,
      progress,
      recordRead,
      setReadingGoal,
    }),
    [user, token, ready, login, register, logout, bookmarks, notes, toggleBookmark, saveNote, removeNote, progress, recordRead, setReadingGoal],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
