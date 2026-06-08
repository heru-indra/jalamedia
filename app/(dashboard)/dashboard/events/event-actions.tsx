"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { publishEvent, unpublishEvent, deleteEvent } from "@/actions/event";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconEdit() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M9 2l2 2-6.5 6.5L2 11l.5-2.5L9 2z" />
    </svg>
  );
}

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
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="6" r="4.5" strokeOpacity="0.2" />
      <path d="M6 1.5A4.5 4.5 0 0 1 10.5 6" strokeLinecap="round" />
    </svg>
  );
}

// ── Delete confirmation dialog ────────────────────────────────────────────────

function DeleteDialog({
  onConfirm,
  onCancel,
  isPending,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <>
      <style>{`
        .del-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(3px);
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.15s ease;
        }
        .del-dialog {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 8px;
          padding: 28px;
          width: 100%;
          max-width: 360px;
          animation: slideUp 0.2s ease;
        }
        .del-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 300;
          color: #e8e0d0;
          margin-bottom: 8px;
        }
        .del-desc {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #444;
          letter-spacing: 0.06em;
          line-height: 1.7;
          margin-bottom: 24px;
        }
        .del-actions {
          display: flex;
          gap: 10px;
        }
        .del-cancel {
          flex: 1;
          padding: 10px;
          background: transparent;
          border: 1px solid #1e1e1e;
          border-radius: 4px;
          color: #444;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .del-cancel:hover { border-color: #333; color: #888; }
        .del-confirm {
          flex: 1;
          padding: 10px;
          background: rgba(139,32,32,0.15);
          border: 1px solid rgba(139,32,32,0.3);
          border-radius: 4px;
          color: #c0605a;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background 0.15s;
        }
        .del-confirm:hover { background: rgba(139,32,32,0.25); }
        .del-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .spin { animation: rotate 0.6s linear infinite; }
        @keyframes rotate { to { transform: rotate(360deg); } }
      `}</style>
      <div className="del-overlay" onClick={onCancel}>
        <div className="del-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="del-title">Hapus event?</div>
          <div className="del-desc">
            Tindakan ini tidak dapat dibatalkan.<br />
            Event akan dihapus permanen dari database.
          </div>
          <div className="del-actions">
            <button className="del-cancel" onClick={onCancel} disabled={isPending}>
              Batal
            </button>
            <button className="del-confirm" onClick={onConfirm} disabled={isPending}>
              {isPending ? (
                <span className="spin"><IconSpinner /></span>
              ) : (
                <IconTrash />
              )}
              {isPending ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface EventActionsProps {
  eventId:    string;
  status:     string;
  canPublish: boolean;
}

export function EventActions({ eventId, status, canPublish }: EventActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPending, startTransition]            = useTransition();
  const [actionType, setActionType]             = useState<"publish" | "unpublish" | "delete" | null>(null);

  function handlePublish() {
    setActionType("publish");
    startTransition(async () => {
      const result = await publishEvent(eventId);
      if (!result.success) alert(result.error);
      setActionType(null);
    });
  }

  function handleUnpublish() {
    setActionType("unpublish");
    startTransition(async () => {
      const result = await unpublishEvent(eventId);
      if (!result.success) alert(result.error);
      setActionType(null);
    });
  }

  function handleDelete() {
    setActionType("delete");
    startTransition(async () => {
      const result = await deleteEvent(eventId);
      if (!result.success) {
        alert(result.error);
        setActionType(null);
      }
      setShowDeleteDialog(false);
    });
  }

  const isLoading = isPending;

  return (
    <>
      <style>{`
        .ev-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .ev-act-btn {
          width: 30px;
          height: 30px;
          border-radius: 4px;
          border: 1px solid #1a1a1a;
          background: transparent;
          color: #333;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s, background 0.15s;
          text-decoration: none;
          flex-shrink: 0;
        }
        .ev-act-btn:hover {
          color: #888;
          border-color: #2a2a2a;
          background: rgba(255,255,255,0.03);
        }
        .ev-act-btn.publish:hover  { color: #5a8830; border-color: rgba(90,136,48,0.3);  background: rgba(90,136,48,0.05); }
        .ev-act-btn.unpublish:hover { color: #b48c50; border-color: rgba(180,140,80,0.3); background: rgba(180,140,80,0.05); }
        .ev-act-btn.delete:hover   { color: #c0605a; border-color: rgba(180,50,50,0.3);  background: rgba(180,50,50,0.05); }
        .ev-act-btn:disabled       { opacity: 0.3; cursor: not-allowed; }
        .ev-act-btn .spin          { animation: rotate 0.6s linear infinite; }
        @keyframes rotate          { to { transform: rotate(360deg); } }
      `}</style>

      <div className="ev-actions">
        {/* Edit */}
        <Link
          href={`/dashboard/events/${eventId}/edit`}
          className="ev-act-btn"
          title="Edit event"
        >
          <IconEdit />
        </Link>

        {/* Publish / Unpublish */}
        {canPublish && (
          status === "published" ? (
            <button
              className="ev-act-btn unpublish"
              onClick={handleUnpublish}
              disabled={isLoading}
              title="Kembalikan ke draft"
            >
              {isLoading && actionType === "unpublish"
                ? <span className="spin"><IconSpinner /></span>
                : <IconEyeOff />
              }
            </button>
          ) : (
            <button
              className="ev-act-btn publish"
              onClick={handlePublish}
              disabled={isLoading}
              title="Publikasikan event"
            >
              {isLoading && actionType === "publish"
                ? <span className="spin"><IconSpinner /></span>
                : <IconGlobe />
              }
            </button>
          )
        )}

        {/* Delete */}
        <button
          className="ev-act-btn delete"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isLoading}
          title="Hapus event"
        >
          <IconTrash />
        </button>
      </div>

      {/* Delete confirmation */}
      {showDeleteDialog && (
        <DeleteDialog
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
          isPending={isLoading && actionType === "delete"}
        />
      )}
    </>
  );
}
