// src/app/(dashboard)/dashboard/page.tsx
import Link from "next/link";
import { requireAuth } from "@/lib/auth-helper";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { TIER_CONFIG } from "@/lib/tiers";
import type { PricingTier } from "@/lib/tiers";

function fmtDate(d: Date) { return new Intl.DateTimeFormat("id-ID", { day:"numeric", month:"short", year:"numeric" }).format(d); }
function fmtPrice(p: string | null) {
  const n = Number(p);
  if (!n) return "Gratis";
  return new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
}

function IconCal()   { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1.5" y="2.5" width="13" height="12" rx="2"/><line x1="1.5" y1="7" x2="14.5" y2="7"/><line x1="5" y1="1" x2="5" y2="4"/><line x1="11" y1="1" x2="11" y2="4"/></svg>; }
function IconCheck() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="2.5 8.5 6 12 13.5 4"/></svg>; }
function IconDraft() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M3 12.5V14h1.5l8-8-1.5-1.5-8 8zM13.5 4l-1.5-1.5 1-1L14.5 3l-1 1z"/></svg>; }
function IconMoney() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1" y="4" width="14" height="9" rx="2"/><path d="M1 7h14"/><circle cx="8" cy="10.5" r="1.5"/></svg>; }
function IconPlus()  { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>; }
function IconArrow() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="2" y1="8" x2="14" y2="8"/><polyline points="9 3 14 8 9 13"/></svg>; }

export default async function DashboardPage() {
  const session  = await requireAuth();
  const userId   = session.user.id;
  const tier     = (session.user.pricingTier ?? "free") as PricingTier;
  const tc       = TIER_CONFIG[tier];
  const firstName = session.user.name.split(" ")[0];
  const allEvents = await db.select().from(events).where(eq(events.userId, userId)).orderBy(desc(events.createdAt));
  const published = allEvents.filter(e => e.status === "published");
  const drafts    = allEvents.filter(e => e.status === "draft");
  const upcoming  = allEvents.filter(e => e.status === "published" && new Date(e.startDate) > new Date());
  const recent    = allEvents.slice(0, 5);
  const totalRev  = published.reduce((s, e) => s + (Number(e.ticketPrice) * (e.ticketSold ?? 0)), 0);
  const atLimit   = tc.maxEvents !== 999 && allEvents.length >= tc.maxEvents;

  const statusCls  = (s: string | null) => s === "published" ? "text-green-600 bg-green-600/10 border-green-600/30" : s === "cancelled" ? "text-red-500 bg-red-500/10 border-red-500/30" : "text-muted-foreground bg-muted/10 border-muted";
  const statusLbl  = (s: string | null) => s === "published" ? "Aktif" : s === "cancelled" ? "Batal" : "Draft";

  return (
    <div className="min-h-full bg-background font-mono p-11">
      <div className="flex items-start justify-between mb-9 flex-wrap gap-4">
        <div>
          <div className="text-xs text-muted-foreground tracking-widest uppercase mb-1.5">Dashboard</div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-foreground">
            Halo, <em className="italic text-accent">{firstName}</em>
          </h1>
        </div>
        <Link href="/dashboard/events/new" className="inline-flex items-center gap-2 px-5 py-3 bg-accent rounded-lg text-background text-xs tracking-widest uppercase no-underline hover:bg-accent/90 transition-colors">
          <IconPlus /> Buat Event
        </Link>
      </div>

      {atLimit && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-accent/10 border border-accent/30 rounded-lg mb-5 text-xs text-accent">
          ⚠ Batas {tc.maxEvents} event. <a href="/dashboard/upgrade" className="text-accent/80 underline underline-offset-2 ml-1">Upgrade</a>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-9">
        {[
          { icon:<IconCal />,   num:allEvents.length,   lbl:"Total Event", sub:tc.maxEvents===999?"Tidak terbatas":`Maks ${tc.maxEvents}`, top:"border-t-accent", ic:"bg-accent/10 border-accent/30 text-accent", nc:"text-accent" },
          { icon:<IconCheck />, num:published.length,   lbl:"Dipublish",   sub:`${upcoming.length} akan datang`,                            top:"border-t-green-600", ic:"bg-green-600/10 border-green-600/30 text-green-600",  nc:"text-green-600" },
          { icon:<IconDraft />, num:drafts.length,      lbl:"Draft",       sub:"Belum dipublish",                                           top:"border-t-muted", ic:"bg-muted/10 border-muted/20 text-muted-foreground",      nc:"text-muted-foreground" },
          { icon:<IconMoney />, num:totalRev>0?`Rp ${Math.round(totalRev/1000)}K`:"—", lbl:"Pendapatan", sub:"Dari tiket terjual",          top:"border-t-accent", ic:"bg-accent/10 border-accent/20 text-accent/70", nc:"text-accent" },
        ].map((s, i) => (
          <div key={i} className={`bg-muted/20 border border-muted rounded-xl p-6 border-t-2 ${s.top}`}>
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-4 ${s.ic}`}>{s.icon}</div>
            <div className={`font-serif text-4xl font-light leading-none mb-1 ${s.nc}`}>{s.num}</div>
            <div className="text-base text-muted-foreground mb-1">{s.lbl}</div>
            <div className="text-xs text-muted">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-muted tracking-widest uppercase">Event Terbaru</div>
        <Link href="/dashboard/events" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground tracking-widest uppercase no-underline hover:text-accent transition-colors">Lihat semua <IconArrow /></Link>
      </div>

      {recent.length === 0 ? (
        <div className="py-16 text-center border border-muted rounded-xl bg-muted/20">
          <div className="text-4xl mb-4 opacity-50">📅</div>
          <div className="font-serif text-xl font-light text-muted-foreground mb-2">Belum ada event</div>
          <p className="text-sm text-muted mb-6">Mulai buat event pertama Anda.</p>
          <Link href="/dashboard/events/new" className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 rounded text-accent text-xs tracking-widest uppercase no-underline"><IconPlus /> Buat Event</Link>
        </div>
      ) : (
        <div className="bg-muted/20 border border-muted rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_140px_120px_110px] px-5 py-2.5 border-b border-muted bg-background">
            {["Judul","Tanggal","Harga","Status"].map(h => <span key={h} className="text-xs text-muted tracking-widest uppercase last:text-right">{h}</span>)}
          </div>
          {recent.map(ev => (
            <div key={ev.id} className="grid grid-cols-[1fr_140px_120px_110px] px-5 items-center min-h-[76px] border-b border-muted/50 last:border-0 hover:bg-white/5 transition-colors">
              <div className="py-4 min-w-0">
                <Link href={`/dashboard/events/${ev.id}`} className="block text-base text-foreground/80 truncate no-underline hover:text-foreground mb-1 transition-colors">{ev.title}</Link>
              </div>
              <div className="text-xs text-muted">{fmtDate(new Date(ev.startDate))}</div>
              <div className="text-xs text-muted-foreground">{fmtPrice(ev.ticketPrice)}</div>
              <div className="flex justify-end">
                <span className={`inline-flex items-center px-2.5 py-1 text-xs tracking-widest uppercase rounded border ${statusCls(ev.status)}`}>{statusLbl(ev.status)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
