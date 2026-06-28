"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Cross-browser (incl. Safari/WebKit) element fullscreen. Returns a ref to put
// on the container, whether it's currently fullscreen, and a toggle. Used for
// the reader's distraction-free "immersive" mode.
type FsElement = HTMLDivElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

export function useFullscreen() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const supported =
    typeof document !== "undefined" &&
    (typeof document.documentElement.requestFullscreen === "function" ||
      typeof (document.documentElement as FsElement).webkitRequestFullscreen ===
        "function");

  useEffect(() => {
    const doc = document as FsDocument;
    const onChange = () => {
      const current = doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
      setActive(current === ref.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  const toggle = useCallback(() => {
    const doc = document as FsDocument;
    const el = ref.current as FsElement | null;
    if (!el) return;
    const current = doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
    if (current) {
      (doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(doc);
    } else {
      (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el);
    }
  }, []);

  return { ref, active, toggle, supported };
}
