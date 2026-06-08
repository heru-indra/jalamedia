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
  const sCls = (s:string|null) => s==="published"?"text-green-600 bg-green-600/10 border-green-600/30":s==="cancelled"?"text-red-500 bg-red-500/10 border-red-500/30":"text-muted-foreground bg-muted/10 border-muted";
  const sLbl = (s:string|null) => s==="published"?"Aktif":s==="cancelled"?"Batal":"Draft";

  return (
    <div className="min-h-full bg-background font-mono p-11">
      <div className="flex items-start justify-between mb-7 flex-wrap gap-4">
        <div>
          <div className="text-xs text-muted-foreground tracking-widest uppercase mb-1.5">Event Saya</div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-foreground">Kelola <em className="italic text-accent">Event</em></h1>
        </div>
        {!atLimit ? (
          <Link href="/dashboard/events/new" className="inline-flex items-center gap-2 px-5 py-3 bg-accent rounded-lg text-background text-xs tracking-widest uppercase no-underline hover:bg-accent/90 transition-colors"><IconPlus /> Buat Event</Link>
        ) : (
          <Link href="/dashboard/upgrade" className="px-4 py-2.5 bg-accent/10 border border-accent/30 rounded text-accent text-xs tracking-widest uppercase no-underline">Upgrade untuk tambah event</Link>
        )}
      </div>

      {/* Summary */}
      <div className="flex mb-6 border border-muted rounded-lg overflow-hidden">
        {[
          { n: all.length, l: "Total" },
          { n: nPub, l: "Aktif", c: "text-green-600" },
          { n: nDrf, l: "Draft" },
          { n: tc.maxEvents === 999 ? "∞" : tc.maxEvents, l: "Batas", c: "text-accent" },
        ].map((s, i) => (
          <div key={i} className="flex-1 px-5 py-4 bg-muted/20 border-r border-muted last:border-0">
            <div className={`font-serif text-2xl font-light leading-none mb-1 ${s.c ?? "text-foreground"}`}>{s.n}</div>
            <div className="text-xs text-muted-foreground tracking-widest uppercase">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {[{k:"",l:"Semua",n:all.length},{k:"published",l:"Aktif",n:nPub},{k:"draft",l:"Draft",n:nDrf}].map(t=>(
          <Link key={t.k} href={t.k?`/dashboard/events?status=${t.k}${catSlug?`&category=${catSlug}`:""}`:`/dashboard/events${catSlug?`?category=${catSlug}`:""}`}
            className={`px-3.5 py-1.5 rounded-full text-xs tracking-widest no-underline border transition-all ${(sf??"")===t.k?"border-muted text-foreground bg-muted/10":"border-muted/50 text-muted-foreground hover:text-muted hover:border-muted"}`}>
            {t.l} <span className="opacity-50 ml-1">{t.n}</span>
          </Link>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        <Link href={`/dashboard/events${sf?`?status=${sf}`:""}`} className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs tracking-widest no-underline border transition-all ${!catSlug?"border-accent text-accent bg-accent/10":"border-muted/50 text-muted-foreground hover:text-muted"}`}>
          Semua kategori
        </Link>
        {allCats.map(c=>(
          <Link key={c.id} href={`/dashboard/events?category=${c.slug}${sf?`&status=${sf}`:""}`}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs tracking-widest no-underline border transition-all ${catSlug===c.slug?"border-accent text-accent bg-accent/10":"border-muted/50 text-muted-foreground hover:text-muted"}`}>
            {c.emoji} {c.name}
          </Link>
        ))}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="py-16 text-center border border-muted rounded-xl bg-muted/20">
          <div className="text-4xl mb-4 opacity-50">📭</div>
          <div className="font-serif text-xl font-light text-muted-foreground mb-2">Tidak ada event</div>
          <p className="text-sm text-muted mb-6">Tidak ada event sesuai filter ini.</p>
        </div>
      ) : (
        <div className="bg-muted/20 border border-muted rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_140px_120px_100px_120px] px-5 py-2.5 border-b border-muted bg-background">
            {["Judul Event","Tanggal Mulai","Harga","Status","Aksi"].map(h=><span key={h} className="text-xs text-muted tracking-widest uppercase last:text-right">{h}</span>)}
          </div>
          {rows.map(({event:ev,category:cat})=>(
            <div key={ev.id} className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_140px_120px_100px_120px] px-5 items-center min-h-[76px] border-b border-muted/50 last:border-0 hover:bg-white/5 transition-colors">
              <div className="py-4 min-w-0">
                <Link href={`/dashboard/events/${ev.id}`} className="block text-base text-foreground/80 truncate no-underline hover:text-foreground mb-1.5 transition-colors">{ev.title}</Link>
                {cat && <span className="inline-flex items-center gap-1 px-2 py-px text-xs bg-muted/10 border border-muted/50 rounded-full text-muted-foreground">{cat.emoji} {cat.name}</span>}
              </div>
              <div className="hidden md:block text-xs text-muted">{fmtDate(new Date(ev.startDate))}</div>
              <div className="hidden md:block text-xs text-muted-foreground">{fmtPrice(ev.ticketPrice)}</div>
              <div className="hidden md:flex"><span className={`inline-flex items-center px-2.5 py-1 text-xs tracking-widest uppercase rounded border ${sCls(ev.status)}`}>{sLbl(ev.status)}</span></div>
              <div className="flex justify-end"><EventActions eventId={ev.id} status={ev.status??"draft"} canPublish={tc.canPublish} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
