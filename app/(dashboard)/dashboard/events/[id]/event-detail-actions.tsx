"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishEvent, unpublishEvent, deleteEvent } from "@/actions/event";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconGlobe() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <circle cx="6.5" cy="6.5" r="5" />
      <path d="M1.5 6.5h10M6.5 1.5c-1.5 1.5-2 3-2 5s.5 3.5 2 5M6.5 1.5c1.5 1.5 2 3 2 5s-.5 3.5-2 5" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M1.5 1.5l10 10M5.3 5.4a2 2 0 0 0 2.3 2.3M3 3.5C1.8 4.5 1 5.8 1 6.5c0 1 2 4 5.5 4a6 6 0 0 0 2.5-.6M5 2.6A6 6 0 0 1 6.5 2.5C10 2.5 12 5.5 12 6.5c0 .7-.5 1.7-1.3 2.5" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <polyline points="2 3.5 11 3.5" />
      <path d="M4.5 3.5V2.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1" />
      <path d="M3 3.5l.7 7a1 1 0 0 0 1 .9h3.6a1 1 0 0 0 1-.9l.7-7" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6.5" cy="6.5" r="5" strokeOpacity="0.25" />
      <path d="M6.5 1.5A5 5 0 0 1 11.5 6.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Delete confirmation ───────────────────────────────────────────────────────

function DeleteDialog({
  onConfirm,
  onCancel,
  isPending,
}: {
  onConfirm: () => void;
  onCancel:  () => void;
  isPending: boolean;
}) {
  return (
    <>
      <style>{`
        .dda-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(4px);
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: ddaFade 0.15s ease;
        }
        .dda-dialog {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 8px;
          padding: 30px;
          width: 100%;
          max-width: 360px;
          animation: ddaSlide 0.2s ease;
        }
        .dda-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 300;
          color: #e8e0d0;
          margin-bottom: 8px;
        }
        .dda-desc {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #444;
          letter-spacing: 0.06em;
          line-height: 1.7;
          margin-bottom: 24px;
        }
        .dda-row { display: flex; gap: 10px; }
        .dda-cancel {
          flex: 1; padding: 11px;
          background: transparent;
          border: 1px solid #1e1e1e; border-radius: 4px;
          color: #444; font-family: 'DM Mono', monospace;
          font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
          cursor: pointer; transition: border-color .15s, color .15s;
        }
        .dda-cancel:hover { border-color: #333; color: #888; }
        .dda-cancel:disabled { opacity: 0.4; cursor: not-allowed; }
        .dda-confirm {
          flex: 1; padding: 11px;
          background: rgba(139,32,32,0.15);
          border: 1px solid rgba(139,32,32,0.3); border-radius: 4px;
          color: #c0605a; font-family: 'DM Mono', monospace;
          font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          transition: background .15s;
        }
        .dda-confirm:hover:not(:disabled) { background: rgba(139,32,32,0.28); }
        .dda-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
        .dda-spin { animation: ddaSpin .6s linear infinite; display: inline-flex; }
        @keyframes ddaFade  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ddaSlide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ddaSpin  { to { transform: rotate(360deg); } }
      `}</style>
      <div className="dda-overlay" onClick={onCancel}>
        <div className="dda-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="dda-title">Hapus event ini?</div>
          <div className="dda-desc">
            Semua data event akan dihapus secara permanen<br />
            dan tidak dapat dipulihkan.
          </div>
          <div className="dda-row">
            <button className="dda-cancel" onClick={onCancel} disabled={isPending}>
              Batal
            </button>
            <button className="dda-confirm" onClick={onConfirm} disabled={isPending}>
              {isPending
                ? <span className="dda-spin"><IconSpinner /></span>
                : <IconTrash />
              }
              {isPending ? "Menghapus..." : "Hapus permanen"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface EventDetailActionsProps {
  eventId:    string;
  status:     string;
  canPublish: boolean;
}

export function EventDetailActions({ eventId, status, canPublish }: EventDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDelete, setShowDelete]  = useState(false);
  const [actionType, setActionType]  = useState<"publish" | "delete" | null>(null);

  function handlePublish() {
    setActionType("publish");
    startTransition(async () => {
      const res = await publishEvent(eventId);
      if (!res.success) alert(res.error);
      setActionType(null);
      router.refresh();
    });
  }

  function handleUnpublish() {
    setActionType("publish");
    startTransition(async () => {
      const res = await unpublishEvent(eventId);
      if (!res.success) alert(res.error);
      setActionType(null);
      router.refresh();
    });
  }

  function handleDelete() {
    setActionType("delete");
    startTransition(async () => {
      const res = await deleteEvent(eventId);
      if (!res.success) {
        alert(res.error);
        setActionType(null);
        setShowDelete(false);
        return;
      }
      router.push("/dashboard/events");
    });
  }

  const isLoading = isPending;

  return (
    <>
      <style>{`
        .dea-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .dea-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 14px;
          border-radius: 4px;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid transparent;
        }
        .dea-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .dea-btn-publish {
          background: rgba(90,136,48,0.1);
          border-color: rgba(90,136,48,0.3);
          color: #5a8830;
        }
        .dea-btn-publish:hover:not(:disabled) {
          background: rgba(90,136,48,0.18);
          border-color: rgba(90,136,48,0.5);
        }

        .dea-btn-unpublish {
          background: rgba(180,140,80,0.08);
          border-color: rgba(180,140,80,0.25);
          color: #b48c50;
        }
        .dea-btn-unpublish:hover:not(:disabled) {
          background: rgba(180,140,80,0.15);
          border-color: rgba(180,140,80,0.4);
        }

        .dea-btn-delete {
          background: transparent;
          border-color: #1a1a1a;
          color: #333;
        }
        .dea-btn-delete:hover:not(:disabled) {
          background: rgba(180,50,50,0.08);
          border-color: rgba(180,50,50,0.3);
          color: #c0605a;
        }

        .dea-spin { animation: deaSpin .6s linear infinite; display: inline-flex; }
        @keyframes deaSpin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="dea-wrap">
        {/* Publish / Unpublish */}
        {canPublish && (
          status === "published" ? (
            <button
              className="dea-btn dea-btn-unpublish"
              onClick={handleUnpublish}
              disabled={isLoading}
            >
              {isLoading && actionType === "publish"
                ? <span className="dea-spin"><IconSpinner /></span>
                : <IconEyeOff />
              }
              Kembalikan ke Draft
            </button>
          ) : (
            <button
              className="dea-btn dea-btn-publish"
              onClick={handlePublish}
              disabled={isLoading}
            >
              {isLoading && actionType === "publish"
                ? <span className="dea-spin"><IconSpinner /></span>
                : <IconGlobe />
              }
              Publikasikan
            </button>
          )
        )}

        {/* Delete */}
        <button
          className="dea-btn dea-btn-delete"
          onClick={() => setShowDelete(true)}
          disabled={isLoading}
        >
          <IconTrash />
          Hapus Event
        </button>
      </div>

      {showDelete && (
        <DeleteDialog
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          isPending={isLoading && actionType === "delete"}
        />
      )}
    </>
  );
}
