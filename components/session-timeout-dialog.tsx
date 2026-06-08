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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Mono:wght@300;400&display=swap');

        .sto-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          font-family: 'DM Mono', monospace;
          animation: stoFade .2s ease;
        }
        @keyframes stoFade { from { opacity: 0 } to { opacity: 1 } }

        .sto-card {
          background: #111;
          border: 1px solid #252525;
          border-radius: 16px;
          padding: 44px 40px 36px;
          width: 100%; max-width: 400px;
          text-align: center;
          position: relative; overflow: hidden;
          box-shadow: 0 40px 100px rgba(0,0,0,0.75);
          animation: stoUp .28s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes stoUp {
          from { opacity: 0; transform: translateY(20px) scale(.96) }
          to   { opacity: 1; transform: translateY(0)    scale(1)   }
        }
        .sto-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(to right, transparent, var(--ring, #c9a060), transparent);
        }

        .sto-ring-wrap {
          position: relative; width: 132px; height: 132px;
          margin: 0 auto 28px;
        }
        .sto-ring-wrap.pulse { animation: stoPulse 1.1s ease infinite; }
        @keyframes stoPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }

        .sto-ring-svg {
          width: 132px; height: 132px;
          transform: rotate(-90deg); display: block;
        }
        .sto-ring-bar {
          fill: none; stroke-width: 6; stroke-linecap: round;
          transition: stroke-dashoffset .95s linear, stroke .5s ease;
        }

        .sto-ring-center {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 3px;
        }
        .sto-ring-time {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px; font-weight: 300; line-height: 1;
          letter-spacing: -0.02em; transition: color .5s;
        }
        .sto-ring-sub {
          font-size: 9px; color: #3a3a3a;
          letter-spacing: 0.16em; text-transform: uppercase;
        }

        .sto-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-weight: 300;
          color: #f0e8d8; line-height: 1.2; margin-bottom: 12px;
        }
        .sto-desc {
          font-size: 13px; color: #555;
          line-height: 1.8; letter-spacing: 0.03em; margin-bottom: 32px;
        }
        .sto-desc b { color: #888; font-weight: 400; }

        .sto-btns { display: flex; flex-direction: column; gap: 10px; }

        .sto-btn-stay {
          width: 100%; padding: 15px;
          background: #c9a060; border: none; border-radius: 8px;
          color: #0d0d0d; font-family: 'DM Mono', monospace;
          font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 9px;
          transition: background .15s, transform .1s;
        }
        .sto-btn-stay:hover:not(:disabled) { background: #d4b070; }
        .sto-btn-stay:active:not(:disabled) { transform: scale(.98); }
        .sto-btn-stay:disabled { background: #1e1e1e; color: #333; cursor: not-allowed; }

        .sto-btn-logout {
          width: 100%; padding: 13px;
          background: transparent; border: 1px solid #1e1e1e; border-radius: 8px;
          color: #3a3a3a; font-family: 'DM Mono', monospace;
          font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 9px;
          transition: border-color .15s, color .15s;
        }
        .sto-btn-logout:hover:not(:disabled) { border-color: #e05a5a; color: #e05a5a; }
        .sto-btn-logout:disabled { opacity: 0.35; cursor: not-allowed; }

        .sto-spinner {
          width: 14px; height: 14px; border-radius: 50%;
          flex-shrink: 0; animation: stoSpin .65s linear infinite;
          border: 2px solid transparent;
        }
        .sto-spinner.dk { border-top-color: #0d0d0d; border-right-color: rgba(0,0,0,.15); }
        .sto-spinner.lt { border-top-color: #c9a060; border-right-color: rgba(201,160,96,.15); }
        @keyframes stoSpin { to { transform: rotate(360deg) } }
      `}</style>

      <div
        className="sto-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Peringatan: sesi akan berakhir"
        style={{ "--ring": ringColor } as React.CSSProperties}
      >
        <div className="sto-card">
          {/* ── Ring countdown ── */}
          <div className={`sto-ring-wrap ${countdown <= 30 ? "pulse" : ""}`}>
            <svg className="sto-ring-svg" viewBox="0 0 132 132">
              <circle cx="66" cy="66" r={RING_R} fill="none" stroke="#1e1e1e" strokeWidth="6" />
              <circle
                cx="66" cy="66" r={RING_R}
                className="sto-ring-bar"
                stroke={ringColor}
                strokeDasharray={RING_C}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="sto-ring-center">
              <span className="sto-ring-time" style={{ color: ringColor }}>
                {fmtTime(countdown)}
              </span>
              <span className="sto-ring-sub">tersisa</span>
            </div>
          </div>

          {/* ── Copy ── */}
          <h2 className="sto-title">Sesi akan berakhir</h2>
          <p className="sto-desc">
            Tidak ada aktivitas selama <b>{Math.round(IDLE_MS / 60000)} menit</b>.<br />
            Sesi otomatis berakhir dalam{" "}
            <b style={{ color: ringColor }}>{fmtTime(countdown)}</b>.
          </p>

          {/* ── Actions ── */}
          <div className="sto-btns">
            <button
              className="sto-btn-stay"
              onClick={handleStay}
              disabled={loggingOut}
              autoFocus
            >
              {loggingOut
                ? <><span className="sto-spinner dk" />Mengakhiri...</>
                : "✓  Ya, tetap masuk"
              }
            </button>

            <button
              className="sto-btn-logout"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut
                ? <><span className="sto-spinner lt" />Keluar...</>
                : "Keluar sekarang"
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
