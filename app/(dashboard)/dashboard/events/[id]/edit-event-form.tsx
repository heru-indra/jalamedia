"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { updateEvent } from "@/actions/event";
import type { Event } from "@/db/schema";
import { SingleImageUpload, GalleryUpload } from "@/components/image-upload";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDatetimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ── EditDateRangeFields ───────────────────────────────────────────────────────

function EditDateRangeFields({ defaultStart, defaultEnd }: {
  defaultStart: string;
  defaultEnd:   string;
}) {
  const [startVal,   setStartVal]   = useState(defaultStart);
  const [endVal,     setEndVal]     = useState(defaultEnd);
  const [dateError,  setDateError]  = useState<string | null>(null);
  const [startFocus, setStartFocus] = useState(false);
  const [endFocus,   setEndFocus]   = useState(false);
  const endRef = useRef<HTMLInputElement>(null);

  const handleStartChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStartVal(val);
    setDateError(null);
    if (endVal && val && endVal <= val) {
      setEndVal("");
      if (endRef.current) endRef.current.value = "";
      setDateError("Tanggal selesai direset — pilih ulang karena lebih awal dari tanggal mulai.");
    }
  }, [endVal]);

  const handleEndChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEndVal(val);
    setDateError(val && startVal && val <= startVal
      ? "Waktu selesai harus setelah waktu mulai."
      : null);
  }, [startVal]);

  const border = (focused: boolean, err: boolean) =>
    `1px solid ${err ? "#e05a5a" : focused ? "#b48c50" : "#1a1a1a"}`;

  const inputStyle = (focused: boolean, err = false): React.CSSProperties => ({
    width: "100%", background: "#0a0a0a",
    border: border(focused, err), borderRadius: 4,
    color: "#e8e0d0", fontFamily: "'DM Mono', monospace",
    fontSize: 12, padding: "10px 12px", outline: "none",
    transition: "border-color 0.15s", caretColor: "#b48c50",
    colorScheme: "dark",
  });

  const labelStyle = (focused: boolean): React.CSSProperties => ({
    display: "block", fontSize: 9, letterSpacing: "0.16em",
    textTransform: "uppercase", marginBottom: 7,
    fontFamily: "'DM Mono', monospace",
    color: focused ? "#b48c50" : "#333", transition: "color 0.15s",
  });

  const endHasError = !!(dateError && endVal && endVal <= startVal);

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="edit-form-grid">
        <div>
          <label style={labelStyle(startFocus)}>Tanggal &amp; Waktu Mulai *</label>
          <input
            name="startDate" type="datetime-local" required
            value={startVal} onChange={handleStartChange}
            onFocus={() => setStartFocus(true)} onBlur={() => setStartFocus(false)}
            style={inputStyle(startFocus)}
          />
        </div>
        <div>
          <label style={labelStyle(endFocus)}>Tanggal &amp; Waktu Selesai *</label>
          <input
            ref={endRef}
            name="endDate" type="datetime-local" required
            value={endVal} min={startVal || undefined}
            onChange={handleEndChange}
            onFocus={() => setEndFocus(true)} onBlur={() => setEndFocus(false)}
            style={inputStyle(endFocus, endHasError)}
          />
        </div>
      </div>
      {dateError && (
        <div style={{
          marginTop: 8, fontSize: 10, color: "#e09040",
          letterSpacing: "0.03em", lineHeight: 1.6,
          display: "flex", alignItems: "flex-start", gap: 7,
          background: "rgba(224,144,64,0.07)", border: "1px solid rgba(224,144,64,0.2)",
          borderRadius: 4, padding: "7px 10px",
          fontFamily: "'DM Mono', monospace",
        }}>
          <span style={{ flexShrink: 0 }}>⚠</span>
          <span>{dateError}</span>
        </div>
      )}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <polyline points="2 7 5 10 11 3" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6.5" cy="6.5" r="5" strokeOpacity="0.2" />
      <path d="M6.5 1.5A5 5 0 0 1 11.5 6.5" strokeLinecap="round" />
    </svg>
  );
}

function IconReset() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M2 6.5A4.5 4.5 0 1 1 4 10" />
      <polyline points="2 3 2 7 6 7" />
    </svg>
  );
}

// ── Field component ───────────────────────────────────────────────────────────

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  rows,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);

  const sharedStyle: React.CSSProperties = {
    width: "100%",
    background: "#0a0a0a",
    border: `1px solid ${focused ? "#b48c50" : "#1a1a1a"}`,
    borderRadius: 4,
    color: "#e8e0d0",
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    padding: "10px 12px",
    outline: "none",
    transition: "border-color 0.15s",
    caretColor: "#b48c50",
    resize: rows ? "vertical" as const : undefined,
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block",
        fontSize: 9,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: focused ? "#b48c50" : "#333",
        marginBottom: 7,
        fontFamily: "'DM Mono', monospace",
        transition: "color 0.15s",
      }}>
        {label}
        {required && <span style={{ color: "#b48c50", marginLeft: 3 }}>*</span>}
      </label>
      {rows ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          required={required}
          rows={rows}
          placeholder={placeholder}
          style={sharedStyle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          style={sharedStyle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function EditEventForm({ event }: { event: Event }) {
  const [isPending, startTransition] = useTransition();
  const [error,     setError]        = useState<string | null>(null);
  const [success,   setSuccess]      = useState(false);
  const formRef                      = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateEvent(event.id, fd);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error);
      }
    });
  }

  function handleReset() {
    setError(null);
    setSuccess(false);
    formRef.current?.reset();
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&display=swap');

        .edit-form textarea::placeholder,
        .edit-form input::placeholder { color: #222; }

        .edit-form input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          filter: invert(0.3);
          cursor: pointer;
        }

        .edit-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 20px;
        }

        .edit-form-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
          padding-top: 20px;
          border-top: 1px solid #111;
        }
        .edit-btn-save {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 20px;
          background: #b48c50;
          border: none;
          border-radius: 4px;
          color: #0a0a0a;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.15s;
        }
        .edit-btn-save:hover:not(:disabled) { background: #c9a060; }
        .edit-btn-save:disabled { background: #2a2a2a; color: #444; cursor: not-allowed; }
        .edit-btn-save.saved { background: rgba(90,136,48,0.2); color: #5a8830; border: 1px solid rgba(90,136,48,0.3); }

        .edit-btn-reset {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 14px;
          background: transparent;
          border: 1px solid #1a1a1a;
          border-radius: 4px;
          color: #333;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .edit-btn-reset:hover { border-color: #2e2e2e; color: #666; }

        .edit-error {
          background: rgba(180,50,50,0.08);
          border: 1px solid rgba(180,50,50,0.2);
          border-radius: 4px;
          padding: 10px 14px;
          font-size: 10px;
          color: #c0605a;
          letter-spacing: 0.04em;
          margin-bottom: 16px;
          font-family: 'DM Mono', monospace;
          line-height: 1.6;
        }
        .edit-success {
          background: rgba(90,136,48,0.08);
          border: 1px solid rgba(90,136,48,0.2);
          border-radius: 4px;
          padding: 10px 14px;
          font-size: 10px;
          color: #5a8830;
          letter-spacing: 0.04em;
          margin-bottom: 16px;
          font-family: 'DM Mono', monospace;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .spin { animation: spinAnim 0.6s linear infinite; display: inline-flex; }
        @keyframes spinAnim { to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
          .edit-form-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <form
        ref={formRef}
        className="edit-form"
        onSubmit={handleSubmit}
        noValidate
      >
        {error   && <div className="edit-error">{error}</div>}
        {success && (
          <div className="edit-success">
            <IconCheck /> Perubahan berhasil disimpan.
          </div>
        )}

        {/* Title */}
        <Field
          label="Judul Event"
          name="title"
          defaultValue={event.title}
          required
          placeholder="Nama event Anda"
        />

        {/* Description */}
        <Field
          label="Deskripsi"
          name="description"
          defaultValue={event.description}
          required
          rows={5}
          placeholder="Ceritakan detail event Anda..."
        />

        {/* Location */}
        <Field
          label="Lokasi"
          name="location"
          defaultValue={event.location}
          required
          placeholder="Nama venue atau alamat"
        />

        {/* Date grid — saling terhubung, endDate tidak bisa sebelum startDate */}
        <EditDateRangeFields
          defaultStart={toDatetimeLocal(new Date(event.startDate))}
          defaultEnd={toDatetimeLocal(new Date(event.endDate))}
        />

        {/* Capacity & price grid */}
        <div className="edit-form-grid">
          <Field
            label="Kapasitas (opsional)"
            name="capacity"
            type="number"
            defaultValue={event.capacity ?? undefined}
            placeholder="Jumlah peserta"
          />
          <Field
            label="Harga Tiket (Rp)"
            name="ticketPrice"
            type="number"
            defaultValue={Number(event.ticketPrice) || undefined}
            placeholder="0 = Gratis"
          />
        </div>

        {/* ── Images ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 9, color: "#444", letterSpacing: "0.16em", textTransform: "uppercase",
            marginBottom: 16, fontFamily: "'DM Mono', monospace",
            paddingBottom: 10, borderBottom: "1px solid #1a1a1a",
          }}>
            Gambar Event
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <SingleImageUpload
              type="cover"
              name="coverImage"
              label="Cover / Banner"
              hint="Rasio 16:9 · maks 5 MB"
              defaultUrl={event.coverImage ?? undefined}
              aspectRatio="16/9"
            />
            <GalleryUpload
              name="galleryImages"
              defaultUrls={
                event.galleryImages
                  ? (() => { try { return JSON.parse(event.galleryImages); } catch { return []; } })()
                  : []
              }
              maxImages={8}
            />
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <SingleImageUpload
                type="logo"
                name="organizerLogo"
                label="Logo Organizer"
                hint="Maks 2 MB"
                aspectRatio="1/1"
                maxSizeMB={2}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="edit-form-actions">
          <button
            type="submit"
            className={`edit-btn-save ${success ? "saved" : ""}`}
            disabled={isPending}
          >
            {isPending ? (
              <span className="spin"><IconSpinner /></span>
            ) : success ? (
              <IconCheck />
            ) : null}
            {isPending ? "Menyimpan..." : success ? "Tersimpan" : "Simpan Perubahan"}
          </button>

          <button
            type="button"
            className="edit-btn-reset"
            onClick={handleReset}
            disabled={isPending}
          >
            <IconReset />
            Reset
          </button>
        </div>
      </form>
    </>
  );
}
