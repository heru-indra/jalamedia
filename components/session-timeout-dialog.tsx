"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";

// ── Ubah nilai ini sesuai kebutuhan ──────────────────────────────────────────
const IDLE_MS         = 15 * 60 * 1000;   // 15 menit idle → dialog muncul
const WARNING_SECONDS = 2  * 60;           // 2 menit countdown di dialog
// Untuk testing cepat, ubah ke:
//   const IDLE_MS         = 10 * 1000;   // 10 detik
//   const WARNING_SECONDS = 15;          // 15 detik
// ─────────────────────────────────────────────────────────────────────────────

const RING_R = 54;
const RING_C = 2 * Math.PI * RING_R;  // ~339.3

function pad(n: number) { return String(n).padStart(2, "0"); }
function fmtTime(s: number) {
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

export function SessionTimeoutDialog() {
  const [open,        setOpen]        = useState(false);
  const [countdown,   setCountdown]   = useState(WARNING_SECONDS);
  const [loggingOut,  setLoggingOut]  = useState(false);

  const tickRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const cntRef      = useRef(WARNING_SECONDS);

  // ── Countdown helpers ─────────────────────────────────────────────────────

  const stopTick = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  }, []);

  const startTick = useCallback(() => {
    stopTick();
    cntRef.current = WARNING_SECONDS;
    setCountdown(WARNING_SECONDS);
    tickRef.current = setInterval(() => {
      cntRef.current -= 1;
      setCountdown(cntRef.current);
      if (cntRef.current <= 0) stopTick();
    }, 1000);
  }, [stopTick]);

  // ── Idle hooks ────────────────────────────────────────────────────────────

  const onWarn = useCallback(() => {
    setOpen(true);
    startTick();
  }, [startTick]);

  const onExpire = useCallback(async () => {
    setLoggingOut(true);
    stopTick();
    // Dynamic import agar tidak crash di SSR
    const { authClient } = await import("@/lib/auth-client");
    await authClient.signOut();
    window.location.href = "/login?reason=timeout";
  }, [stopTick]);

  const onResume = useCallback(() => {
    setOpen(false);
    stopTick();
  }, [stopTick]);

  const { reset } = useIdleTimeout({
    idleMs:    IDLE_MS,
    warningMs: WARNING_SECONDS * 1000,
    onWarn,
    onExpire,
    onResume,
  });

  // ── Tetap masuk ───────────────────────────────────────────────────────────

  const handleStay = useCallback(() => {
    setOpen(false);
    stopTick();
    reset();
  }, [reset, stopTick]);

  // ── Keluar manual ─────────────────────────────────────────────────────────

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    stopTick();
    const { authClient } = await import("@/lib/auth-client");
    await authClient.signOut();
    window.location.href = "/login?reason=logout";
  }, [stopTick]);

  // ── Lock scroll ───────────────────────────────────────────────────────────

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ── Cleanup ───────────────────────────────────────────────────────────────

  useEffect(() => () => stopTick(), [stopTick]);

  // ── Ring visual ───────────────────────────────────────────────────────────

  const pct        = countdown / WARNING_SECONDS;
  const dashOffset = RING_C * (1 - pct);
  const ringColor  = countdown > 60 ? "#c9a060"
                   : countdown > 30 ? "#e09040"
                   :                  "#e05a5a";

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] bg-[rgba(0,0,0,0.8)] backdrop-blur-lg flex items-center justify-center p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Peringatan: sesi akan berakhir"
      >
        <div className="relative bg-[#111] border border-[#2a2a2a] rounded-2xl px-10 py-11 w-full max-w-sm text-center overflow-hidden shadow-2xl animate-fade-up">
          {/* Top border accent */}
          <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{
              background: `linear-gradient(to right, transparent, ${ringColor}, transparent)`,
            }}
          />

          {/* Ring countdown */}
          <div className={`relative w-32 h-32 mx-auto mb-7 ${countdown <= 30 ? "animate-pulse-dot" : ""}`}>
            <svg className="w-full h-full" viewBox="0 0 132 132" style={{ transform: "rotate(-90deg)" }} preserveAspectRatio="xMidYMid meet">
              <circle cx="66" cy="66" r={RING_R} fill="none" stroke="#1e1e1e" strokeWidth="6" />
              <circle
                cx="66" cy="66" r={RING_R}
                fill="none" stroke={ringColor} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={dashOffset}
                style={{
                  transition: "stroke-dashoffset 0.95s linear, stroke 0.5s ease",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
              <span className="font-serif text-4xl font-light leading-none" style={{ color: ringColor, letterSpacing: "-0.02em" }}>
                {fmtTime(countdown)}
              </span>
              <span className="text-xs text-[#444] tracking-widest uppercase">tersisa</span>
            </div>
          </div>

          {/* Copy */}
          <h2 className="font-serif text-3xl font-light text-[#f5f0e8] leading-tight mb-3">Sesi akan berakhir</h2>
          <p className="text-sm text-[#777] leading-relaxed tracking-tight mb-8">
            Tidak ada aktivitas selama <span className="text-[#aaa] font-semibold">{Math.round(IDLE_MS / 60000)} menit</span>.<br />
            Sesi otomatis berakhir dalam{" "}
            <span className="font-semibold" style={{ color: ringColor }}>{fmtTime(countdown)}</span>.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            <button
              className="w-full px-4 py-3.5 bg-[#d4b070] text-[#0a0a0a] rounded-lg text-xs font-mono tracking-widest uppercase font-semibold transition-colors hover:bg-[#e0bb80] disabled:bg-[#1e1e1e] disabled:text-[#444] disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
              onClick={handleStay}
              disabled={loggingOut}
              autoFocus
            >
              {loggingOut ? (
                <>
                  <span className="w-3 h-3 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
                  Mengakhiri...
                </>
              ) : (
                "✓  Ya, tetap masuk"
              )}
            </button>

            <button
              className="w-full px-4 py-3 bg-transparent border border-[#1e1e1e] rounded-lg text-xs font-mono text-[#777] tracking-widest uppercase transition-colors hover:border-[#e05a5a] hover:text-[#e05a5a] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <>
                  <span className="w-3 h-3 border-2 border-[#d4b070] border-t-transparent rounded-full animate-spin" />
                  Keluar...
                </>
              ) : (
                "Keluar sekarang"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
