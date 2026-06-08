// src/app/(dashboard)/events/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { requireAuth } from "@/lib/auth-helper";
import { db } from "@/db";
import { events, categories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { TIER_CONFIG } from "@/lib/tiers";
import type { PricingTier } from "@/lib/tiers";
import { EditEventForm } from "./edit-event-form";
import { EventDetailActions } from "./event-detail-actions";

function fmtDate(d:Date){ return new Intl.DateTimeFormat("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(d); }
function fmtDT(d:Date)  { return new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(d); }
function fmtPrice(p:string|null){ const n=Number(p); if(!n) return "Gratis"; return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n); }
function getDur(s:Date,e:Date){ const ms=e.getTime()-s.getTime(); const h=Math.floor(ms/3600000); const m=Math.floor((ms%3600000)/60000); if(!h) return `${m} menit`; if(!m) return `${h} jam`; return `${h} jam ${m} menit`; }

function IconLeft()   { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><line x1="14" y1="8" x2="2" y2="8"/><polyline points="6 4 2 8 6 12"/></svg>; }
function IconPin()    { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M8 1.5A4.5 4.5 0 0 1 12.5 6C12.5 9.5 8 14.5 8 14.5S3.5 9.5 3.5 6A4.5 4.5 0 0 1 8 1.5z"/><circle cx="8" cy="6" r="1.5"/></svg>; }
function IconCal()    { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1.5" y="2.5" width="13" height="12" rx="2"/><line x1="1.5" y1="7" x2="14.5" y2="7"/><line x1="5" y1="1" x2="5" y2="4"/><line x1="11" y1="1" x2="11" y2="4"/></svg>; }
function IconClock()  { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="8" cy="8" r="6.5"/><polyline points="8 4 8 8 10.5 10"/></svg>; }
function IconUsers()  { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="6" cy="4.5" r="2.5"/><path d="M1 13.5c0-2.76 2.24-5 5-5s5 2.24 5 5"/><circle cx="12" cy="4.5" r="2"/><path d="M15 13.5c0-1.93-1.3-3.57-3-4.08"/></svg>; }
function IconTicket() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M1 6V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4z"/></svg>; }

interface Props { params: Promise<{id:string}>; }

export default async function EventDetailPage({ params }: Props) {
  const { id }  = await params;
  const session = await requireAuth();
  const uid     = session.user.id;
  const tier    = (session.user.pricingTier ?? "free") as PricingTier;
  const tc      = TIER_CONFIG[tier];

  const [row] = await db.select({ event: events, category: categories })
    .from(events).leftJoin(categories, eq(events.categoryId, categories.id))
    .where(and(eq(events.id, id), eq(events.userId, uid))).limit(1);
  if (!row) notFound();

  const { event: ev, category: cat } = row;
  const sd = new Date(ev.startDate); const ed = new Date(ev.endDate);
  const ca = new Date(ev.createdAt); const ua = new Date(ev.updatedAt);
  const isUp = sd > new Date();

  let gallery: string[] = [];
  if (ev.galleryImages) try { gallery = JSON.parse(ev.galleryImages); } catch {}

  const sBadge = ev.status==="published"
    ? "text-[#6aaa38] bg-[rgba(106,170,56,0.1)] border-[rgba(106,170,56,0.3)]"
    : ev.status==="cancelled"
    ? "text-[#e05a5a] bg-[rgba(224,90,90,0.08)] border-[rgba(224,90,90,0.25)]"
    : "text-[#555] bg-white/[0.04] border-[#252525]";
  const sLabel = ev.status==="published"?"Aktif":ev.status==="cancelled"?"Dibatalkan":"Draft";

  return (
    <div className="min-h-full bg-[#0a0a0a] font-[family-name:var(--font-mono)]">
      {/* Cover */}
      {ev.coverImage && (
        <div className="relative w-full max-h-[420px] overflow-hidden bg-[#111]" style={{aspectRatio:"16/9"}}>
          <Image src={ev.coverImage} alt={ev.title} fill style={{objectFit:"cover"}} sizes="100vw" priority />
        </div>
      )}

      {/* Hero */}
      <div className="relative bg-[#0f0f0f] border-b border-[#141414] px-12 pt-9 pb-8 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{background:"radial-gradient(ellipse 50% 80% at 80% 50%, rgba(180,140,80,0.05) 0%, transparent 70%)"}} />
        <div className="flex items-center gap-2 mb-6 text-[13px] text-[#333]">
          <Link href="/dashboard/events" className="flex items-center gap-1.5 text-[#333] no-underline hover:text-[#c9a060] transition-colors"><IconLeft /> Event Saya</Link>
          <span className="text-[#1e1e1e]">/</span>
          <span className="text-[#555]">Detail</span>
        </div>
        <div className="flex items-start justify-between gap-5 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-[#333] tracking-[0.16em] uppercase mb-2.5">Event · {ev.id.slice(0,8).toUpperCase()}</div>
            <h1 className="font-[family-name:var(--font-serif)] text-[clamp(24px,3vw,42px)] font-light text-[#f0e8d8] tracking-[-0.01em] leading-[1.15] mb-4">
              {ev.title.split(" ").length > 3
                ? <>{ev.title.split(" ").slice(0,-2).join(" ")} <em className="italic text-[#c9a060]">{ev.title.split(" ").slice(-2).join(" ")}</em></>
                : <em className="italic text-[#c9a060]">{ev.title}</em>
              }
            </h1>
            <div className="flex flex-wrap gap-2.5">
              {[
                { Icon: IconPin, text: ev.location },
                { Icon: IconCal, text: fmtDate(sd) },
                { Icon: IconClock, text: getDur(sd,ed) },
              ].map((item, i) => (
                <span key={i} className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/[0.04] border border-[#1e1e1e] rounded-[7px] text-[13px] text-[#888]">
                  <item.Icon />{item.text}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2.5 shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] tracking-[0.1em] uppercase rounded border ${sBadge}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />{sLabel}
            </span>
            {isUp && <div className="text-[10px] text-[#c9a060] tracking-[0.16em] uppercase px-3 py-1.5 bg-[rgba(201,160,96,0.07)] border border-[rgba(201,160,96,0.25)] rounded">Akan datang</div>}
            <EventDetailActions eventId={ev.id} status={ev.status??"draft"} canPublish={tc.canPublish} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px]">
        {/* Main */}
        <div className="px-12 py-9 border-r border-[#141414]">
          {cat && (
            <div className="mb-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(201,160,96,0.07)] border border-[rgba(201,160,96,0.25)] text-[11px] text-[#c9a060]">
                {cat.emoji} {cat.name}
              </span>
            </div>
          )}

          {/* Description */}
          <div className="mb-9 pb-9 border-b border-[#141414]">
            <div className="text-[10px] text-[#555] tracking-[0.16em] uppercase mb-4">Deskripsi</div>
            <p className="text-[15px] text-[#888] leading-[1.85]">{ev.description}</p>
          </div>

          {/* Gallery */}
          {gallery.length > 0 && (
            <div className="mb-9 pb-9 border-b border-[#141414]">
              <div className="text-[10px] text-[#555] tracking-[0.16em] uppercase mb-4">Galeri Foto</div>
              <div className="grid gap-2" style={{gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))"}}>
                {gallery.map((url,i) => (
                  <div key={i} className="relative rounded-[6px] overflow-hidden bg-[#1a1a1a]" style={{aspectRatio:"1/1"}}>
                    <Image src={url} alt={`Galeri ${i+1}`} fill style={{objectFit:"cover"}} sizes="140px" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info rows */}
          <div className="mb-9 pb-9 border-b border-[#141414]">
            <div className="text-[10px] text-[#555] tracking-[0.16em] uppercase mb-4">Detail Event</div>
            {[
              { ic:<IconPin />,    lbl:"Lokasi",   val:ev.location,           acc:false },
              { ic:<IconCal />,    lbl:"Mulai",    val:fmtDT(sd),             acc:true  },
              { ic:<IconCal />,    lbl:"Selesai",  val:fmtDT(ed),             acc:false },
              { ic:<IconClock />,  lbl:"Durasi",   val:getDur(sd,ed),         acc:false },
              ...(ev.capacity?[{ ic:<IconUsers />,lbl:"Kapasitas",val:`${ev.capacity.toLocaleString("id-ID")} orang`,acc:false }]:[]),
              { ic:<IconTicket />, lbl:"Harga",    val:fmtPrice(ev.ticketPrice), acc:Number(ev.ticketPrice)>0 },
            ].map((r,i) => (
              <div key={i} className="flex items-start gap-3.5 py-3.5 border-b border-[#0d0d0d] last:border-0">
                <div className={`w-[34px] h-[34px] rounded-[7px] border flex items-center justify-center shrink-0 ${r.acc?"text-[#c9a060] bg-[rgba(201,160,96,0.08)] border-[rgba(201,160,96,0.2)]":"text-[#555] bg-white/[0.02] border-[#141414]"}`}>{r.ic}</div>
                <div>
                  <div className="text-[10px] text-[#333] tracking-[0.16em] uppercase mb-0.5">{r.lbl}</div>
                  <div className={`text-[15px] ${r.acc?"text-[#c9a060]":"text-[#c0b8a8]"}`}>{r.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Edit form */}
          <div>
            <div className="text-[10px] text-[#555] tracking-[0.16em] uppercase mb-5">Edit Event</div>
            <EditEventForm event={ev} canUploadImages={tc.canUploadImages} maxGalleryPhotos={tc.maxGalleryPhotos} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="px-6 py-8">
          <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-[10px] overflow-hidden mb-3.5">
            <div className="px-4 py-3 bg-[#0a0a0a] border-b border-[#141414] text-[10px] text-[#333] tracking-[0.16em] uppercase">Ringkasan</div>
            {[
              { k:"Status",       v:sLabel,                                        vc: ev.status==="published"?"text-[#6aaa38]":"" },
              { k:"Harga tiket",  v:fmtPrice(ev.ticketPrice),                      vc: Number(ev.ticketPrice)>0?"text-[#c9a060]":"" },
              ...(ev.capacity?[{ k:"Kapasitas", v:`${ev.capacity.toLocaleString("id-ID")} orang`, vc:"" }]:[]),
              { k:"Tiket terjual",v:String(ev.ticketSold??0),                      vc:"" },
              { k:"Tier",         v:tc.label,                                       vc:"text-[#c9a060]" },
            ].map((r,i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-[#0d0d0d] last:border-0">
                <span className="text-[13px] text-[#333]">{r.k}</span>
                <span className={`text-[13px] text-right ${r.vc||"text-[#888]"}`}>{r.v}</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-[#333] leading-[1.8]">
            <div className="flex justify-between py-1.5 border-b border-[#0d0d0d]"><span>Dibuat</span><span>{fmtDT(ca)}</span></div>
            <div className="flex justify-between py-1.5"><span>Diperbarui</span><span>{fmtDT(ua)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}