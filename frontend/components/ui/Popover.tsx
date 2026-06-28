"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";

const MOBILE_QUERY = "(max-width: 639px)";
const MARGIN = 8; // viewport gap kept around the floating panel

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  /** Element the popover is positioned against on >= sm screens. */
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  label?: string;
  /** Desktop panel width in px (clamped to viewport). */
  width?: number;
}

// Portal-based popover with viewport-edge collision handling. On small screens
// it becomes a bottom sheet so content never spills off-screen. Closes on Esc,
// backdrop click, and outside click; traps initial focus.
export function Popover({
  open,
  onClose,
  anchorRef,
  children,
  label,
  width = 256,
}: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => setMounted(true), []);

  // Track viewport size for the sheet/popover switch.
  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [mounted]);

  // Position against the anchor (desktop only), clamped + flipped to stay on-screen.
  useLayoutEffect(() => {
    if (!open || isMobile) return;
    function place() {
      const anchor = anchorRef.current?.getBoundingClientRect();
      if (!anchor) return;
      const panelW = Math.min(width, window.innerWidth - MARGIN * 2);
      const panelH = panelRef.current?.offsetHeight ?? 0;

      let left = anchor.left + anchor.width / 2 - panelW / 2;
      left = Math.max(MARGIN, Math.min(left, window.innerWidth - panelW - MARGIN));

      // Prefer below the anchor; flip above if it would overflow the bottom.
      let top = anchor.bottom + MARGIN;
      if (panelH && top + panelH > window.innerHeight - MARGIN) {
        const above = anchor.top - MARGIN - panelH;
        if (above >= MARGIN) top = above;
      }
      setPos({ top, left });
    }
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, isMobile, anchorRef, width]);

  // Esc to close + move focus into the panel.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  // When a reader is in fullscreen ("immersive") mode, only that element's
  // subtree is rendered — a portal to document.body would be invisible. Render
  // into the current fullscreen element instead, when there is one.
  const fsDoc = document as Document & { webkitFullscreenElement?: Element | null };
  const portalTarget =
    fsDoc.fullscreenElement ?? fsDoc.webkitFullscreenElement ?? document.body;

  const panel = (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal={isMobile ? true : undefined}
      aria-label={label}
      className={cn(
        "border border-border bg-surface text-fg shadow-lg",
        isMobile
          ? "fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl p-4"
          : "fixed z-50 rounded-lg p-3",
      )}
      style={
        isMobile
          ? undefined
          : {
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              width: Math.min(width, typeof window !== "undefined" ? window.innerWidth - MARGIN * 2 : width),
              visibility: pos ? "visible" : "hidden",
            }
      }
    >
      {isMobile && (
        <div
          aria-hidden="true"
          className="mx-auto mb-3 h-1 w-10 rounded-full bg-border"
        />
      )}
      {children}
    </div>
  );

  return createPortal(
    <>
      {/* Backdrop: dimmed on mobile, transparent click-catcher on desktop. */}
      <div
        className={cn(
          "fixed inset-0 z-40",
          isMobile && "bg-black/40",
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      {panel}
    </>,
    portalTarget,
  );
}
