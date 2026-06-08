"use client";

import { useEffect, useRef } from "react";

const WATCHED_EVENTS = [
  "mousemove", "mousedown", "keydown",
  "touchstart", "scroll", "wheel", "click",
] as const;

export interface IdleTimeoutOptions {
  idleMs:    number;   // ms tidak aktif sebelum onWarn dipanggil
  warningMs: number;   // ms countdown setelah onWarn sebelum onExpire
  onWarn:    () => void;
  onExpire:  () => void;
  onResume?: () => void;
}

/**
 * Mendeteksi user idle tanpa dependency loop.
 * Semua config disimpan di ref → effect hanya jalan SEKALI saat mount.
 */
export function useIdleTimeout(opts: IdleTimeoutOptions) {
  // Simpan semua config ke ref agar tidak perlu re-subscribe
  const optsRef = useRef(opts);
  useEffect(() => { optsRef.current = opts; });   // update setiap render tanpa trigger effect

  const idleTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWarnedRef    = useRef(false);

  const resetRef = useRef<() => void>(() => {});

  useEffect(() => {
    // ── Fungsi internal ────────────────────────────────────────────────────

    function clearAll() {
      if (idleTimerRef.current)   { clearTimeout(idleTimerRef.current);   idleTimerRef.current   = null; }
      if (expireTimerRef.current) { clearTimeout(expireTimerRef.current); expireTimerRef.current = null; }
    }

    function scheduleIdleTimer() {
      clearAll();
      idleTimerRef.current = setTimeout(() => {
        isWarnedRef.current = true;
        optsRef.current.onWarn();

        expireTimerRef.current = setTimeout(() => {
          optsRef.current.onExpire();
        }, optsRef.current.warningMs);

      }, optsRef.current.idleMs);
    }

    // Expose reset ke luar via ref
    resetRef.current = () => {
      isWarnedRef.current = false;
      scheduleIdleTimer();
    };

    // ── Activity handler ───────────────────────────────────────────────────

    let lastFired = 0;

    function handleActivity() {
      const now = Date.now();
      if (now - lastFired < 400) return;   // throttle 400ms
      lastFired = now;

      if (isWarnedRef.current) {
        // User gerak saat dialog terbuka → resume
        isWarnedRef.current = false;
        optsRef.current.onResume?.();
      }

      scheduleIdleTimer();
    }

    // ── Mount ──────────────────────────────────────────────────────────────

    scheduleIdleTimer();

    const addOpts = { passive: true, capture: true } as AddEventListenerOptions;
    WATCHED_EVENTS.forEach((ev) => window.addEventListener(ev, handleActivity, addOpts));

    return () => {
      clearAll();
      WATCHED_EVENTS.forEach((ev) =>
        window.removeEventListener(ev, handleActivity, { capture: true } as EventListenerOptions)
      );
    };
  }, []); // ← KOSONG — hanya jalan sekali, tidak ada dependency loop

  return {
    reset: () => resetRef.current(),
  };
}
