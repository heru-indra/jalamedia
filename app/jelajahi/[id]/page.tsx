// src/app/jelajahi/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { ShareButton } from "./share-button";
import { db } from "@/db";
import { events, categories, user } from "@/db/schema";
import { eq, and, ne, desc } from "drizzle-orm";

function fmtDateFull(d:Date){ return new Intl.DateTimeFormat("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(d); }
function fmtTime(d:Date)    { return new Intl.DateTimeFormat("id-ID",{hour:"2-digit",minute:"2-digit"}).format(d); }
function fmtDT(d:Date)      { return new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(d); }
function fmtPrice(p:string|null){ const n=Number(p); if(!n) return "Gratis"; return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n); }
function getDur(s:Date,e:Date){ const ms=e.getTime()-s.getTime(); const h=Math.floor(ms/3600000); const m=Math.floor((ms%3600000)/60000); if(!h) return `${m} menit`; if(!m) return `${h} jam`; return `${h} jam ${m} menit`; }

function IconLeft()   { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="14" y1="8" x2="2" y2="8"/><polyline points="6 4 2 8 6 12"/></svg>; }
function IconCal()    { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1.5" y="2.5" width="13" height="12" rx="2"/><line x1="1.5" y1="7" x2="14.5" y2="7"/><line x1="5" y1="1" x2="5" y2="4"/><line x1="11" y1="1" x2="11" y2="4"/></svg>; }
function IconClock()  { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="8" cy="8" r="6.5"/><polyline points="8 4 8 8 10.5 10"/></svg>; }
function IconPin()    { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M8 1.5A4.5 4.5 0 0 1 12.5 6C12.5 9.5 8 14.5 8 14.5S3.5 9.5 3.5 6A4.5 4.5 0 0 1 8 1.5z"/><circle cx="8" cy="6" r="1.5"/></svg>; }
function IconUsers()  { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="6" cy="4.5" r="2.5"/><path d="M1 13.5c0-2.76 2.24-5 5-5s5 2.24 5 5"/><circle cx="12" cy="4.5" r="2"/><path d="M15 13.5c0-1.93-1.3-3.57-3-4.08"/></svg>; }
function IconTicket() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M1 6V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4z"/></svg>; }
function IconArrow()  { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="2" y1="8" x2="14" y2="8"/><polyline points="9 3 14 8 9 13"/></svg>; }

export async function generateMetadata({ params }: { params: Promise<{id:string}> }) {
  const { id } = await params;
  const [row] = await db.select({ event: events }).from(events)
    .where(and(eq(events.id, id), eq(events.status, "published"))).limit(1);
  if (!row) return { title: "Event tidak ditemukan" };
  return {
    title: `${row.event.title} — Eventara`,
    description: row.event.description.slice(0, 160),
    openGraph: { title: row.event.title, description: row.event.description.slice(0, 160), images: row.event.coverImage ? [row.event.coverImage] : [] },
  };
}

interface Props { params: Promise<{id:string}> }

export default async function PublicEventDetailPage({ params }: Props) {
  const { id } = await params;
  const [row] = await db
    .select({ event: events, category: categories, organizer: user })
    .from(events)
    .leftJoin(categories, eq(events.categoryId, categories.id))
    .leftJoin(user, eq(events.userId, user.id))
    .where(and(eq(events.id, id), eq(events.status, "published")))
    .limit(1);
  if (!row) notFound();

  const { event: ev, category: cat, organizer: org } = row;
  const sd = new Date(ev.startDate); const ed = new Date(ev.endDate);
  const isUp = sd > new Date();
  const isFree = !Number(ev.ticketPrice);
  const dur = getDur(sd, ed);

  let gallery: string[] = [];
  if (ev.galleryImages) try { gallery = JSON.parse(ev.galleryImages); } catch {}

  const related = cat ? await db
    .select({ event: events, category: categories })
    .from(events).leftJoin(categories, eq(events.categoryId, categories.id))
    .where(and(eq(events.status,"published"), eq(events.categoryId, cat.id), ne(events.id, id)))
    .orderBy(desc(events.startDate)).limit(3) : [];

  const chips = [
    { icon: <IconCal />,   text: fmtDateFull(sd) },
    { icon: <IconClock />, text: `${fmtTime(sd)} – ${fmtTime(ed)} (${dur})` },
    { icon: <IconPin />,   text: ev.location },
    ...(ev.capacity ? [{ icon: <IconUsers />, text: `${ev.capacity.toLocaleString("id-ID")} kapasitas` }] : []),
    { icon: <IconTicket />, text: fmtPrice(ev.ticketPrice), accent: !isFree },
  ];

  const sideDetails = [
    { icon: <IconCal />,    label:"Tanggal",  value: fmtDT(sd) },
    { icon: <IconClock />,  label:"Durasi",   value: dur },
    { icon: <IconPin />,    label:"Lokasi",   value: ev.location },
    ...(ev.capacity ? [{ icon: <IconUsers />, label:"Kapasitas", value: `${ev.capacity.toLocaleString("id-ID")} peserta` }] : []),
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-dvh bg-[#0a0a0a] font-[family-name:var(--font-mono)]">

        {/* Hero */}
        <div className="relative w-full bg-[#111] overflow-hidden" style={{aspectRatio:"16/9",maxHeight:520}}>
          {ev.coverImage ? (
            <Image src={ev.coverImage} alt={ev.title} fill style={{objectFit:"cover"}} sizes="100vw" priority />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[80px]"
              style={{background:`radial-gradient(ellipse at 50% 120%, rgba(201,160,96,0.08), transparent)`}}>
              {cat?.emoji ?? "📅"}
            </div>
          )}
          <div className="absolute inset-0"
            style={{background:"linear-gradient(to bottom, transparent 40%, rgba(10,10,10,0.6) 75%, rgba(10,10,10,0.95) 100%)"}} />

          {/* Back */}
          <Link href="/jelajahi"
            className="absolute top-6 left-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/70 border border-white/[0.12] backdrop-blur-md text-[13px] text-[#c0b8a8] no-underline hover:text-[#f0e8d8] hover:border-white/22 transition-all">
            <IconLeft /> Kembali ke Jelajahi
          </Link>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-10 pb-8">
            {cat && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black/65 border border-[rgba(201,160,96,0.3)] backdrop-blur-md text-[11px] text-[#c9a060] mb-3.5 uppercase tracking-[0.06em]">
                {cat.emoji} {cat.name}
              </div>
            )}
            <h1 className="font-[family-name:var(--font-serif)] text-[clamp(28px,4vw,52px)] font-light text-[#f0e8d8] leading-[1.12] tracking-[-0.02em]"
              style={{textShadow:"0 2px 20px rgba(0,0,0,0.5)"}}>
              {ev.title.split(" ").length > 3
                ? <>{ev.title.split(" ").slice(0,-2).join(" ")} <em className="italic text-[#c9a060]">{ev.title.split(" ").slice(-2).join(" ")}</em></>
                : <em className="italic text-[#c9a060]">{ev.title}</em>}
            </h1>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-[1100px] mx-auto px-10 py-12 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-14 items-start">

          {/* Main */}
          <div>
            {/* Info chips */}
            <div className="flex flex-wrap gap-2.5 mb-9 pb-8 border-b border-[#141414]">
              {chips.map((c,i) => (
                <div key={i} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[7px] text-[13px] ${c.accent?"bg-[rgba(201,160,96,0.07)] border border-[rgba(201,160,96,0.25)] text-[#c9a060]":"bg-[#0f0f0f] border border-[#1e1e1e] text-[#888]"}`}>
                  {c.icon} {c.text}
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="mb-9 pb-9 border-b border-[#141414]">
              <div className="text-[10px] text-[#555] tracking-[0.16em] uppercase mb-4">Tentang Event</div>
              <p className="text-[15px] text-[#888] leading-[1.85] whitespace-pre-wrap">{ev.description}</p>
            </div>

            {/* Gallery */}
            {gallery.length > 0 && (
              <div className="mb-9 pb-9 border-b border-[#141414]">
                <div className="text-[10px] text-[#555] tracking-[0.16em] uppercase mb-4">Galeri Foto ({gallery.length})</div>
                <div className="grid gap-2.5" style={{gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))"}}>
                  {gallery.map((url,i) => (
                    <div key={i} className="relative rounded-[7px] overflow-hidden bg-[#1a1a1a] hover:scale-[1.02] transition-transform cursor-pointer" style={{aspectRatio:"1/1"}}>
                      <Image src={url} alt={`Foto ${i+1}`} fill style={{objectFit:"cover"}} sizes="200px" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="mb-9 pb-9 border-b border-[#141414]">
              <div className="text-[10px] text-[#555] tracking-[0.16em] uppercase mb-4">Jadwal</div>
              <div className="flex flex-col">
                {[
                  { label:"Mulai",   value:fmtDateFull(sd), sub:`${fmtTime(sd)} WIB`, end:false },
                  { label:"Selesai", value:fmtDateFull(ed), sub:`${fmtTime(ed)} WIB · Durasi ${dur}`, end:true },
                ].map((t,i,arr) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center w-5 shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${t.end?"bg-[#333]":"bg-[#c9a060]"}`} />
                      {i < arr.length-1 && <div className="flex-1 w-px bg-[#1e1e1e] my-1 min-h-[28px]" />}
                    </div>
                    <div className="pb-6 flex-1">
                      <div className="text-[10px] text-[#333] tracking-[0.16em] uppercase mb-0.5">{t.label}</div>
                      <div className="text-[15px] text-[#c0b8a8]">{t.value}</div>
                      <div className="text-[13px] text-[#555] mt-0.5">{t.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            <div className="mb-9 pb-9 border-b border-[#141414]">
              <div className="text-[10px] text-[#555] tracking-[0.16em] uppercase mb-4">Lokasi</div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0f0f0f] border border-[#1e1e1e] rounded-[7px] text-[13px] text-[#888] mb-3.5">
                <IconPin /> {ev.location}
              </div>
              <div className="rounded-[10px] overflow-hidden border border-[#1e1e1e] bg-[#141414]">
                <iframe src={`https://maps.google.com/maps?q=${encodeURIComponent(ev.location)}&output=embed&z=15&hl=id`}
                  width="100%" height="320" style={{border:"none",display:"block"}} loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade" title="Lokasi event" />
              </div>
            </div>

            {/* Organizer */}
            {org && (
              <div>
                <div className="text-[10px] text-[#555] tracking-[0.16em] uppercase mb-4">Diselenggarakan oleh</div>
                <div className="px-4 py-3.5 bg-[#0f0f0f] border border-[#1e1e1e] rounded-[7px]">
                  <div className="text-[10px] text-[#333] tracking-[0.16em] uppercase mb-1">Organizer</div>
                  <div className="text-[15px] text-[#c0b8a8]">{org.name}</div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-[88px]">
            <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-[14px] overflow-hidden">
              {/* Price head */}
              <div className="px-6 py-5 bg-[#141414] border-b border-[#1e1e1e]">
                <div className="text-[10px] text-[#555] tracking-[0.16em] uppercase mb-1.5">Harga Tiket</div>
                <div className={`font-[family-name:var(--font-serif)] text-[48px] font-light leading-none tracking-[-0.03em] ${isFree?"text-[#6aaa38]":"text-[#f0e8d8]"}`}>
                  {isFree ? "Gratis" : `Rp ${Number(ev.ticketPrice).toLocaleString("id-ID")}`}
                </div>
                {!isFree && <div className="text-[11px] text-[#333] mt-1">per tiket</div>}
                <div className="mt-2.5">
                  {isUp
                    ? <span className="inline-flex items-center gap-1.5 text-[10px] text-[#6aaa38] bg-[rgba(106,170,56,0.1)] border border-[rgba(106,170,56,0.3)] px-2.5 py-1 rounded tracking-[0.1em] uppercase"><span className="w-1.5 h-1.5 rounded-full bg-[#6aaa38]" />Pendaftaran dibuka</span>
                    : <span className="inline-flex items-center text-[10px] text-[#555] bg-white/[0.04] border border-[#252525] px-2.5 py-1 rounded tracking-[0.1em] uppercase">Event telah berakhir</span>
                  }
                </div>
              </div>

              {/* Details */}
              <div className="divide-y divide-[#0d0d0d]">
                {sideDetails.map((d,i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                    <div className="w-[30px] h-[30px] rounded-[7px] bg-white/[0.03] border border-[#141414] flex items-center justify-center text-[#555] shrink-0">{d.icon}</div>
                    <div>
                      <div className="text-[10px] text-[#333] tracking-[0.16em] uppercase mb-0.5">{d.label}</div>
                      <div className="text-[13px] text-[#c0b8a8] leading-[1.5]">{d.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="px-5 py-4 border-t border-[#1e1e1e] flex flex-col gap-2.5">
                {isUp ? (
                  <a href="#daftar"
                    className={`flex items-center justify-center gap-2.5 w-full py-4 rounded-[7px] text-[15px] tracking-widest uppercase no-underline transition-colors font-[family-name:var(--font-mono)] ${isFree?"bg-[rgba(106,170,56,0.12)] border border-[rgba(106,170,56,0.4)] text-[#6aaa38] hover:bg-[rgba(106,170,56,0.18)]":"bg-[#c9a060] text-[#0a0a0a] hover:bg-[#d4b070]"}`}>
                    {isFree ? "Daftar sekarang — gratis" : "Beli tiket"} <IconArrow />
                  </a>
                ) : (
                  <div className="flex items-center justify-center w-full py-4 bg-white/[0.03] border border-[#1e1e1e] rounded-[7px] text-[13px] text-[#555] tracking-[0.06em]">
                    Event ini sudah berakhir
                  </div>
                )}
                <ShareButton title={ev.title} />
              </div>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="max-w-[1100px] mx-auto px-10 pb-20">
            <div className="flex items-center gap-4 mb-6">
              <span className="font-[family-name:var(--font-serif)] text-2xl font-light text-[#f0e8d8]">Event <em className="italic text-[#c9a060]">serupa</em></span>
              <div className="flex-1 h-px bg-[#141414]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map(({ event: rev, category: rcat }) => {
                const price = Number(rev.ticketPrice);
                return (
                  <Link key={rev.id} href={`/jelajahi/${rev.id}`}
                    className="flex flex-col bg-[#0f0f0f] border border-[#1e1e1e] rounded-[10px] overflow-hidden no-underline hover:border-[#2e2e2e] hover:-translate-y-1 transition-all">
                    <div className="relative bg-[#1a1a1a]" style={{aspectRatio:"16/9"}}>
                      {rev.coverImage
                        ? <Image src={rev.coverImage} alt={rev.title} fill style={{objectFit:"cover"}} sizes="350px" />
                        : <div className="absolute inset-0 flex items-center justify-center text-3xl">{rcat?.emoji??"📅"}</div>
                      }
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="font-[family-name:var(--font-serif)] text-xl font-light text-[#f0e8d8] mb-2 leading-[1.3] line-clamp-2">{rev.title}</div>
                      <div className="text-[11px] text-[#555] mb-1">{fmtDT(new Date(rev.startDate))}</div>
                      <div className={`font-[family-name:var(--font-serif)] text-xl font-light mt-auto ${price===0?"text-[#6aaa38]":"text-[#888]"}`}>
                        {price===0?"Gratis":`Rp ${price.toLocaleString("id-ID")}`}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}