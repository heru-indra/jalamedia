"use client";

import { useActionState, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createEvent } from "@/actions/event";
import type { ActionResult } from "@/actions/event";
import type { Category, Event } from "@/db/schema";
import { SingleImageUpload, GalleryUpload } from "@/components/image-upload";

function IconArrowLeft() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="14" y1="8" x2="2" y2="8"/><polyline points="6 4 2 8 6 12"/></svg>; }
function IconCheck()     { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="2.5 8.5 6 12 13.5 4"/></svg>; }
function IconSpinner()   { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="8" r="6" strokeOpacity="0.2"/><path d="M8 2a6 6 0 0 1 6 6" strokeLinecap="round"/></svg>; }
function IconTag()       { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M2 2h5.5l6.5 6.5-5.5 5.5L2 7.5V2z"/><circle cx="5" cy="5" r="1"/></svg>; }
function IconText()      { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="9" y2="12"/></svg>; }
function IconMapPin()    { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M8 1.5A4.5 4.5 0 0 1 12.5 6C12.5 9.5 8 14.5 8 14.5S3.5 9.5 3.5 6A4.5 4.5 0 0 1 8 1.5z"/><circle cx="8" cy="6" r="1.5"/></svg>; }
function IconCalendar()  { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1.5" y="2.5" width="13" height="12" rx="2"/><line x1="1.5" y1="7" x2="14.5" y2="7"/><line x1="5" y1="1" x2="5" y2="4"/><line x1="11" y1="1" x2="11" y2="4"/></svg>; }
function IconUsers()     { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="6" cy="4.5" r="2.5"/><path d="M1 13.5c0-2.76 2.24-5 5-5s5 2.24 5 5"/><circle cx="12" cy="4.5" r="2"/><path d="M15 13.5c0-1.93-1.3-3.57-3-4.08"/></svg>; }
function IconTicket()    { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M1 6V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4z"/></svg>; }

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ icon, label, name, type="text", defaultValue, required, placeholder, hint, rows, prefix }: {
  icon?: React.ReactNode; label: string; name: string; type?: string;
  defaultValue?: string|number; required?: boolean; placeholder?: string;
  hint?: string; rows?: number; prefix?: string;
}) {
  const [f, setF] = useState(false);
  const bc = f ? "#c9a060" : "#1e1e1e";
  const base: React.CSSProperties = { width:"100%", background:"#141414", border:`1.5px solid ${bc}`, borderRadius:7, color:"#f0e8d8", fontFamily:"'DM Mono',monospace", fontSize:13, padding: prefix ? "11px 14px 11px 34px" : "11px 14px", outline:"none", transition:"border-color 0.15s", caretColor:"#c9a060" };
  return (
    <div>
      <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8, fontFamily:"'DM Mono',monospace", color: f ? "#c9a060":"#555", transition:"color 0.15s" }}>
        {icon && <span style={{ opacity:0.7, display:"flex" }}>{icon}</span>}
        {label}{required && <span style={{ color:"#c9a060", marginLeft:2, fontSize:14 }}>*</span>}
      </label>
      <div style={{ position:"relative" }}>
        {prefix && <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#555", fontFamily:"'DM Mono',monospace", pointerEvents:"none" }}>{prefix}</span>}
        {rows
          ? <textarea name={name} defaultValue={defaultValue} required={required} rows={rows} placeholder={placeholder} style={{ ...base, padding:"11px 14px", resize:"vertical" }} onFocus={()=>setF(true)} onBlur={()=>setF(false)} />
          : <input name={name} type={type} defaultValue={defaultValue} required={required} placeholder={placeholder} style={base} onFocus={()=>setF(true)} onBlur={()=>setF(false)} />
        }
      </div>
      {hint && <div style={{ marginTop:5, fontSize:11, color:"#3a3a3a", letterSpacing:"0.03em", lineHeight:1.6, fontFamily:"'DM Mono',monospace" }}>{hint}</div>}
    </div>
  );
}

// ── CategorySelect — fetch dari /api/categories ───────────────────────────────
function CategorySelect() {
  const [cats,    setCats]    = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [focused, setFocused] = useState(false);
  const [val,     setVal]     = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then((data: Category[]) => { setCats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8, fontFamily:"'DM Mono',monospace", color: focused?"#c9a060":"#555", transition:"color 0.15s" }}>
        <span style={{ opacity:0.7, display:"flex" }}><IconTag /></span>
        Kategori
      </label>
      <select name="categoryId" value={val} disabled={loading}
        onChange={e => setVal(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width:"100%", background:"#141414", border:`1.5px solid ${focused?"#c9a060":"#1e1e1e"}`, borderRadius:7, color: val?"#f0e8d8":"#555", fontFamily:"'DM Mono',monospace", fontSize:13, padding:"11px 36px 11px 14px", outline:"none", transition:"border-color 0.15s", cursor: loading?"wait":"pointer", appearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23555' stroke-width='1.4' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 14px center" }}
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

// ── DateRangeFields ───────────────────────────────────────────────────────────
function DateRangeFields() {
  const [sv, setSv] = useState("");
  const [ev, setEv] = useState("");
  const [err, setErr] = useState<string|null>(null);
  const [sf, setSf] = useState(false);
  const [ef, setEf] = useState(false);
  const endRef = useRef<HTMLInputElement>(null);

  const onS = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value; setSv(v); setErr(null);
    if (ev && v && ev <= v) { setEv(""); if(endRef.current) endRef.current.value=""; setErr("Tanggal selesai direset — lebih awal dari tanggal mulai."); }
  }, [ev]);

  const onE = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value; setEv(v);
    setErr(v && sv && v <= sv ? "Waktu selesai harus setelah waktu mulai." : null);
  }, [sv]);

  const inp = (f: boolean, hasErr=false): React.CSSProperties => ({ width:"100%", background:"#141414", border:`1.5px solid ${hasErr?"#e05a5a":f?"#c9a060":"#1e1e1e"}`, borderRadius:7, color:"#f0e8d8", fontFamily:"'DM Mono',monospace", fontSize:13, padding:"11px 14px", outline:"none", transition:"border-color 0.15s", caretColor:"#c9a060", colorScheme:"dark" as const });
  const lbl = (f: boolean): React.CSSProperties => ({ display:"flex", alignItems:"center", gap:7, fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8, fontFamily:"'DM Mono',monospace", color:f?"#c9a060":"#555", transition:"color 0.15s" });

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <div>
          <label style={lbl(sf)}><span style={{ opacity:0.7, display:"flex" }}><IconCalendar /></span>Tanggal &amp; Waktu Mulai <span style={{ color:"#c9a060", marginLeft:2, fontSize:14 }}>*</span></label>
          <input name="startDate" type="datetime-local" required value={sv} onChange={onS} onFocus={()=>setSf(true)} onBlur={()=>setSf(false)} style={inp(sf)} />
        </div>
        <div>
          <label style={lbl(ef)}><span style={{ opacity:0.7, display:"flex" }}><IconCalendar /></span>Tanggal &amp; Waktu Selesai <span style={{ color:"#c9a060", marginLeft:2, fontSize:14 }}>*</span></label>
          <input ref={endRef} name="endDate" type="datetime-local" required value={ev} min={sv||undefined} onChange={onE} onFocus={()=>setEf(true)} onBlur={()=>setEf(false)} style={inp(ef, !!(err&&ev&&ev<=sv))} />
        </div>
      </div>
      {err && <div style={{ marginTop:8, display:"flex", alignItems:"flex-start", gap:8, fontSize:11, color:"#e09040", background:"rgba(224,144,64,0.07)", border:"1px solid rgba(224,144,64,0.2)", borderRadius:5, padding:"8px 12px", lineHeight:1.6 }}><span style={{ flexShrink:0 }}>⚠</span><span>{err}</span></div>}
    </div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
function SectionHeader({ num, title, desc }: { num:string; title:string; desc:string }) {
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
const initialState: ActionResult<Event> | null = null;

export default function NewEventPage() {
  const router = useRouter();
  const [state, action, isPending] = useActionState(
    async (prev: ActionResult<Event> | null, fd: FormData) => {
      const r = await createEvent(prev, fd);
      if (r.success) router.push(`/dashboard/events/${r.data.id}`);
      return r;
    },
    initialState,
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Mono:wght@300;400&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .np{min-height:100%;background:#0d0d0d;font-family:'DM Mono',monospace;}
        .tb{display:flex;align-items:center;justify-content:space-between;padding:18px 44px;border-bottom:1px solid #1a1a1a;background:#111;position:sticky;top:0;z-index:10;}
        .tbl{display:flex;align-items:center;gap:16px;}
        .back{display:inline-flex;align-items:center;gap:8px;color:#555;font-size:13px;letter-spacing:.06em;text-decoration:none;transition:color .15s;}
        .back:hover{color:#c9a060;}
        .tbdiv{width:1px;height:20px;background:#222;}
        .tbtitle{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:300;color:#888;}
        .tbr{display:flex;align-items:center;gap:10px;}
        .bcancel{padding:9px 20px;background:transparent;border:1.5px solid #252525;border-radius:6px;color:#555;font-family:'DM Mono',monospace;font-size:12px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;text-decoration:none;transition:border-color .15s,color .15s;}
        .bcancel:hover{border-color:#333;color:#888;}
        .bsave{display:inline-flex;align-items:center;gap:9px;padding:9px 24px;background:#c9a060;border:none;border-radius:6px;color:#0d0d0d;font-family:'DM Mono',monospace;font-size:12px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:background .15s,transform .1s;}
        .bsave:hover:not(:disabled){background:#d4b070;}
        .bsave:active:not(:disabled){transform:scale(.98);}
        .bsave:disabled{background:#222;color:#444;cursor:not-allowed;}
        .spin{animation:sp .65s linear infinite;display:inline-flex;}
        @keyframes sp{to{transform:rotate(360deg)}}
        .body{display:grid;grid-template-columns:1fr 300px;min-height:calc(100vh - 61px);}
        .main{padding:44px 48px;border-right:1px solid #1a1a1a;}
        .ptitle{font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:300;color:#f0e8d8;letter-spacing:-.02em;margin-bottom:6px;line-height:1.1;}
        .ptitle em{font-style:italic;color:#c9a060;}
        .psub{font-size:13px;color:#555;letter-spacing:.04em;margin-bottom:44px;}
        .err{display:flex;align-items:flex-start;gap:12px;background:rgba(224,90,90,.08);border:1.5px solid rgba(224,90,90,.25);border-radius:8px;padding:14px 18px;margin-bottom:32px;font-size:13px;color:#e05a5a;line-height:1.6;}
        .fsec{margin-bottom:44px;}
        .fg2{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
        .frow{display:grid;gap:20px;}
        .side{padding:44px 28px;position:sticky;top:61px;height:fit-content;}
        .slbl{font-size:10px;color:#3a3a3a;letter-spacing:.16em;text-transform:uppercase;margin-bottom:16px;}
        .pcard{background:#141414;border:1px solid #222;border-radius:10px;overflow:hidden;margin-bottom:18px;}
        .phead{padding:14px 16px;border-bottom:1px solid #1a1a1a;font-size:10px;color:#3a3a3a;letter-spacing:.14em;text-transform:uppercase;}
        .pbody{padding:16px;}
        .ptit{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:300;color:#2a2a2a;margin-bottom:10px;font-style:italic;}
        .prow{display:flex;align-items:center;gap:7px;font-size:11px;color:#2a2a2a;margin-bottom:6px;font-style:italic;}
        .tip{display:flex;align-items:flex-start;gap:9px;font-size:11px;color:#3a3a3a;letter-spacing:.02em;line-height:1.6;margin-bottom:8px;}
        .tdot{width:4px;height:4px;border-radius:50%;background:#252525;margin-top:6px;flex-shrink:0;}
        select option{background:#1a1a1a;color:#f0e8d8;}
        @media(max-width:960px){.body{grid-template-columns:1fr;}.side{display:none;}.main{padding:32px 24px;border-right:none;}.tb{padding:16px 24px;}}
        @media(max-width:600px){.fg2{grid-template-columns:1fr;}.ptitle{font-size:30px;}}
      `}</style>

      <div className="np">
        <div className="tb">
          <div className="tbl">
            <Link href="/dashboard/events" className="back"><IconArrowLeft /> Kembali</Link>
            <div className="tbdiv" />
            <span className="tbtitle">Event baru</span>
          </div>
          <div className="tbr">
            <Link href="/dashboard/events" className="bcancel">Batal</Link>
            <button type="submit" form="nef" className="bsave" disabled={isPending}>
              {isPending ? <span className="spin"><IconSpinner /></span> : <IconCheck />}
              {isPending ? "Menyimpan..." : "Simpan Event"}
            </button>
          </div>
        </div>

        <div className="body">
          <div className="main">
            <h1 className="ptitle">Buat event <em>baru</em></h1>
            <p className="psub">Isi detail event Anda. Field bertanda * wajib diisi.</p>

            {state && !state.success && (
              <div className="err"><span style={{ flexShrink:0 }}>!</span><div>{state.error}</div></div>
            )}

            <form id="nef" action={action} noValidate>
              <div className="fsec">
                <SectionHeader num="1" title="Informasi Dasar" desc="Nama, deskripsi, dan kategori event" />
                <div className="frow">
                  <Field icon={<IconText />} label="Judul Event" name="title" required placeholder="Contoh: Workshop React & Next.js 2026" hint="Judul yang deskriptif dan menarik — maks. 100 karakter" />
                  <Field icon={<IconText />} label="Deskripsi" name="description" required rows={5} placeholder="Ceritakan tentang event Anda — agenda, pembicara, manfaat..." hint="Minimal 10 karakter." />
                  <CategorySelect />
                </div>
              </div>

              <div className="fsec">
                <SectionHeader num="2" title="Lokasi & Waktu" desc="Di mana dan kapan event berlangsung" />
                <div className="frow">
                  <Field icon={<IconMapPin />} label="Lokasi" name="location" required placeholder="Contoh: Jakarta Convention Center, Hall A" hint="Nama venue, gedung, atau tautan Google Maps" />
                  <DateRangeFields />
                </div>
              </div>

              <div className="fsec">
                <SectionHeader num="3" title="Kapasitas & Tiket" desc="Jumlah peserta dan harga tiket (opsional)" />
                <div className="fg2">
                  <Field icon={<IconUsers />} label="Kapasitas" name="capacity" type="number" placeholder="Contoh: 200" hint="Kosongkan jika tidak ada batas peserta" />
                  <Field icon={<IconTicket />} label="Harga Tiket" name="ticketPrice" type="number" prefix="Rp" placeholder="0" hint="Isi 0 atau kosongkan jika event gratis" />
                </div>
              </div>

              <div className="fsec">
                <SectionHeader num="4" title="Gambar Event" desc="Cover banner, galeri foto, dan logo organizer" />
                <div className="frow">
                  <SingleImageUpload
                    type="cover"
                    name="coverImage"
                    label="Cover / Banner Event"
                    hint="Digunakan sebagai gambar utama event. Rasio 16:9, maks 5 MB."
                    aspectRatio="16/9"
                  />
                  <GalleryUpload
                    name="galleryImages"
                    maxImages={8}
                  />
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
                    <SingleImageUpload
                      type="logo"
                      name="organizerLogo"
                      label="Logo Organizer"
                      hint="Foto profil / logo. Maks 2 MB."
                      aspectRatio="1/1"
                      maxSizeMB={2}
                    />
                    <div style={{ flex: 1, fontSize: 11, color: "#3a3a3a", letterSpacing: "0.04em", lineHeight: 1.8, fontFamily: "'DM Mono', monospace", paddingTop: 36 }}>
                      Logo organizer akan tampil di halaman detail event dan profil publik Anda.
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="side">
            <div className="slbl">Pratinjau</div>
            <div className="pcard">
              <div className="phead">Tampilan event</div>
              <div className="pbody">
                <div className="ptit">Judul event Anda...</div>
                <div className="prow">📍 Lokasi belum diisi</div>
                <div className="prow">📅 Tanggal belum diisi</div>
                <div className="prow">🏷️ Kategori belum dipilih</div>
              </div>
            </div>
            <div className="slbl" style={{ marginTop:20 }}>Tips</div>
            <div className="tip"><div className="tdot" />Pilih kategori agar event mudah ditemukan</div>
            <div className="tip"><div className="tdot" />Judul spesifik meningkatkan klik hingga 3×</div>
            <div className="tip"><div className="tdot" />Event gratis mendapat lebih banyak pendaftar</div>
            <div className="tip"><div className="tdot" />Disimpan sebagai <em style={{ color:"#555" }}>Draft</em> — publish kapan saja</div>
          </div>
        </div>
      </div>
    </>
  );
}
