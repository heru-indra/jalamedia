"use client";

import "@/app/edit-form.css";
import { useState, useTransition, useRef, useCallback } from "react";
import { updateEvent } from "@/actions/event";
import type { Event } from "@/db/schema";
import { SingleImageUpload, GalleryUpload } from "@/components/image-upload";

function toDatetimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconCheck()   { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="2.5 8.5 6 12 13.5 4"/></svg>; }
function IconSpinner() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="8" r="6" strokeOpacity="0.2"/><path d="M8 2a6 6 0 0 1 6 6" strokeLinecap="round"/></svg>; }
function IconReset()   { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M2 8a6 6 0 1 0 1.5-4"/><polyline points="2 3 2 7 6 7"/></svg>; }

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, name, type="text", defaultValue, required, placeholder, rows }: {
  label: string; name: string; type?: string;
  defaultValue?: string|number; required?: boolean; placeholder?: string; rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  const style: React.CSSProperties = {
    width:"100%", background:"var(--c-bg-3)",
    border:`1.5px solid ${focused?"var(--c-gold)":"var(--c-border)"}`,
    borderRadius:"var(--r-md)", color:"var(--c-text)",
    fontFamily:"var(--font-mono)", fontSize:"var(--fs-base)",
    padding:"13px 16px", outline:"none",
    transition:"border-color var(--t-fast)", caretColor:"var(--c-gold)",
    lineHeight:1.5, colorScheme:"dark" as const,
  };
  return (
    <div className="edit-field">
      <label className={`edit-field-label${focused ? " focused" : ""}`}>{label}{required && <span style={{ color:"var(--c-gold)", marginLeft:2 }}>*</span>}</label>
      {rows
        ? <textarea name={name} defaultValue={defaultValue} required={required} rows={rows} placeholder={placeholder} style={{ ...style, resize:"vertical" }} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} />
        : <input    name={name} type={type} defaultValue={defaultValue} required={required} placeholder={placeholder} style={style} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} />
      }
    </div>
  );
}

// ── Date Range Fields ─────────────────────────────────────────────────────────
function EditDateRangeFields({ defaultStart, defaultEnd }: { defaultStart:string; defaultEnd:string }) {
  const [startVal, setStartVal] = useState(defaultStart);
  const [endVal,   setEndVal]   = useState(defaultEnd);
  const [dateError, setDateError] = useState<string|null>(null);
  const [sf, setSf] = useState(false);
  const [ef, setEf] = useState(false);

  const inp = (f:boolean, err=false): React.CSSProperties => ({
    width:"100%", background:"var(--c-bg-3)",
    border:`1.5px solid ${err?"var(--c-red)":f?"var(--c-gold)":"var(--c-border)"}`,
    borderRadius:"var(--r-md)", color:"var(--c-text)",
    fontFamily:"var(--font-mono)", fontSize:"var(--fs-base)",
    padding:"13px 16px", outline:"none",
    transition:"border-color var(--t-fast)", caretColor:"var(--c-gold)", colorScheme:"dark" as const,
  });

  return (
    <div>
      <div className="edit-form-grid">
        <div className="edit-field">
          <label className={`edit-field-label${sf?" focused":""}`}>Tanggal Mulai<span style={{color:"var(--c-gold)",marginLeft:2}}>*</span></label>
          <input type="datetime-local" name="startDate" value={startVal} required style={inp(sf)}
            onFocus={()=>setSf(true)} onBlur={()=>setSf(false)}
            onChange={e=>{
              setStartVal(e.target.value); setDateError(null);
              if (endVal && e.target.value && endVal <= e.target.value) { setEndVal(""); setDateError("Tanggal selesai direset."); }
            }}
          />
        </div>
        <div className="edit-field">
          <label className={`edit-field-label${ef?" focused":""}`}>Tanggal Selesai<span style={{color:"var(--c-gold)",marginLeft:2}}>*</span></label>
          <input type="datetime-local" name="endDate" value={endVal} required min={startVal||undefined} style={inp(ef,!!(dateError&&endVal&&endVal<=startVal))}
            onFocus={()=>setEf(true)} onBlur={()=>setEf(false)}
            onChange={e=>{ setEndVal(e.target.value); setDateError(e.target.value&&startVal&&e.target.value<=startVal?"Waktu selesai harus setelah waktu mulai.":null); }}
          />
        </div>
      </div>
      {dateError && (
        <div className="date-error"><span>⚠</span><span>{dateError}</span></div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function EditEventForm({
  event,
  canUploadImages  = true,
  maxGalleryPhotos = 8,
}: {
  event:             Event;
  canUploadImages?:  boolean;
  maxGalleryPhotos?: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [error,     setError]        = useState<string|null>(null);
  const [success,   setSuccess]      = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null); setSuccess(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await updateEvent(event.id, fd);
      if (r.success) { setSuccess(true); setTimeout(()=>setSuccess(false), 3000); }
      else setError(r.error);
    });
  }

  function handleReset() {
    formRef.current?.reset(); setError(null); setSuccess(false);
  }

  return (
    <form ref={formRef} className="edit-form" onSubmit={handleSubmit} noValidate>
      {error   && <div className="edit-error">{error}</div>}
      {success && <div className="edit-success"><IconCheck /> Perubahan berhasil disimpan.</div>}

      <Field label="Judul Event"  name="title"       defaultValue={event.title}       required placeholder="Nama event" />
      <Field label="Deskripsi"    name="description" defaultValue={event.description} required rows={5} placeholder="Detail event..." />
      <Field label="Lokasi"       name="location"    defaultValue={event.location}    required placeholder="Nama venue atau alamat" />

      <EditDateRangeFields
        defaultStart={toDatetimeLocal(new Date(event.startDate))}
        defaultEnd={toDatetimeLocal(new Date(event.endDate))}
      />

      <div className="edit-form-grid">
        <Field label="Kapasitas (opsional)" name="capacity"    type="number" defaultValue={event.capacity ?? undefined} placeholder="Jumlah peserta" />
        <Field label="Harga Tiket (Rp)"     name="ticketPrice" type="number" defaultValue={Number(event.ticketPrice)||undefined} placeholder="0 = Gratis" />
      </div>

      {/* Images */}
      <div style={{ marginBottom:18 }}>
        <div className="edit-images-label">Gambar Event</div>
        {canUploadImages ? (
          <div className="edit-images-content">
            <SingleImageUpload
              type="cover" name="coverImage" label="Cover / Banner"
              hint="Rasio 16:9 · maks 5 MB" defaultUrl={event.coverImage ?? undefined} aspectRatio="16/9"
            />
            {maxGalleryPhotos > 0 ? (
              <>
                <GalleryUpload
                  name="galleryImages"
                  defaultUrls={event.galleryImages ? (() => { try { return JSON.parse(event.galleryImages); } catch { return []; } })() : []}
                  maxImages={maxGalleryPhotos}
                />
                <SingleImageUpload type="logo" name="organizerLogo" label="Logo Organizer" hint="Maks 2 MB" aspectRatio="1/1" maxSizeMB={2} />
              </>
            ) : (
              <div className="edit-upgrade-prompt">
                <span style={{ color:"var(--c-gold)" }}>🗂 Galeri & logo</span> tersedia di Basic, Pro, dan Komisi.{" "}
                <a href="/dashboard/upgrade">Upgrade</a> untuk tampil lebih profesional.
              </div>
            )}
          </div>
        ) : (
          <div className="edit-upgrade-prompt">
            Upload gambar tidak tersedia. <a href="/dashboard/upgrade">Upgrade</a>.
          </div>
        )}
      </div>

      <div className="edit-form-actions">
        <button type="submit" className={`edit-btn-save${success?" saved":""}`} disabled={isPending}>
          {isPending ? <span className="spin"><IconSpinner /></span> : success ? <IconCheck /> : null}
          {isPending ? "Menyimpan..." : success ? "Tersimpan" : "Simpan Perubahan"}
        </button>
        <button type="button" className="edit-btn-reset" onClick={handleReset} disabled={isPending}>
          <IconReset /> Reset
        </button>
      </div>
    </form>
  );
}