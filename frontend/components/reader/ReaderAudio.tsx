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

import type { Verse } from "@/lib/api/types";
import { DEFAULT_RECITER, reciterById, verseAudioUrl } from "@/lib/audio";
import { useReaderSettings } from "@/lib/reader/ReaderSettings";

const STORAGE_KEY = "quranlytics:reciter";

interface ReaderAudioApi {
  reciterId: string;
  setReciterId: (id: string) => void;
  currentId: number | null;
  playing: boolean;
  toggle: (verseId: number) => void; // play/pause a verse (continuous from there)
  playSurah: () => void;
  pause: () => void;
  // Memorization (ḥifẓ) controls.
  repeat: number; // times to play each verse before advancing (Infinity = loop)
  setRepeat: (n: number) => void;
  loopSurah: boolean; // restart from the first verse after the last
  setLoopSurah: (on: boolean) => void;
}

const Ctx = createContext<ReaderAudioApi | null>(null);

export function useReaderAudio(): ReaderAudioApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useReaderAudio outside ReaderAudioProvider");
  return ctx;
}

// Owns a single <audio> element and drives continuous, verse-by-verse playback
// for the surah: play one verse, auto-advance to the next on end, with a
// reciter that's remembered across sessions.
export function ReaderAudioProvider({
  verses,
  children,
}: {
  verses: Verse[];
  children: React.ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { playbackRate } = useReaderSettings();
  const rateRef = useRef(playbackRate);
  rateRef.current = playbackRate;
  const [reciterId, setReciterIdState] = useState(DEFAULT_RECITER.id);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [repeat, setRepeat] = useState(1);
  const [loopSurah, setLoopSurah] = useState(false);
  const playsRef = useRef(0); // plays of the current verse so far
  // Keep the latest repeat/loop visible to the (stable) onEnded handler.
  const repeatRef = useRef(repeat);
  repeatRef.current = repeat;
  const loopRef = useRef(loopSurah);
  loopRef.current = loopSurah;

  const order = useMemo(() => verses.map((v) => v.id), [verses]);
  const byId = useMemo(() => {
    const m = new Map<number, Verse>();
    for (const v of verses) m.set(v.id, v);
    return m;
  }, [verses]);

  useEffect(() => {
    const saved =
      typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY);
    if (saved) setReciterIdState(saved);
  }, []);

  // Apply speed changes live to the currently-playing recitation.
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  const folder = reciterById(reciterId).folder;

  const start = useCallback(
    (id: number) => {
      const v = byId.get(id);
      const el = audioRef.current;
      if (!v || !el) return;
      el.src = verseAudioUrl(v.surah_number, v.number, folder);
      el.playbackRate = rateRef.current;
      playsRef.current = 1;
      setCurrentId(id);
      void el.play();
    },
    [byId, folder],
  );

  const toggle = useCallback(
    (id: number) => {
      const el = audioRef.current;
      if (!el) return;
      if (currentId === id) {
        if (playing) el.pause();
        else void el.play();
        return;
      }
      start(id);
    },
    [currentId, playing, start],
  );

  const playSurah = useCallback(() => {
    if (order.length) start(order[0]);
  }, [order, start]);

  const pause = useCallback(() => audioRef.current?.pause(), []);

  const setReciterId = useCallback(
    (id: string) => {
      setReciterIdState(id);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, id);
      }
      // Re-point the current verse at the new reciter, preserving play state.
      const v = currentId != null ? byId.get(currentId) : null;
      const el = audioRef.current;
      if (v && el) {
        const wasPlaying = !el.paused;
        el.src = verseAudioUrl(v.surah_number, v.number, reciterById(id).folder);
        if (wasPlaying) void el.play();
      }
    },
    [byId, currentId],
  );

  function onEnded() {
    // Ḥifẓ: replay the same verse until it's been heard `repeat` times.
    if (playsRef.current < repeatRef.current) {
      playsRef.current += 1;
      const el = audioRef.current;
      if (el) {
        el.currentTime = 0;
        void el.play();
      }
      return;
    }
    const idx = currentId != null ? order.indexOf(currentId) : -1;
    let next = idx >= 0 ? order[idx + 1] : undefined;
    if (next == null && loopRef.current && order.length) next = order[0];
    if (next != null) start(next);
    else setPlaying(false);
  }

  const api: ReaderAudioApi = {
    reciterId,
    setReciterId,
    currentId,
    playing,
    toggle,
    playSurah,
    pause,
    repeat,
    setRepeat,
    loopSurah,
    setLoopSurah,
  };

  return (
    <Ctx.Provider value={api}>
      {children}
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={onEnded}
      />
    </Ctx.Provider>
  );
}
