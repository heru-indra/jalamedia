"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createEvent } from "@/actions/event";
import type { ActionResult } from "@/actions/event";
import type { Category } from "@/db/schema";
import { SingleImageUpload, GalleryUpload } from "@/components/image-upload";

function IconLeft()    { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="14" y1="8" x2="2" y2="8"/><polyline points="6 4 2 8 6 12"/></svg>; }
function IconCheck()   { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="2.5 8.5 6 12 13.5 4"/></svg>; }
function IconSpinner() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="8" r="6" strokeOpacity="0.2"/><path d="M8 2a6 6 0 0 1 6 6" strokeLinecap="round"/></svg>; }
function IconMap()     { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M8 1.5A4.5 4.5 0 0 1 12.5 6C12.5 9.5 8 14.5 8 14.5S3.5 9.5 3.5 6A4.5 4.5 0 0 1 8 1.5z"/><circle cx="8" cy="6" r="1.5"/></svg>; }

// ── Field controlled ─────────────────────────────────────────────────────────
function Field({ label, name, type="text", value, onChange, required, placeholder, hint, rows, prefix }: {
  label:string; name:string; type?:string; value:string; onChange:(v:string)=>void;
  required?:boolean; placeholder?:string; hint?:string; rows?:number; prefix?:string;
}) {
  const [focused, setFocused] = useState(false);
  const cls = `w-full bg-[#141414] border-[1.5px] rounded-[7px] text-[#f0e8d8] font-[family-name:var(--font-mono)] text-[15px] outline-none caret-[#c9a060] placeholder-[#333] transition-colors ${focused?"border-[#c9a060]":"border-[#1e1e1e]"} ${prefix?"pl-8 pr-4 py-3.5":"px-4 py-3.5"}`;
  return (
    <div>
      <label className={`flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase mb-2 transition-colors font-[family-name:var(--font-mono)] ${focused?"text-[#c9a060]":"text-[#555]"}`}>
        {label}{required && <span className="text-[#c9a060] ml-0.5 text-sm">*</span>}
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#555] pointer-events-none">{prefix}</span>}
        {rows
          ? <textarea name={name} value={value} required={required} rows={rows} placeholder={placeholder}
              onChange={e=>onChange(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
              style={{resize:"vertical"}} className={cls} />
          : <input name={name} type={type} value={value} required={required} placeholder={placeholder}
              onChange={e=>onChange(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
              className={cls} />
        }
      </div>
      {hint && <div className="mt-1.5 text-[11px] text-[#2e2e2e] font-[family-name:var(--font-mono)]">{hint}</div>}
    </div>
  );
}

// ── Location field + inline map ───────────────────────────────────────────────
function LocationField({ value, onChange }: { value:string; onChange:(v:string)=>void }) {
  const [focused, setFocused] = useState(false);
  const [mapQ,    setMapQ]    = useState("");
  const debRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    const trimmed = value.trim();
    debRef.current = setTimeout(() => {
      setMapQ(trimmed.length < 3 ? "" : trimmed);
    }, trimmed.length < 3 ? 0 : 1200);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [value]);

  return (
    <div>
      <label className={`flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase mb-2 transition-colors font-[family-name:var(--font-mono)] ${focused?"text-[#c9a060]":"text-[#555]"}`}>
        <IconMap /> Lokasi<span className="text-[#c9a060] ml-0.5 text-sm">*</span>
      </label>
      <input name="location" type="text" value={value} required placeholder="Contoh: Jakarta Convention Center, Hall A"
        onChange={e=>onChange(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        className={`w-full bg-[#141414] border-[1.5px] rounded-[7px] text-[#f0e8d8] font-[family-name:var(--font-mono)] text-[15px] px-4 py-3.5 outline-none caret-[#c9a060] placeholder-[#333] transition-colors ${focused?"border-[#c9a060]":"border-[#1e1e1e]"}`} />
      <div className="mt-1.5 text-[11px] text-[#2e2e2e] font-[family-name:var(--font-mono)]">Nama venue, gedung, atau alamat lengkap</div>
      <div className="mt-3.5 rounded-[8px] overflow-hidden border border-[#1e1e1e] bg-[#141414]">
        {mapQ ? (
          <iframe key={mapQ} src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQ)}&output=embed&z=15&hl=id`}
            width="100%" height="200" style={{border:"none",display:"block"}} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Peta lokasi" />
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center gap-2">
            <span className="text-3xl">🗺</span>
            <span className="text-[11px] text-[#2a2a2a] tracking-[0.06em] font-[family-name:var(--font-mono)]">
              {value.length < 3 ? "Ketik lokasi untuk melihat peta" : "Menampilkan peta..."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Category select ───────────────────────────────────────────────────────────
function CategorySelect({ value, onChange }: { value:string; onChange:(v:string)=>void }) {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    fetch("/api/categories").then(r=>r.json()).then((d:Category[])=>{setCats(d);setLoading(false);}).catch(()=>setLoading(false));
  }, []);
  return (
    <div>
      <label className={`flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase mb-2 font-[family-name:var(--font-mono)] transition-colors ${focused?"text-[#c9a060]":"text-[#555]"}`}>🏷 Kategori</label>
      <select name="categoryId" value={value} disabled={loading} onChange={e=>onChange(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        className={`w-full bg-[#141414] border-[1.5px] rounded-[7px] text-[#f0e8d8] font-[family-name:var(--font-mono)] text-[15px] px-4 py-3.5 outline-none transition-colors cursor-pointer ${focused?"border-[#c9a060]":"border-[#1e1e1e]"}`}
        style={{appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23666' stroke-width='1.4' stroke-linecap='round'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 14px center",paddingRight:"36px",colorScheme:"dark"}}>
        <option value="">{loading?"Memuat...":"Pilih kategori (opsional)"}</option>
        {cats.map(c=><option key={c.id} value={c.id}>{c.emoji}  {c.name}</option>)}
      </select>
      <div className="mt-1.5 text-[11px] text-[#2e2e2e] font-[family-name:var(--font-mono)]">Membantu peserta menemukan event Anda</div>
    </div>
  );
}

// ── Date range fields ─────────────────────────────────────────────────────────
function DateRange({ sv, setSv, ev, setEv }: { sv:string;setSv:(v:string)=>void;ev:string;setEv:(v:string)=>void }) {
  const [err, setErr] = useState<string|null>(null);
  const [sf, setSf] = useState(false);
  const [ef, setEf] = useState(false);
  const cls = (f:boolean, e=false) => `w-full bg-[#141414] border-[1.5px] rounded-[7px] text-[#f0e8d8] font-[family-name:var(--font-mono)] text-[15px] px-4 py-3.5 outline-none caret-[#c9a060] transition-colors ${e?"border-[#e05a5a]":f?"border-[#c9a060]":"border-[#1e1e1e]"}`;
  return (
    <div>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className={`flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase mb-2 font-[family-name:var(--font-mono)] transition-colors ${sf?"text-[#c9a060]":"text-[#555]"}`}>📅 Tanggal Mulai<span className="text-[#c9a060] ml-0.5 text-sm">*</span></label>
          <input type="datetime-local" name="startDate" value={sv} required style={{colorScheme:"dark"}} onFocus={()=>setSf(true)} onBlur={()=>setSf(false)}
            onChange={e=>{setSv(e.target.value);setErr(null);if(ev&&e.target.value&&ev<=e.target.value){setEv("");setErr("Tanggal selesai direset.");}}} className={cls(sf)} />
        </div>
        <div>
          <label className={`flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase mb-2 font-[family-name:var(--font-mono)] transition-colors ${ef?"text-[#c9a060]":"text-[#555]"}`}>📅 Tanggal Selesai<span className="text-[#c9a060] ml-0.5 text-sm">*</span></label>
          <input type="datetime-local" name="endDate" value={ev} required min={sv||undefined} style={{colorScheme:"dark"}} onFocus={()=>setEf(true)} onBlur={()=>setEf(false)}
            onChange={e=>{setEv(e.target.value);setErr(e.target.value&&sv&&e.target.value<=sv?"Waktu selesai harus setelah waktu mulai.":null);}} className={cls(ef,!!(err&&ev&&ev<=sv))} />
        </div>
      </div>
      {err && <div className="flex items-start gap-2 mt-2.5 px-3 py-2 bg-[rgba(224,144,64,0.07)] border border-[rgba(224,144,64,0.2)] rounded text-[13px] text-[#e09040]"><span>⚠</span><span>{err}</span></div>}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ num, title, desc }: { num:string; title:string; desc:string }) {
  return (
    <div className="flex items-start gap-4 mb-8 pb-5 border-b border-[#1e1e1e]">
      <div className="w-[38px] h-[38px] rounded-[8px] bg-[rgba(201,160,96,0.1)] border border-[rgba(201,160,96,0.25)] flex items-center justify-center font-[family-name:var(--font-serif)] text-xl font-light text-[#c9a060] shrink-0">{num}</div>
      <div>
        <div className="font-[family-name:var(--font-serif)] text-xl font-light text-[#f0e8d8] mb-1">{title}</div>
        <div className="text-[13px] text-[#555] tracking-[0.04em] font-[family-name:var(--font-mono)]">{desc}</div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NewEventPage({
  canUploadImages=true, maxGalleryPhotos=8, tier="free",
}: { canUploadImages?:boolean; maxGalleryPhotos?:number; tier?:string; } = {}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string|null>(null);
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [categoryId,  setCategoryId]  = useState("");
  const [location,    setLocation]    = useState("");
  const [startDate,   setStartDate]   = useState("");
  const [endDate,     setEndDate]     = useState("");
  const [capacity,    setCapacity]    = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [coverImage,  setCoverImage]  = useState("");
  const [galleryImages, setGalleryImages] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(null);
    const fd = new FormData();
    fd.set("title",title); fd.set("description",description); fd.set("categoryId",categoryId);
    fd.set("location",location); fd.set("startDate",startDate); fd.set("endDate",endDate);
    fd.set("capacity",capacity); fd.set("ticketPrice",ticketPrice);
    fd.set("coverImage",coverImage); fd.set("galleryImages",galleryImages);
    startTransition(async () => {
      const result = await createEvent(null, fd);
      if (result.success) router.push(`/dashboard/events/${result.data.id}`);
      else { setError(result.error); window.scrollTo({top:0,behavior:"smooth"}); }
    });
  }

  return (
    <div className="min-h-full bg-[#0a0a0a] font-[family-name:var(--font-mono)]">
      {/* Topbar */}
      <div className="flex items-center justify-between px-12 py-4.5 border-b border-[#141414] bg-[#0f0f0f] sticky top-0 z-10">
        <div className="flex items-center gap-4.5">
          <Link href="/dashboard/events" className="flex items-center gap-2 text-[#555] text-[13px] tracking-[0.06em] no-underline hover:text-[#c9a060] transition-colors">
            <IconLeft /> Kembali
          </Link>
          <div className="w-px h-[22px] bg-[#1e1e1e]" />
          <span className="font-[family-name:var(--font-serif)] text-xl font-light text-[#888]">Event baru</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/events" className="px-5 py-2.5 border-[1.5px] border-[#252525] rounded-[6px] text-[#555] text-[13px] tracking-[0.08em] uppercase no-underline hover:border-[#2e2e2e] hover:text-[#888] transition-all">Batal</Link>
          <button type="submit" form="nef" disabled={isPending}
            className="flex items-center gap-2.5 px-6 py-2.5 bg-[#c9a060] rounded-[6px] text-[#0a0a0a] text-[13px] tracking-[0.1em] uppercase cursor-pointer hover:bg-[#d4b070] transition-colors disabled:bg-[#1e1e1e] disabled:text-[#333] disabled:cursor-not-allowed font-[family-name:var(--font-mono)] border-0">
            {isPending ? <><span className="animate-spin-slow"><IconSpinner /></span>Menyimpan...</> : <><IconCheck />Simpan Event</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] min-h-[calc(100vh-63px)]">
        {/* Main */}
        <div className="px-13 py-12 border-r border-[#141414]">
          <h1 className="font-[family-name:var(--font-serif)] text-[clamp(32px,3vw,42px)] font-light text-[#f0e8d8] tracking-[-0.02em] leading-[1.1] mb-2">
            Buat event <em className="italic text-[#c9a060]">baru</em>
          </h1>
          <p className="text-[15px] text-[#555] tracking-[0.04em] mb-11">Isi detail event Anda. Field bertanda * wajib diisi.</p>

          {error && (
            <div className="flex items-start gap-3 bg-[rgba(224,90,90,0.08)] border-[1.5px] border-[rgba(224,90,90,0.25)] rounded-[8px] px-4 py-3.5 mb-8 text-[13px] text-[#e05a5a]">
              <span className="shrink-0">!</span><span>{error}</span>
            </div>
          )}

          <form id="nef" onSubmit={handleSubmit} noValidate className="flex flex-col gap-11">
            {/* Section 1 */}
            <div>
              <SectionHeader num="1" title="Informasi Dasar" desc="Nama, deskripsi, dan kategori event" />
              <div className="flex flex-col gap-6">
                <Field label="Judul Event" name="title" required value={title} onChange={setTitle} placeholder="Contoh: Workshop React & Next.js 2026" hint="Judul yang deskriptif dan menarik" />
                <Field label="Deskripsi" name="description" required rows={5} value={description} onChange={setDescription} placeholder="Ceritakan tentang event Anda — agenda, pembicara, manfaat..." />
                <CategorySelect value={categoryId} onChange={setCategoryId} />
              </div>
            </div>

            {/* Section 2 */}
            <div>
              <SectionHeader num="2" title="Lokasi & Waktu" desc="Di mana dan kapan event berlangsung" />
              <div className="flex flex-col gap-6">
                <LocationField value={location} onChange={setLocation} />
                <DateRange sv={startDate} setSv={setStartDate} ev={endDate} setEv={setEndDate} />
              </div>
            </div>

            {/* Section 3 */}
            <div>
              <SectionHeader num="3" title="Kapasitas & Tiket" desc="Jumlah peserta dan harga tiket (opsional)" />
              <div className="grid grid-cols-2 gap-6">
                <Field label="Kapasitas" name="capacity" type="number" value={capacity} onChange={setCapacity} placeholder="Contoh: 200" hint="Kosongkan jika tidak ada batas" />
                <Field label="Harga Tiket" name="ticketPrice" type="number" value={ticketPrice} onChange={setTicketPrice} prefix="Rp" placeholder="0" hint="0 atau kosong = gratis" />
              </div>
            </div>

            {/* Section 4 */}
            <div>
              <SectionHeader num="4" title="Gambar Event" desc="Cover banner, galeri foto, dan logo organizer" />
              <div className="flex flex-col gap-6">
                <SingleImageUpload type="cover" name="coverImage" label="Cover / Banner Event" hint="Rasio 16:9, maks 5 MB." aspectRatio="16/9" onChange={setCoverImage} />
                {maxGalleryPhotos > 0 ? (
                  <>
                    <GalleryUpload name="galleryImages" maxImages={maxGalleryPhotos} onChange={urls=>setGalleryImages(JSON.stringify(urls))} />
                    <SingleImageUpload type="logo" name="organizerLogo" label="Logo Organizer" hint="Maks 2 MB." aspectRatio="1/1" maxSizeMB={2} />
                  </>
                ) : (
                  <div className="px-5 py-4 bg-[rgba(201,160,96,0.04)] border border-[rgba(201,160,96,0.1)] rounded-[7px] text-[13px] text-[#555] leading-[1.8]">
                    <span className="text-[#c9a060]">🗂 Galeri foto & logo</span> tersedia di Basic, Pro, dan Komisi.{" "}
                    <a href="/dashboard/upgrade" className="text-[#c9a060] underline underline-offset-3">Upgrade</a> untuk tampil lebih profesional.
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block px-7 py-9 sticky top-[63px] h-fit max-h-[calc(100vh-63px)] overflow-y-auto">
          <div className="text-[10px] text-[#333] tracking-[0.16em] uppercase mb-3">Peta Lokasi</div>
          <div className="rounded-[8px] overflow-hidden border border-[#1e1e1e] bg-[#141414] mb-6">
            {location.trim().length >= 3 ? (
              <iframe key={location} src={`https://maps.google.com/maps?q=${encodeURIComponent(location.trim())}&output=embed&z=15&hl=id`}
                width="100%" height="200" style={{border:"none",display:"block"}} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Peta lokasi" />
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center gap-2">
                <span className="text-3xl">🗺</span>
                <span className="text-[11px] text-[#2a2a2a] tracking-[0.06em] font-[family-name:var(--font-mono)]">Peta muncul setelah lokasi diisi</span>
              </div>
            )}
          </div>
          <div className="text-[10px] text-[#333] tracking-[0.16em] uppercase mb-3">Tips</div>
          {["Judul spesifik meningkatkan klik hingga 3×","Pilih kategori agar event mudah ditemukan","Event gratis mendapat lebih banyak pendaftar","Disimpan sebagai Draft — publish kapan saja"].map(t=>(
            <div key={t} className="flex items-start gap-2.5 text-[13px] text-[#333] mb-2.5 leading-[1.7]">
              <span className="w-1 h-1 rounded-full bg-[#252525] mt-2 shrink-0" />
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}