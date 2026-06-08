// src/app/(dashboard)/events/[id]/edit-event-form.tsx
"use client";

import { useState, useTransition, useRef } from "react";
import { updateEvent } from "@/actions/event";
import type { Event } from "@/db/schema";
import { SingleImageUpload, GalleryUpload } from "@/components/image-upload";

function toDatetimeLocal(d: Date) {
  const p = (n:number) => String(n).padStart(2,"0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function IconCheck()   { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="2.5 8.5 6 12 13.5 4"/></svg>; }
function IconSpinner() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="8" r="6" strokeOpacity="0.2"/><path d="M8 2a6 6 0 0 1 6 6" strokeLinecap="round"/></svg>; }
function IconReset()   { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M2 8a6 6 0 1 0 1.5-4"/><polyline points="2 3 2 7 6 7"/></svg>; }

function Field({ label, name, type="text", defaultValue, required, placeholder, rows }: {
  label:string; name:string; type?:string; defaultValue?:string|number; required?:boolean; placeholder?:string; rows?:number;
}) {
  const [focused, setFocused] = useState(false);
  const cls = `w-full bg-[#141414] border-[1.5px] rounded-[7px] text-[#f0e8d8] font-[family-name:var(--font-mono)] text-[15px] px-4 py-3.5 outline-none caret-[#c9a060] placeholder-[#333] transition-colors ${focused?"border-[#c9a060]":"border-[#1e1e1e]"}`;
  return (
    <div className="mb-4">
      <label className={`block text-[10px] tracking-[0.16em] uppercase mb-2 transition-colors ${focused?"text-[#c9a060]":"text-[#555]"}`}>
        {label}{required && <span className="text-[#c9a060] ml-0.5">*</span>}
      </label>
      {rows
        ? <textarea name={name} defaultValue={defaultValue} required={required} rows={rows} placeholder={placeholder} style={{resize:"vertical",colorScheme:"dark"}} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} className={cls} />
        : <input name={name} type={type} defaultValue={defaultValue} required={required} placeholder={placeholder} style={{colorScheme:"dark"}} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} className={cls} />
      }
    </div>
  );
}

function DateRange({ ds, de }: { ds:string; de:string }) {
  const [sv, setSv] = useState(ds);
  const [ev, setEv] = useState(de);
  const [err, setErr] = useState<string|null>(null);
  const [sf, setSf] = useState(false);
  const [ef, setEf] = useState(false);
  const cls = (f:boolean, e=false) => `w-full bg-[#141414] border-[1.5px] rounded-[7px] text-[#f0e8d8] font-[family-name:var(--font-mono)] text-[15px] px-4 py-3.5 outline-none caret-[#c9a060] transition-colors ${e?"border-[#e05a5a]":f?"border-[#c9a060]":"border-[#1e1e1e]"}`;
  return (
    <div className="mb-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`block text-[10px] tracking-[0.16em] uppercase mb-2 ${sf?"text-[#c9a060]":"text-[#555]"}`}>Tanggal Mulai<span className="text-[#c9a060] ml-0.5">*</span></label>
          <input type="datetime-local" name="startDate" value={sv} required style={{colorScheme:"dark"}} onFocus={()=>setSf(true)} onBlur={()=>setSf(false)}
            onChange={e=>{setSv(e.target.value);setErr(null);if(ev&&e.target.value&&ev<=e.target.value){setEv("");setErr("Tanggal selesai direset.");}}} className={cls(sf)} />
        </div>
        <div>
          <label className={`block text-[10px] tracking-[0.16em] uppercase mb-2 ${ef?"text-[#c9a060]":"text-[#555]"}`}>Tanggal Selesai<span className="text-[#c9a060] ml-0.5">*</span></label>
          <input type="datetime-local" name="endDate" value={ev} required min={sv||undefined} style={{colorScheme:"dark"}} onFocus={()=>setEf(true)} onBlur={()=>setEf(false)}
            onChange={e=>{setEv(e.target.value);setErr(e.target.value&&sv&&e.target.value<=sv?"Waktu selesai harus setelah waktu mulai.":null);}} className={cls(ef,!!(err&&ev&&ev<=sv))} />
        </div>
      </div>
      {err && <div className="flex items-start gap-2 mt-2.5 px-3 py-2 bg-[rgba(224,144,64,0.07)] border border-[rgba(224,144,64,0.2)] rounded text-[13px] text-[#e09040]"><span>⚠</span><span>{err}</span></div>}
    </div>
  );
}

export function EditEventForm({ event, canUploadImages=true, maxGalleryPhotos=8 }: {
  event:Event; canUploadImages?:boolean; maxGalleryPhotos?:number;
}) {
  const [isPending, start] = useTransition();
  const [error,  setError]   = useState<string|null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(null); setSuccess(false);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await updateEvent(event.id, fd);
      if (r.success) { setSuccess(true); setTimeout(()=>setSuccess(false),3000); }
      else setError(r.error);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col">
      {error && <div className="flex items-start gap-3 px-4 py-3 bg-[rgba(224,90,90,0.08)] border-[1.5px] border-[rgba(224,90,90,0.25)] rounded-[7px] mb-4 text-[13px] text-[#e05a5a]">⚠ {error}</div>}
      {success && <div className="flex items-center gap-2 px-4 py-3 bg-[rgba(106,170,56,0.1)] border border-[rgba(106,170,56,0.3)] rounded-[7px] mb-4 text-[13px] text-[#6aaa38]"><IconCheck /> Perubahan berhasil disimpan.</div>}

      <Field label="Judul Event"  name="title"       defaultValue={event.title}       required placeholder="Nama event" />
      <Field label="Deskripsi"    name="description" defaultValue={event.description} required rows={5} placeholder="Detail event..." />
      <Field label="Lokasi"       name="location"    defaultValue={event.location}    required placeholder="Nama venue atau alamat" />
      <DateRange ds={toDatetimeLocal(new Date(event.startDate))} de={toDatetimeLocal(new Date(event.endDate))} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Kapasitas"     name="capacity"    type="number" defaultValue={event.capacity??undefined} placeholder="Jumlah peserta" />
        <Field label="Harga Tiket (Rp)" name="ticketPrice" type="number" defaultValue={Number(event.ticketPrice)||undefined} placeholder="0 = Gratis" />
      </div>

      {/* Images */}
      <div className="mb-4">
        <div className="text-[10px] text-[#333] tracking-[0.16em] uppercase mb-4 pb-2.5 border-b border-[#141414]">Gambar Event</div>
        {canUploadImages ? (
          <div className="flex flex-col gap-5">
            <SingleImageUpload type="cover" name="coverImage" label="Cover / Banner" hint="Rasio 16:9 · maks 5 MB" defaultUrl={event.coverImage??undefined} aspectRatio="16/9" />
            {maxGalleryPhotos > 0 ? (
              <>
                <GalleryUpload name="galleryImages"
                  defaultUrls={event.galleryImages ? (()=>{try{return JSON.parse(event.galleryImages!);}catch{return [];}})() : []}
                  maxImages={maxGalleryPhotos} />
                <SingleImageUpload type="logo" name="organizerLogo" label="Logo Organizer" hint="Maks 2 MB" aspectRatio="1/1" maxSizeMB={2} />
              </>
            ) : (
              <div className="px-4 py-3.5 bg-[rgba(201,160,96,0.04)] border border-[rgba(201,160,96,0.1)] rounded-[7px] text-[13px] text-[#555] leading-relaxed">
                <span className="text-[#c9a060]">🗂 Galeri & logo</span> tersedia di Basic, Pro, dan Komisi.{" "}
                <a href="/dashboard/upgrade" className="text-[#c9a060] underline underline-offset-2">Upgrade</a> untuk tampil lebih profesional.
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-3.5 bg-[rgba(201,160,96,0.04)] border border-[rgba(201,160,96,0.1)] rounded-[7px] text-[13px] text-[#555]">
            Upload gambar tidak tersedia. <a href="/dashboard/upgrade" className="text-[#c9a060] underline underline-offset-2">Upgrade</a>.
          </div>
        )}
      </div>

      <div className="flex gap-2.5 mt-2">
        <button type="submit" disabled={isPending}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[7px] text-[13px] tracking-widest uppercase transition-all cursor-pointer font-[family-name:var(--font-mono)] border ${success?"bg-[rgba(106,170,56,0.15)] border-[rgba(106,170,56,0.3)] text-[#6aaa38]":isPending?"bg-[#1e1e1e] border-[#1e1e1e] text-[#333] cursor-not-allowed":"bg-[#c9a060] border-[#c9a060] text-[#0a0a0a] hover:bg-[#d4b070]"}`}>
          {isPending ? <><span className="animate-spin-slow"><IconSpinner /></span>Menyimpan...</> : success ? <><IconCheck />Tersimpan</> : "Simpan Perubahan"}
        </button>
        <button type="button" onClick={()=>{formRef.current?.reset();setError(null);setSuccess(false);}} disabled={isPending}
          className="flex items-center gap-2 px-4 py-3.5 border border-[#1e1e1e] rounded-[7px] text-[#555] text-[13px] tracking-widest uppercase hover:border-[#252525] hover:text-[#888] transition-all cursor-pointer disabled:opacity-40 bg-transparent font-[family-name:var(--font-mono)]">
          <IconReset /> Reset
        </button>
      </div>
    </form>
  );
}