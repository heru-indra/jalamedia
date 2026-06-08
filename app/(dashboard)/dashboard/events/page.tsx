// src/app/(dashboard)/events/page.tsx
import Link from "next/link";
import { requireAuth } from "@/lib/auth-helper";
import { db } from "@/db";
import { events, categories } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { TIER_CONFIG } from "@/lib/tiers";
import type { PricingTier } from "@/lib/tiers";
import { EventActions } from "./event-actions";

function fmtDate(d: Date) { return new Intl.DateTimeFormat("id-ID", { day:"numeric", month:"short", year:"numeric" }).format(d); }
function fmtPrice(p: string | null) { const n=Number(p); if(!n) return "Gratis"; return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n); }
function IconPlus() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>; }

interface Props { searchParams: Promise<{ category?: string; status?: string }>; }

export default async function EventsPage({ searchParams }: Props) {
  const { category: catSlug, status: sf } = await searchParams;
  const session = await requireAuth();
  const userId  = session.user.id;
  const tier    = (session.user.pricingTier ?? "free") as PricingTier;
  const tc      = TIER_CONFIG[tier];
  const allCats = await db.select().from(categories).orderBy(categories.name);
  const conds: ReturnType<typeof eq>[] = [eq(events.userId, userId)];
  if (catSlug) { const c = allCats.find(c => c.slug === catSlug); if(c) conds.push(eq(events.categoryId, c.id)); }
  if (sf && ["draft","published","cancelled"].includes(sf)) conds.push(eq(events.status, sf as "draft" | "published" | "cancelled"));
  const rows = await db.select({ event: events, category: categories }).from(events).leftJoin(categories, eq(events.categoryId, categories.id)).where(and(...conds)).orderBy(desc(events.createdAt));
  const all  = await db.select().from(events).where(eq(events.userId, userId));
  const atLimit  = tc.maxEvents !== 999 && all.length >= tc.maxEvents;
  const nPub = all.filter(e=>e.status==="published").length;
  const nDrf = all.filter(e=>e.status==="draft").length;
  const sCls = (s:string|null) => s==="published"?"text-[#6aaa38] bg-[rgba(106,170,56,0.1)] border-[rgba(106,170,56,0.3)]":s==="cancelled"?"text-[#e05a5a] bg-[rgba(224,90,90,0.08)] border-[rgba(224,90,90,0.25)]":"text-[#555] bg-white/[0.04] border-[#252525]";
  const sLbl = (s:string|null) => s==="published"?"Aktif":s==="cancelled"?"Batal":"Draft";

  return (
    <div className="min-h-full bg-[#0a0a0a] font-[family-name:var(--font-mono)] p-11">
      <div className="flex items-start justify-between mb-7 flex-wrap gap-4">
        <div>
          <div className="text-[10px] text-[#333] tracking-[0.16em] uppercase mb-1.5">Event Saya</div>
          <h1 className="font-[family-name:var(--font-serif)] text-[clamp(24px,3vw,42px)] font-light text-[#f0e8d8] tracking-[-0.01em]">Kelola <em className="italic text-[#c9a060]">Event</em></h1>
        </div>
        {!atLimit ? (
          <Link href="/dashboard/events/new" className="inline-flex items-center gap-2 px-5 py-3 bg-[#c9a060] rounded-[7px] text-[#0a0a0a] text-[13px] tracking-widest uppercase no-underline hover:bg-[#d4b070]"><IconPlus /> Buat Event</Link>
        ) : (
          <Link href="/dashboard/upgrade" className="px-4 py-2.5 bg-[rgba(201,160,96,0.07)] border border-[rgba(201,160,96,0.25)] rounded text-[#c9a060] text-[11px] tracking-widest uppercase no-underline text-xs">Upgrade untuk tambah event</Link>
        )}
      </div>

      {/* Summary */}
      <div className="flex mb-6 border border-[#141414] rounded-[7px] overflow-hidden">
        {[
          { n: all.length, l: "Total" },
          { n: nPub, l: "Aktif", c: "text-[#6aaa38]" },
          { n: nDrf, l: "Draft" },
          { n: tc.maxEvents === 999 ? "∞" : tc.maxEvents, l: "Batas", c: "text-[#c9a060]" },
        ].map((s, i) => (
          <div key={i} className="flex-1 px-5 py-4 bg-[#0f0f0f] border-r border-[#141414] last:border-0">
            <div className={`font-[family-name:var(--font-serif)] text-2xl font-light leading-none mb-1 ${s.c ?? "text-[#f0e8d8]"}`}>{s.n}</div>
            <div className="text-[10px] text-[#333] tracking-[0.16em] uppercase">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {[{k:"",l:"Semua",n:all.length},{k:"published",l:"Aktif",n:nPub},{k:"draft",l:"Draft",n:nDrf}].map(t=>(
          <Link key={t.k} href={t.k?`/dashboard/events?status=${t.k}${catSlug?`&category=${catSlug}`:""}`:`/dashboard/events${catSlug?`?category=${catSlug}`:""}`}
            className={`px-3.5 py-1.5 rounded-full text-[11px] tracking-[0.08em] no-underline border transition-all ${(sf??"")===t.k?"border-[#2e2e2e] text-[#f0e8d8] bg-white/[0.04]":"border-[#1e1e1e] text-[#555] hover:text-[#888] hover:border-[#252525]"}`}>
            {t.l} <span className="opacity-50 ml-1">{t.n}</span>
          </Link>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        <Link href={`/dashboard/events${sf?`?status=${sf}`:""}`} className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] tracking-[0.08em] no-underline border transition-all ${!catSlug?"border-[#c9a060] text-[#c9a060] bg-[rgba(201,160,96,0.07)]":"border-[#1e1e1e] text-[#555] hover:text-[#888]"}`}>
          Semua kategori
        </Link>
        {allCats.map(c=>(
          <Link key={c.id} href={`/dashboard/events?category=${c.slug}${sf?`&status=${sf}`:""}`}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] tracking-[0.08em] no-underline border transition-all ${catSlug===c.slug?"border-[#c9a060] text-[#c9a060] bg-[rgba(201,160,96,0.07)]":"border-[#1e1e1e] text-[#555] hover:text-[#888]"}`}>
            {c.emoji} {c.name}
          </Link>
        ))}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="py-16 text-center border border-[#141414] rounded-[10px] bg-[#0f0f0f]">
          <div className="text-4xl mb-4 opacity-50">📭</div>
          <div className="font-[family-name:var(--font-serif)] text-xl font-light text-[#555] mb-2">Tidak ada event</div>
          <p className="text-[13px] text-[#333] mb-6">Tidak ada event sesuai filter ini.</p>
        </div>
      ) : (
        <div className="bg-[#0f0f0f] border border-[#141414] rounded-[10px] overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_140px_120px_100px_120px] px-5 py-2.5 border-b border-[#141414] bg-[#0a0a0a]">
            {["Judul Event","Tanggal Mulai","Harga","Status","Aksi"].map(h=><span key={h} className="text-[10px] text-[#333] tracking-[0.16em] uppercase last:text-right">{h}</span>)}
          </div>
          {rows.map(({event:ev,category:cat})=>(
            <div key={ev.id} className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_140px_120px_100px_120px] px-5 items-center min-h-[76px] border-b border-[#0d0d0d] last:border-0 hover:bg-white/[0.015] transition-colors">
              <div className="py-4 min-w-0">
                <Link href={`/dashboard/events/${ev.id}`} className="block text-[15px] text-[#c0b8a8] truncate no-underline hover:text-[#f0e8d8] mb-1.5 transition-colors">{ev.title}</Link>
                {cat && <span className="inline-flex items-center gap-1 px-2 py-px text-[10px] bg-white/[0.04] border border-[#1e1e1e] rounded-full text-[#555]">{cat.emoji} {cat.name}</span>}
              </div>
              <div className="hidden md:block text-[11px] text-[#333]">{fmtDate(new Date(ev.startDate))}</div>
              <div className="hidden md:block text-[11px] text-[#555]">{fmtPrice(ev.ticketPrice)}</div>
              <div className="hidden md:flex"><span className={`inline-flex items-center px-2.5 py-1 text-[10px] tracking-[0.1em] uppercase rounded border ${sCls(ev.status)}`}>{sLbl(ev.status)}</span></div>
              <div className="flex justify-end"><EventActions eventId={ev.id} status={ev.status??"draft"} canPublish={tc.canPublish} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}