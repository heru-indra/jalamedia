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
    <form
      ref={formRef}
      className="flex flex-col gap-0"
      onSubmit={handleSubmit}
      noValidate
    >
      {error   && <div className="mb-4 rounded border border-[rgba(180,50,50,0.2)] bg-[rgba(180,50,50,0.08)] px-3 py-2 text-xs text-[#c0605a] tracking-tight font-mono leading-relaxed">{error}</div>}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded border border-[rgba(90,136,48,0.2)] bg-[rgba(90,136,48,0.08)] px-3 py-2 text-xs text-[#5a8830] tracking-tight font-mono">
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
      <div className="grid grid-cols-2 gap-5 mb-4">
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
      <div className="mb-5">
        <div className="text-xs font-mono text-[#444] tracking-widest uppercase mb-4 pb-2.5 border-b border-[#1a1a1a]">
          Gambar Event
        </div>
        <div className="flex flex-col gap-5">
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
          <div className="flex items-start gap-4">
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
      <div className="flex items-center gap-2.5 mt-1 pt-5 border-t border-[#0d0d0d]">
        <button
          type="submit"
          className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded text-xs font-mono tracking-widest uppercase transition-colors ${
            success 
              ? "bg-[rgba(90,136,48,0.15)] text-[#5a8830] border border-[rgba(90,136,48,0.3)]" 
              : "bg-[#b48c50] text-[#0a0a0a] hover:bg-[#c9a060] disabled:bg-[#2a2a2a] disabled:text-[#444]"
          }`}
          disabled={isPending}
        >
          {isPending ? (
            <span className="inline-flex animate-spin"><IconSpinner /></span>
          ) : success ? (
            <IconCheck />
          ) : null}
          {isPending ? "Menyimpan..." : success ? "Tersimpan" : "Simpan Perubahan"}
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-[#1a1a1a] rounded text-xs font-mono text-[#333] tracking-widest uppercase transition-colors hover:border-[#2e2e2e] hover:text-[#666] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleReset}
          disabled={isPending}
        >
          <IconReset />
          Reset
        </button>
      </div>
    </form>
  );
}
