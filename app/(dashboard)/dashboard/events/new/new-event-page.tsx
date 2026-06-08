"use client";

import "@/app/new-event.css";
import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createEvent } from "@/actions/event";
import type { ActionResult } from "@/actions/event";
import type { Category, Event } from "@/db/schema";
import { SingleImageUpload, GalleryUpload } from "@/components/image-upload";

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconArrowLeft() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="14" y1="8" x2="2" y2="8"/><polyline points="6 4 2 8 6 12"/></svg>; }
function IconCheck()    { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="2.5 8.5 6 12 13.5 4"/></svg>; }
function IconSpinner()  { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="8" r="6" strokeOpacity="0.2"/><path d="M8 2a6 6 0 0 1 6 6" strokeLinecap="round"/></svg>; }
function IconMapPin()   { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M8 1.5A4.5 4.5 0 0 1 12.5 6C12.5 9.5 8 14.5 8 14.5S3.5 9.5 3.5 6A4.5 4.5 0 0 1 8 1.5z"/><circle cx="8" cy="6" r="1.5"/></svg>; }
function IconText()     { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="9" y2="12"/></svg>; }
function IconTag()      { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M2 2h5.5l6.5 6.5-5.5 5.5L2 7.5V2z"/><circle cx="5" cy="5" r="1"/></svg>; }
function IconCalendar() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1.5" y="2.5" width="13" height="12" rx="2"/><line x1="1.5" y1="7" x2="14.5" y2="7"/><line x1="5" y1="1" x2="5" y2="4"/><line x1="11" y1="1" x2="11" y2="4"/></svg>; }
function IconUsers()    { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="6" cy="4.5" r="2.5"/><path d="M1 13.5c0-2.76 2.24-5 5-5s5 2.24 5 5"/><circle cx="12" cy="4.5" r="2"/><path d="M15 13.5c0-1.93-1.3-3.57-3-4.08"/></svg>; }
function IconTicket()   { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M1 6V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4z"/></svg>; }

// ── Controlled Field ──────────────────────────────────────────────────────────
// Pakai value (controlled) agar isian tidak hilang saat error server action

function Field({
  icon, label, name, type = "text", value, onChange,
  required, placeholder, hint, rows, prefix,
}: {
  icon?: React.ReactNode; label: string; name: string; type?: string;
  value: string; onChange: (v: string) => void;
  required?: boolean; placeholder?: string;
  hint?: string; rows?: number; prefix?: string;
}) {
  const [focused, setFocused] = useState(false);
  const bc  = focused ? "#c9a060" : "#1e1e1e";
  const base: React.CSSProperties = {
    width: "100%", background: "#141414",
    border: `1.5px solid ${bc}`, borderRadius: 7,
    color: "#f0e8d8", fontFamily: "'DM Mono',monospace",
    fontSize: 13, padding: prefix ? "11px 14px 11px 34px" : "11px 14px",
    outline: "none", transition: "border-color 0.15s", caretColor: "#c9a060",
  };

  return (
    <div>
      <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8, fontFamily:"'DM Mono',monospace", color: focused ? "#c9a060":"#555", transition:"color 0.15s" }}>
        {icon && <span style={{ opacity:0.7, display:"flex" }}>{icon}</span>}
        {label}{required && <span style={{ color:"#c9a060", marginLeft:2, fontSize:14 }}>*</span>}
      </label>
      <div style={{ position:"relative" }}>
        {prefix && <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#555", pointerEvents:"none" }}>{prefix}</span>}
        {rows
          ? <textarea
              name={name} value={value} required={required} rows={rows}
              placeholder={placeholder} style={{ ...base, padding:"11px 14px", resize:"vertical" }}
              onChange={e => onChange(e.target.value)}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            />
          : <input
              name={name} type={type} value={value} required={required}
              placeholder={placeholder} style={base}
              onChange={e => onChange(e.target.value)}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            />
        }
      </div>
      {hint && <div style={{ marginTop:6, fontSize:"var(--fs-xs)", color:"var(--c-text-5)", letterSpacing:"var(--ls-tight)", lineHeight:1.65, fontFamily:"var(--font-mono)" }}>{hint}</div>}
    </div>
  );
}

// ── Location Field with Google Maps ───────────────────────────────────────────

function LocationField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused,    setFocused]    = useState(false);
  const [mapQuery,   setMapQuery]   = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce 1.2s setelah user berhenti mengetik
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) { setMapQuery(""); return; }
    debounceRef.current = setTimeout(() => setMapQuery(value.trim()), 1200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value]);

  const bc = focused ? "#c9a060" : "#1e1e1e";
  const mapSrc = mapQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed&z=15&hl=id`
    : null;

  return (
    <div>
      <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8, fontFamily:"'DM Mono',monospace", color: focused ? "#c9a060":"#555", transition:"color 0.15s" }}>
        <span style={{ opacity:0.7, display:"flex" }}><IconMapPin /></span>
        Lokasi<span style={{ color:"#c9a060", marginLeft:2, fontSize:14 }}>*</span>
      </label>
      <input
        name="location" type="text" value={value} required
        placeholder="Contoh: Jakarta Convention Center, Hall A"
        style={{ width:"100%", background:"#141414", border:`1.5px solid ${bc}`, borderRadius:7, color:"#f0e8d8", fontFamily:"'DM Mono',monospace", fontSize:"var(--fs-base)", padding:"13px 16px", outline:"none", transition:"border-color 0.15s", caretColor:"var(--c-gold)" }}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <div style={{ marginTop:5, fontSize:11, color:"#3a3a3a", letterSpacing:"0.03em", lineHeight:1.6, fontFamily:"'DM Mono',monospace" }}>
        Nama venue, gedung, atau alamat lengkap
      </div>

      {/* Google Maps embed */}
      <div style={{
        marginTop: 12,
        borderRadius: 8, overflow: "hidden",
        border: "1px solid #1e1e1e",
        background: "#141414",
        transition: "all 0.3s ease",
      }}>
        {mapSrc ? (
          <iframe
            key={mapQuery}
            src={mapSrc}
            width="100%"
            height="220"
            style={{ border: "none", display: "block" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Peta lokasi"
          />
        ) : (
          <div style={{
            height: 220, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <span style={{ fontSize: 28 }}>🗺</span>
            <span style={{ fontSize: "var(--fs-sm)", color: "var(--c-text-5)", letterSpacing: "var(--ls-normal)", fontFamily: "var(--font-mono)" }}>
              {value.length < 3 ? "Ketik lokasi untuk melihat peta" : "Menampilkan peta..."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Category Select ───────────────────────────────────────────────────────────

function CategorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [cats,    setCats]    = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then((d: Category[]) => { setCats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8, fontFamily:"'DM Mono',monospace", color: focused ? "#c9a060":"#555", transition:"color 0.15s" }}>
        <span style={{ opacity:0.7, display:"flex" }}><IconTag /></span>
        Kategori
      </label>
      <select
        name="categoryId" value={value} disabled={loading}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width:"100%", background:"#141414", border:`1.5px solid ${focused?"#c9a060":"#1e1e1e"}`, borderRadius:7, color: value?"#f0e8d8":"#555", fontFamily:"'DM Mono',monospace", fontSize:"var(--fs-base)", padding:"13px 36px 13px 16px", outline:"none", transition:"border-color 0.15s", cursor:loading?"wait":"pointer", appearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23555' stroke-width='1.4' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 14px center" }}
      >
        <option value="">{loading ? "Memuat kategori..." : "Pilih kategori (opsional)"}</option>
        {cats.map(c => <option key={c.id} value={c.id}>{c.emoji}  {c.name}</option>)}
      </select>
      <div style={{ marginTop:5, fontSize:11, color:"#3a3a3a", letterSpacing:"0.03em", fontFamily:"'DM Mono',monospace" }}>
        Membantu peserta menemukan event Anda lebih mudah
      </div>
    </div>
  );
}

// ── Date Range Fields ─────────────────────────────────────────────────────────

function DateRangeFields({
  startVal, setStartVal, endVal, setEndVal,
}: {
  startVal: string; setStartVal: (v: string) => void;
  endVal: string;   setEndVal:   (v: string) => void;
}) {
  const [dateError, setDateError] = useState<string | null>(null);
  const [startFocus, setStartFocus] = useState(false);
  const [endFocus,   setEndFocus]   = useState(false);
  const endRef = useRef<HTMLInputElement>(null);

  const handleStartChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setStartVal(v);
    setDateError(null);
    if (endVal && v && endVal <= v) {
      setEndVal("");
      setDateError("Tanggal selesai direset — lebih awal dari tanggal mulai.");
    }
  }, [endVal, setStartVal, setEndVal]);

  const handleEndChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setEndVal(v);
    setDateError(v && startVal && v <= startVal ? "Waktu selesai harus setelah waktu mulai." : null);
  }, [startVal, setEndVal]);

  const inp = (f: boolean, err = false): React.CSSProperties => ({
    width:"100%", background:"#141414",
    border:`1.5px solid ${err?"#e05a5a":f?"#c9a060":"#1e1e1e"}`,
    borderRadius:7, color:"#f0e8d8", fontFamily:"'DM Mono',monospace",
    fontSize:13, padding:"11px 14px", outline:"none",
    transition:"border-color 0.15s", caretColor:"#c9a060", colorScheme:"dark" as const,
  });
  const lbl = (f: boolean): React.CSSProperties => ({
    display:"flex", alignItems:"center", gap:7,
    fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase",
    marginBottom:8, fontFamily:"'DM Mono',monospace",
    color:f?"#c9a060":"#555", transition:"color 0.15s",
  });

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <div>
          <label style={lbl(startFocus)}>
            <span style={{ opacity:0.7, display:"flex" }}><IconCalendar /></span>
            Tanggal &amp; Waktu Mulai<span style={{ color:"#c9a060", marginLeft:2, fontSize:14 }}>*</span>
          </label>
          <input
            name="startDate" type="datetime-local" required
            value={startVal} onChange={handleStartChange}
            onFocus={() => setStartFocus(true)} onBlur={() => setStartFocus(false)}
            style={inp(startFocus)}
          />
        </div>
        <div>
          <label style={lbl(endFocus)}>
            <span style={{ opacity:0.7, display:"flex" }}><IconCalendar /></span>
            Tanggal &amp; Waktu Selesai<span style={{ color:"#c9a060", marginLeft:2, fontSize:14 }}>*</span>
          </label>
          <input
            ref={endRef} name="endDate" type="datetime-local" required
            value={endVal} min={startVal || undefined}
            onChange={handleEndChange}
            onFocus={() => setEndFocus(true)} onBlur={() => setEndFocus(false)}
            style={inp(endFocus, !!(dateError && endVal && endVal <= startVal))}
          />
        </div>
      </div>
      {dateError && (
        <div style={{ marginTop:8, display:"flex", alignItems:"flex-start", gap:8, fontSize:11, color:"#e09040", background:"rgba(224,144,64,0.07)", border:"1px solid rgba(224,144,64,0.2)", borderRadius:5, padding:"8px 12px", lineHeight:1.6 }}>
          <span style={{ flexShrink:0 }}>⚠</span><span>{dateError}</span>
        </div>
      )}
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:16, marginBottom:28, paddingBottom:20, borderBottom:"1px solid #1e1e1e" }}>
      <div style={{ width:36, height:36, borderRadius:8, background:"rgba(201,160,96,0.1)", border:"1px solid rgba(201,160,96,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:300, color:"#c9a060", flexShrink:0 }}>{num}</div>
      <div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:300, color:"#f0e8d8", marginBottom:4 }}>{title}</div>
        <div style={{ fontSize:12, color:"#555", letterSpacing:"0.04em", fontFamily:"'DM Mono',monospace" }}>{desc}</div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewEventPage({
  maxGalleryPhotos = 8,
}: {
  maxGalleryPhotos?: number;
} = {}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // ── Controlled state — semua field punya state sendiri ──────────────────────
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

  // ── Submit — collect state ke FormData ──────────────────────────────────────
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.set("title",         title);
    fd.set("description",   description);
    fd.set("categoryId",    categoryId);
    fd.set("location",      location);
    fd.set("startDate",     startDate);
    fd.set("endDate",       endDate);
    fd.set("capacity",      capacity);
    fd.set("ticketPrice",   ticketPrice);
    fd.set("coverImage",    coverImage);
    fd.set("galleryImages", galleryImages);

    startTransition(async () => {
      const result = await createEvent(null, fd);
      if (result.success) {
        router.push(`/dashboard/events/${result.data.id}`);
      } else {
        setError(result.error);
        // Scroll ke error
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  return (
    <>
<div className="np">
        {/* Topbar */}
        <div className="np-topbar">
          <div className="np-topbar-left">
            <Link href="/dashboard/events" className="np-back"><IconArrowLeft /> Kembali</Link>
            <div className="np-topbar-div" />
            <span className="np-topbar-title">Event baru</span>
          </div>
          <div className="np-topbar-right">
            <Link href="/dashboard/events" className="btn btn-secondary btn-sm">Batal</Link>
            <button type="submit" form="nef" className="btn btn-primary btn-sm" disabled={isPending}>
              {isPending ? <span className="spinner dark"><IconSpinner /></span> : <IconCheck />}
              {isPending ? "Menyimpan..." : "Simpan Event"}
            </button>
          </div>
        </div>

        <div className="np-body">
          {/* Main */}
          <div className="np-main">
            <h1 className="np-title">Buat event <em>baru</em></h1>
            <p className="np-subtitle">Isi detail event Anda. Field bertanda * wajib diisi.</p>

            {error && (
              <div className="alert alert-error">
                <span style={{ flexShrink:0 }}>!</span>
                <div>{error}</div>
              </div>
            )}

            <form id="nef" onSubmit={handleSubmit} noValidate>

              {/* Section 1 — Informasi Dasar */}
              <div className="np-section">
                <SectionHeader num="1" title="Informasi Dasar" desc="Nama, deskripsi, dan kategori event" />
                <div className="np-grid-1">
                  <Field
                    icon={<IconText />} label="Judul Event" name="title" required
                    value={title} onChange={setTitle}
                    placeholder="Contoh: Workshop React & Next.js 2026"
                    hint="Judul yang deskriptif dan menarik — maks. 100 karakter"
                  />
                  <Field
                    icon={<IconText />} label="Deskripsi" name="description" required rows={5}
                    value={description} onChange={setDescription}
                    placeholder="Ceritakan tentang event Anda — agenda, pembicara, manfaat..."
                    hint="Minimal 10 karakter."
                  />
                  <CategorySelect value={categoryId} onChange={setCategoryId} />
                </div>
              </div>

              {/* Section 2 — Lokasi & Waktu */}
              <div className="np-section">
                <SectionHeader num="2" title="Lokasi & Waktu" desc="Di mana dan kapan event berlangsung" />
                <div className="np-grid-1">
                  <LocationField value={location} onChange={setLocation} />
                  <DateRangeFields
                    startVal={startDate} setStartVal={setStartDate}
                    endVal={endDate}     setEndVal={setEndDate}
                  />
                </div>
              </div>

              {/* Section 3 — Kapasitas & Tiket */}
              <div className="np-section">
                <SectionHeader num="3" title="Kapasitas & Tiket" desc="Jumlah peserta dan harga tiket (opsional)" />
                <div className="np-grid-2">
                  <Field
                    icon={<IconUsers />} label="Kapasitas" name="capacity" type="number"
                    value={capacity} onChange={setCapacity}
                    placeholder="Contoh: 200" hint="Kosongkan jika tidak ada batas peserta"
                  />
                  <Field
                    icon={<IconTicket />} label="Harga Tiket" name="ticketPrice" type="number"
                    value={ticketPrice} onChange={setTicketPrice}
                    prefix="Rp" placeholder="0" hint="Isi 0 atau kosongkan jika event gratis"
                  />
                </div>
              </div>

              {/* Section 4 — Gambar */}
              <div className="np-section">
                <SectionHeader num="4" title="Gambar Event" desc="Cover banner, galeri foto, dan logo organizer" />
                <div className="np-grid-1">
                  <SingleImageUpload
                    type="cover" name="coverImage"
                    label="Cover / Banner Event"
                    hint="Digunakan sebagai gambar utama event. Rasio 16:9, maks 5 MB."
                    aspectRatio="16/9"
                    onChange={setCoverImage}
                  />
                  {maxGalleryPhotos > 0 ? (
                    <>
                      <GalleryUpload
                        name="galleryImages"
                        maxImages={maxGalleryPhotos}
                        onChange={urls => setGalleryImages(JSON.stringify(urls))}
                      />
                      <div style={{ display:"flex", alignItems:"flex-start", gap:24 }}>
                        <SingleImageUpload
                          type="logo" name="organizerLogo"
                          label="Logo Organizer" hint="Foto profil / logo. Maks 2 MB."
                          aspectRatio="1/1" maxSizeMB={2}
                        />
                        <div style={{ flex:1, fontSize:11, color:"#3a3a3a", letterSpacing:"0.04em", lineHeight:1.8, fontFamily:"'DM Mono',monospace", paddingTop:36 }}>
                          Logo organizer akan tampil di halaman detail event.
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ padding:"16px 18px", background:"rgba(201,160,96,0.04)", border:"1px solid rgba(201,160,96,0.1)", borderRadius:7, fontSize:11, color:"#555", letterSpacing:"0.04em", lineHeight:1.8, fontFamily:"'DM Mono',monospace" }}>
                      <span style={{ color:"#c9a060" }}>🗂 Galeri foto & logo</span> tersedia di Basic, Pro, dan Komisi.{" "}
                      <a href="/dashboard/upgrade" style={{ color:"#c9a060", textDecoration:"underline", textUnderlineOffset:3 }}>Upgrade</a>{" "}
                      untuk tampil lebih profesional.
                    </div>
                  )}
                </div>
              </div>

            </form>
          </div>

          {/* Sidebar */}
          <div className="np-side">
            <div className="np-side-label">Peta Lokasi</div>
            <div style={{ borderRadius:8, overflow:"hidden", border:"1px solid #1e1e1e", background:"#141414", marginBottom:20 }}>
              {location.trim().length >= 3 ? (
                <iframe
                  key={location}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(location.trim())}&output=embed&z=15&hl=id`}
                  width="100%" height="200"
                  style={{ border:"none", display:"block" }}
                  loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                  title="Peta lokasi"
                />
              ) : (
                <div style={{ height:200, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <span style={{ fontSize:28 }}>🗺</span>
                  <span style={{ fontSize:11, color:"#2a2a2a", letterSpacing:"0.06em", fontFamily:"'DM Mono',monospace" }}>
                    Peta muncul setelah lokasi diisi
                  </span>
                </div>
              )}
            </div>

            <div className="np-side-label">Tips</div>
            <div className="np-tip"><div className="np-tip-dot"/>Judul spesifik meningkatkan klik hingga 3×</div>
            <div className="np-tip"><div className="np-tip-dot"/>Pilih kategori agar event mudah ditemukan</div>
            <div className="np-tip"><div className="np-tip-dot"/>Event gratis mendapat lebih banyak pendaftar</div>
            <div className="np-tip"><div className="np-tip-dot"/>Disimpan sebagai <em style={{ color:"#555" }}>Draft</em> — publish kapan saja</div>
          </div>
        </div>
      </div>
    </>
  );
}
