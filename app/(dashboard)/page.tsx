import Link from "next/link";
import { requireAuth } from "@/lib/auth-helper";
import { db } from "@/db";
import { events, categories } from "@/db/schema";
import { eq, desc, count as drizzleCount, and } from "drizzle-orm";
import { TIER_LIMITS } from "@/lib/tiers";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatRelative(date: Date) {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hari ini";
  if (days === 1) return "Kemarin";
  if (days < 7)  return `${days} hari lalu`;
  return formatDate(date);
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <rect x="2" y="3" width="16" height="15" rx="2.5" />
      <line x1="2" y1="8.5" x2="18" y2="8.5" />
      <line x1="6.5" y1="1.5" x2="6.5" y2="5.5" />
      <line x1="13.5" y1="1.5" x2="13.5" y2="5.5" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="10" cy="10" r="8" />
      <polyline points="6.5 10 9 12.5 13.5 7.5" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="10" cy="10" r="8" />
      <polyline points="10 5.5 10 10 13 12" />
    </svg>
  );
}

function IconTrendUp() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <polyline points="2 14 7.5 8.5 11 12 18 5" />
      <polyline points="13 5 18 5 18 10" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="8" y1="2" x2="8" y2="14" />
      <line x1="2" y1="8" x2="14" y2="8" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <line x1="2" y1="7.5" x2="13" y2="7.5" />
      <polyline points="9 3.5 13 7.5 9 11.5" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M6.5 1a4 4 0 0 1 4 4C10.5 8.5 6.5 12 6.5 12S2.5 8.5 2.5 5A4 4 0 0 1 6.5 1z" />
      <circle cx="6.5" cy="5" r="1.4" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <polyline points="10 2 4.5 10 9 10 8 16 13.5 8 9 8 10 2" />
    </svg>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    draft:     { label: "Draft",      color: "#888",    bg: "rgba(255,255,255,0.06)", border: "#2a2a2a" },
    published: { label: "Aktif",      color: "#6aaa38", bg: "rgba(106,170,56,0.12)", border: "rgba(106,170,56,0.3)" },
    cancelled: { label: "Batal",      color: "#e05a5a", bg: "rgba(224,90,90,0.12)",  border: "rgba(224,90,90,0.3)" },
  };
  const s = map[status] ?? map.draft;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "4px 10px",
      borderRadius: "4px",
      border: `1px solid ${s.border}`,
      fontSize: "11px",
      fontWeight: 400,
      letterSpacing: "0.06em",
      textTransform: "uppercase" as const,
      color: s.color,
      background: s.bg,
      fontFamily: "'DM Mono', monospace",
      whiteSpace: "nowrap" as const,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await requireAuth();
  const userId  = session.user.id;
  const tier    = (session.user.pricingTier ?? "free") as "free" | "basic" | "pro";
  const limits  = TIER_LIMITS[tier];

  const [
    [{ eventTotal }],
    [{ eventPublished }],
    [{ eventDraft }],
    recentEvents,
  ] = await Promise.all([
    db.select({ eventTotal:     drizzleCount() }).from(events).where(eq(events.userId, userId)),
    db.select({ eventPublished: drizzleCount() }).from(events).where(and(eq(events.userId, userId), eq(events.status, "published"))),
    db.select({ eventDraft:     drizzleCount() }).from(events).where(and(eq(events.userId, userId), eq(events.status, "draft"))),
    db.select({
        event:    events,
        category: categories,
      })
      .from(events)
      .leftJoin(categories, eq(events.categoryId, categories.id))
      .where(eq(events.userId, userId))
      .orderBy(desc(events.createdAt))
      .limit(5),
  ]);

  const usagePercent = limits.maxEvents >= 999
    ? 0
    : Math.min(100, Math.round((Number(eventTotal) / limits.maxEvents) * 100));

  const tierLabel = { free: "Free", basic: "Basic", pro: "Pro" }[tier];
  const tierColor = { free: "#888", basic: "#6aaa38", pro: "#c9a060" }[tier];
  const tierBg    = { free: "rgba(255,255,255,0.04)", basic: "rgba(106,170,56,0.1)", pro: "rgba(201,160,96,0.1)" }[tier];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Selamat pagi";
    if (h < 17) return "Selamat siang";
    return "Selamat malam";
  })();

  const firstName = session.user.name.split(" ")[0];

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-12 py-11 font-mono">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-6 mb-11">
        <div>
          <div className="text-xs text-[#888] tracking-widest uppercase mb-2">{greeting}</div>
          <h1 className="font-serif text-5xl font-light text-[#f5f0e8] tracking-tight leading-tight">
            {firstName},&nbsp;
            <em className="italic text-[#d4b070]">apa yang ingin</em> Anda buat?
          </h1>
        </div>
        <Link href="/dashboard/events/new" className="inline-flex items-center gap-2 px-6 py-3 bg-[#d4b070] rounded-lg text-[#0a0a0a] text-xs font-mono font-semibold tracking-widest uppercase transition-colors hover:bg-[#e0bb80] active:scale-95 flex-shrink-0 whitespace-nowrap">
          <IconPlus />
          Buat Event
        </Link>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-4 gap-3 mb-10 lg:grid-cols-2 md:grid-cols-2">

        {/* Total event */}
        <div
          className="bg-[#111] border-2 border-[#1e1e1e] rounded-xl p-6 relative overflow-hidden transition-all hover:border-[#2a2a2a] hover:shadow-lg hover:-translate-y-0.5 group"
          style={{
            "--card-accent": "#d4b070",
            "--icon-color":  "#d4b070",
            "--icon-bg":     "rgba(212,176,112,0.12)",
            "--icon-border": "rgba(212,176,112,0.25)",
          } as React.CSSProperties}
        >
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `linear-gradient(135deg, transparent, var(--card-accent, #1e1e1e) 50%, transparent)`
          }} />
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-[rgba(212,176,112,0.12)] border border-[rgba(212,176,112,0.25)] flex items-center justify-center text-[#d4b070] mb-5"><IconCalendar /></div>
            <div className="font-serif text-6xl font-light text-[#f5f0e8] leading-none mb-2">{eventTotal.toString()}</div>
            <div className="text-xs text-[#bbb] tracking-widest uppercase mb-1 font-semibold">Total Event</div>
            {limits.maxEvents < 999 ? (
              <>
                <div className="text-xs text-[#888]">Batas {limits.maxEvents} event</div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${usagePercent > 85 ? "bg-[#e06060]" : "bg-[#d4b070]"}`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#888] w-8 text-right">{usagePercent}%</span>
                </div>
              </>
            ) : (
              <div className="text-xs text-[#888]">Tidak terbatas</div>
            )}
          </div>
        </div>

        {/* Published */}
        <div
          className="bg-[#111] border-2 border-[#1e1e1e] rounded-xl p-6 relative overflow-hidden transition-all hover:border-[#2a2a2a] hover:shadow-lg hover:-translate-y-0.5"
          style={{
            "--card-accent": "#7acc3f",
            "--icon-color":  "#7acc3f",
            "--icon-bg":     "rgba(122,204,63,0.12)",
            "--icon-border": "rgba(122,204,63,0.25)",
          } as React.CSSProperties}
        >
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `linear-gradient(135deg, transparent, var(--card-accent, #1e1e1e) 50%, transparent)`
          }} />
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-[rgba(122,204,63,0.12)] border border-[rgba(122,204,63,0.25)] flex items-center justify-center text-[#7acc3f] mb-5"><IconCheckCircle /></div>
            <div className="font-serif text-6xl font-light text-[#f5f0e8] leading-none mb-2">{eventPublished.toString()}</div>
            <div className="text-xs text-[#bbb] tracking-widest uppercase mb-1 font-semibold">Dipublikasi</div>
            <div className="text-xs text-[#888]">Event aktif &amp; publik</div>
          </div>
        </div>

        {/* Draft */}
        <div
          className="bg-[#111] border-2 border-[#1e1e1e] rounded-xl p-6 relative overflow-hidden transition-all hover:border-[#2a2a2a] hover:shadow-lg hover:-translate-y-0.5"
          style={{
            "--card-accent": "#666",
            "--icon-color":  "#999",
            "--icon-bg":     "rgba(255,255,255,0.08)",
            "--icon-border": "#2a2a2a",
          } as React.CSSProperties}
        >
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `linear-gradient(135deg, transparent, var(--card-accent, #1e1e1e) 50%, transparent)`
          }} />
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,0.08)] border border-[#2a2a2a] flex items-center justify-center text-[#999] mb-5"><IconClock /></div>
            <div className="font-serif text-6xl font-light text-[#f5f0e8] leading-none mb-2">{eventDraft.toString()}</div>
            <div className="text-xs text-[#bbb] tracking-widest uppercase mb-1 font-semibold">Draft</div>
            <div className="text-xs text-[#888]">Belum dipublikasi</div>
          </div>
        </div>

        {/* Tier */}
        <div
          className="bg-[#111] border-2 border-[#1e1e1e] rounded-xl p-6 relative overflow-hidden transition-all hover:border-[#2a2a2a] hover:shadow-lg hover:-translate-y-0.5"
          style={{
            "--card-accent": tierColor,
            "--icon-color":  tierColor,
            "--icon-bg":     tierBg,
            "--icon-border": `${tierColor}40`,
          } as React.CSSProperties}
        >
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `linear-gradient(135deg, transparent, var(--card-accent, #1e1e1e) 50%, transparent)`
          }} />
          <div className="relative">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-5" style={{
              background: `var(--icon-bg)`,
              border: `1px solid var(--icon-border)`,
              color: `var(--icon-color)`,
            }}><IconTrendUp /></div>
            <div className="font-serif text-6xl font-light leading-none mb-2" style={{ color: tierColor }}>{tierLabel}</div>
            <div className="text-xs text-[#bbb] tracking-widest uppercase mb-1 font-semibold">Paket Aktif</div>
            <div className="text-xs text-[#888]">
              {tier === "free"  && "3 event · tanpa publish"}
              {tier === "basic" && "20 event · publish aktif"}
              {tier === "pro"   && "Tak terbatas · featured"}
            </div>
          </div>
        </div>

      </div>

      {/* ── Body ── */}
      <div className="grid grid-cols-[1fr_380px] gap-4 lg:grid-cols-1">

        {/* Recent events */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a] bg-[#0d0d0d]">
            <span className="text-xs text-[#d0d0d0] tracking-widest uppercase font-semibold">Event Terbaru</span>
            <Link href="/dashboard/events" className="inline-flex items-center gap-1.5 text-xs text-[#d4b070] hover:text-[#e0bb80] transition-colors">
              Lihat semua <IconArrowRight />
            </Link>
          </div>

          {recentEvents.length === 0 ? (
            <div className="py-14 px-6 text-center">
              <div className="w-14 h-14 border border-[#2a2a2a] rounded-lg flex items-center justify-center mx-auto mb-5 text-[#888]"><IconCalendar /></div>
              <div className="font-serif text-2xl font-light text-[#ccc] mb-2">Belum ada event</div>
              <div className="text-xs text-[#777] leading-relaxed mb-6">
                Buat event pertama Anda dan mulai<br />bagikan ke audiens yang lebih luas.
              </div>
              <Link href="/dashboard/events/new" className="inline-flex items-center gap-2 px-4 py-2 border border-[#2a2a2a] rounded-lg text-xs text-[#d4b070] hover:border-[#d4b070] hover:bg-[rgba(212,176,112,0.05)] transition-colors">
                <IconPlus /> Buat event pertama
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#1a1a1a]">
              {recentEvents.map(({ event: ev, category }) => {
                const d = new Date(ev.startDate);
                return (
                  <Link
                    key={ev.id}
                    href={`/dashboard/events/${ev.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                  >
                    <div className="w-12 h-14 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                      <div className="font-serif text-2xl font-light text-[#f5f0e8]">{d.getDate()}</div>
                      <div className="text-xs text-[#888] tracking-widest uppercase">
                        {d.toLocaleDateString("id-ID", { month: "short" })}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#e8e0d0] font-medium truncate mb-1">{ev.title}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#999]">
                          <IconMapPin />
                          {ev.location.length > 28
                            ? ev.location.slice(0, 28) + "…"
                            : ev.location}
                        </span>
                        {category && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[rgba(255,255,255,0.06)] border border-[#2a2a2a] text-[#999]">
                            {category.emoji} {category.name}
                          </span>
                        )}
                        {Number(ev.ticketPrice) > 0 && (
                          <span className="text-xs text-[#d4b070] font-semibold">
                            Rp {Number(ev.ticketPrice).toLocaleString("id-ID")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <StatusBadge status={ev.status ?? "draft"} />
                      <span className="text-xs text-[#666]">
                        {formatRelative(new Date(ev.createdAt))}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Tier card */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{
              background: `linear-gradient(135deg, transparent, ${tierColor}20 50%, transparent)`
            }} />
            <div className="relative">
              <div className="text-xs text-[#888] tracking-widest uppercase font-semibold mb-3">Paket Anda</div>
              <div className="font-serif text-4xl font-light leading-none mb-5" style={{ color: tierColor }}>
                {tierLabel}
              </div>
              <div className="flex flex-col gap-0 mb-5">
                <div className={`flex items-center gap-2.5 py-1.5 text-xs ${limits.maxEvents >= 999 || Number(eventTotal) < limits.maxEvents ? "text-[#d0d0d0]" : "text-[#666]"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${limits.maxEvents >= 999 || Number(eventTotal) < limits.maxEvents ? "bg-[#d4b070]" : "bg-[#2a2a2a]"}`} />
                  {limits.maxEvents >= 999
                    ? "Event tak terbatas"
                    : `${eventTotal} / ${limits.maxEvents} event`}
                </div>
                <div className={`flex items-center gap-2.5 py-1.5 text-xs ${limits.canPublish ? "text-[#d0d0d0]" : "text-[#666]"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${limits.canPublish ? "bg-[#d4b070]" : "bg-[#2a2a2a]"}`} />
                  Publish &amp; promosi event
                </div>
                <div className={`flex items-center gap-2.5 py-1.5 text-xs ${limits.featured ? "text-[#d0d0d0]" : "text-[#666]"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${limits.featured ? "bg-[#d4b070]" : "bg-[#2a2a2a]"}`} />
                  Featured di homepage
                </div>
              </div>
              {tier !== "pro" && (
                <Link href="/dashboard/upgrade" className="block w-full px-4 py-2.5 text-center text-xs tracking-widest uppercase font-semibold text-[#d4b070] border border-[#2a2a2a] rounded-lg hover:border-[#d4b070] hover:bg-[rgba(212,176,112,0.06)] transition-colors">
                  Upgrade paket →
                </Link>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1a1a1a] bg-[#0d0d0d]">
              <span className="text-xs text-[#d0d0d0] tracking-widest uppercase font-semibold">Aksi Cepat</span>
            </div>

            <div className="divide-y divide-[#1a1a1a]">
              <Link href="/dashboard/events/new" className="flex items-center gap-3.5 px-6 py-3.5 hover:bg-[rgba(255,255,255,0.04)] transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-[rgba(255,255,255,0.06)] border border-[#2a2a2a] flex items-center justify-center text-[#999] group-hover:text-[#d4b070] group-hover:border-[#d4b070] group-hover:bg-[rgba(212,176,112,0.08)] transition-colors flex-shrink-0"><IconPlus /></div>
                <div className="flex-1">
                  <div className="text-xs text-[#d0d0d0] font-semibold mb-0.5 group-hover:text-[#e8e0d0] transition-colors">Buat Event Baru</div>
                  <div className="text-xs text-[#888]">Draft siap diedit</div>
                </div>
                <span className="text-[#666] group-hover:text-[#d4b070] transition-colors flex-shrink-0"><IconArrowRight /></span>
              </Link>

              <Link href="/dashboard/events" className="flex items-center gap-3.5 px-6 py-3.5 hover:bg-[rgba(255,255,255,0.04)] transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-[rgba(255,255,255,0.06)] border border-[#2a2a2a] flex items-center justify-center text-[#999] group-hover:text-[#d4b070] group-hover:border-[#d4b070] group-hover:bg-[rgba(212,176,112,0.08)] transition-colors flex-shrink-0"><IconCalendar /></div>
                <div className="flex-1">
                  <div className="text-xs text-[#d0d0d0] font-semibold mb-0.5 group-hover:text-[#e8e0d0] transition-colors">Kelola Event</div>
                  <div className="text-xs text-[#888]">Edit, publish, atau hapus</div>
                </div>
                <span className="text-[#666] group-hover:text-[#d4b070] transition-colors flex-shrink-0"><IconArrowRight /></span>
              </Link>

              <Link href="/dashboard/analytics" className="flex items-center gap-3.5 px-6 py-3.5 hover:bg-[rgba(255,255,255,0.04)] transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-[rgba(255,255,255,0.06)] border border-[#2a2a2a] flex items-center justify-center text-[#999] group-hover:text-[#d4b070] group-hover:border-[#d4b070] group-hover:bg-[rgba(212,176,112,0.08)] transition-colors flex-shrink-0"><IconTrendUp /></div>
                <div className="flex-1">
                  <div className="text-xs text-[#d0d0d0] font-semibold mb-0.5 group-hover:text-[#e8e0d0] transition-colors">Lihat Analitik</div>
                  <div className="text-xs text-[#888]">Performa event Anda</div>
                </div>
                <span className="text-[#666] group-hover:text-[#d4b070] transition-colors flex-shrink-0"><IconArrowRight /></span>
              </Link>

              {tier === "free" && (
                <Link href="/dashboard/upgrade" className="flex items-center gap-3.5 px-6 py-3.5 hover:bg-[rgba(212,176,112,0.08)] transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-[rgba(212,176,112,0.12)] border border-[rgba(212,176,112,0.25)] flex items-center justify-center text-[#d4b070] group-hover:bg-[rgba(212,176,112,0.16)] transition-colors flex-shrink-0">
                    <IconZap />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-[#d4b070] font-semibold mb-0.5 group-hover:text-[#e0bb80] transition-colors">
                      Upgrade Paket
                    </div>
                    <div className="text-xs text-[#888]">Buka fitur publish</div>
                  </div>
                  <span className="text-[#d4b070] group-hover:text-[#e0bb80] transition-colors flex-shrink-0"><IconArrowRight /></span>
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
