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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@300;400&display=swap');

        /* ── Base ── */
        .dash {
          min-height: 100%;
          background: #0d0d0d;
          padding: 44px 48px;
          font-family: 'DM Mono', monospace;
        }

        /* ── Header ── */
        .dash-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 44px;
          gap: 24px;
        }
        .dash-greeting {
          font-size: 13px;
          color: #666;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .dash-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 44px;
          font-weight: 300;
          color: #f0e8d8;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }
        .dash-title em {
          font-style: italic;
          color: #c9a060;
        }
        .dash-new-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 13px 24px;
          background: #c9a060;
          border: none;
          border-radius: 6px;
          color: #0d0d0d;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .dash-new-btn:hover  { background: #d4b070; }
        .dash-new-btn:active { transform: scale(0.98); }

        /* ── Stats grid ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 40px;
        }
        .stat-card {
          background: #141414;
          border: 1px solid #222;
          border-radius: 10px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s, transform 0.15s;
        }
        .stat-card:hover {
          border-color: #333;
          transform: translateY(-1px);
        }
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(to right, transparent, var(--card-accent, #222), transparent);
        }
        .stat-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          color: var(--icon-color, #555);
          background: var(--icon-bg, rgba(255,255,255,0.04));
          border: 1px solid var(--icon-border, #222);
        }
        .stat-number {
          font-family: 'Cormorant Garamond', serif;
          font-size: 48px;
          font-weight: 300;
          color: #f0e8d8;
          line-height: 1;
          margin-bottom: 8px;
          letter-spacing: -0.03em;
        }
        .stat-number.colored {
          color: var(--icon-color, #f0e8d8);
        }
        .stat-name {
          font-size: 13px;
          color: #888;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .stat-desc {
          font-size: 12px;
          color: #555;
          letter-spacing: 0.02em;
        }
        .usage-wrap {
          margin-top: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .usage-track {
          flex: 1;
          height: 3px;
          background: #222;
          border-radius: 3px;
          overflow: hidden;
        }
        .usage-bar {
          height: 100%;
          border-radius: 3px;
          background: #c9a060;
          transition: width 0.5s ease;
        }
        .usage-bar.warn { background: #e05a5a; }
        .usage-pct {
          font-size: 11px;
          color: #555;
          white-space: nowrap;
          letter-spacing: 0.04em;
        }

        /* ── Two-col layout ── */
        .dash-body {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 16px;
          align-items: start;
        }

        /* ── Card shell ── */
        .card {
          background: #141414;
          border: 1px solid #222;
          border-radius: 10px;
          overflow: hidden;
        }
        .card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #1a1a1a;
        }
        .card-title {
          font-size: 13px;
          color: #aaa;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .card-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #555;
          text-decoration: none;
          letter-spacing: 0.04em;
          transition: color 0.15s;
        }
        .card-link:hover { color: #c9a060; }

        /* ── Event rows ── */
        .ev-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 24px;
          border-bottom: 1px solid #181818;
          text-decoration: none;
          transition: background 0.12s;
        }
        .ev-row:last-child { border-bottom: none; }
        .ev-row:hover { background: rgba(255,255,255,0.025); }

        .ev-date-box {
          width: 46px;
          height: 50px;
          background: #1a1a1a;
          border: 1px solid #242424;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ev-day {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 300;
          color: #f0e8d8;
          line-height: 1;
        }
        .ev-mon {
          font-size: 9px;
          color: #555;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .ev-info { flex: 1; min-width: 0; }
        .ev-name {
          font-size: 14px;
          color: #d4ccc0;
          letter-spacing: 0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 5px;
        }
        .ev-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: #555;
          flex-wrap: wrap;
        }
        .ev-meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .ev-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 7px;
          flex-shrink: 0;
        }
        .ev-age {
          font-size: 11px;
          color: #444;
          letter-spacing: 0.04em;
        }

        /* ── Empty state ── */
        .empty {
          padding: 56px 24px;
          text-align: center;
        }
        .empty-icon {
          width: 52px;
          height: 52px;
          border: 1px solid #222;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 18px;
          color: #333;
        }
        .empty-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 300;
          color: #555;
          margin-bottom: 8px;
        }
        .empty-sub {
          font-size: 13px;
          color: #3a3a3a;
          letter-spacing: 0.03em;
          line-height: 1.8;
          margin-bottom: 24px;
        }
        .empty-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 22px;
          background: transparent;
          border: 1px solid #2a2a2a;
          border-radius: 6px;
          color: #777;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          transition: border-color 0.15s, color 0.15s;
        }
        .empty-cta:hover { border-color: #c9a060; color: #c9a060; }

        /* ── Right column ── */
        .right-col { display: flex; flex-direction: column; gap: 14px; }

        /* Tier card */
        .tier-card {
          background: #141414;
          border: 1px solid #222;
          border-radius: 10px;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }
        .tier-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(to right, transparent, var(--tc, #333), transparent);
        }
        .tier-card-eyebrow {
          font-size: 11px;
          color: #555;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .tier-card-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          font-weight: 300;
          line-height: 1;
          margin-bottom: 20px;
        }
        .tier-feat-list { margin-bottom: 20px; }
        .tier-feat {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 0;
          font-size: 13px;
          letter-spacing: 0.02em;
          border-bottom: 1px solid #1a1a1a;
        }
        .tier-feat:last-child { border-bottom: none; }
        .tier-feat.on  { color: #aaa; }
        .tier-feat.off { color: #333; }
        .tier-feat-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .tier-feat.on  .tier-feat-dot { background: #c9a060; }
        .tier-feat.off .tier-feat-dot { background: #2a2a2a; }
        .tier-upgrade-btn {
          display: block;
          width: 100%;
          padding: 12px;
          background: transparent;
          border: 1px solid #2a2a2a;
          border-radius: 6px;
          color: #666;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-align: center;
          text-decoration: none;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
        }
        .tier-upgrade-btn:hover {
          border-color: #c9a060;
          color: #c9a060;
          background: rgba(201,160,96,0.04);
        }

        /* Quick actions */
        .qa-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 15px 22px;
          text-decoration: none;
          border-bottom: 1px solid #181818;
          transition: background 0.12s;
        }
        .qa-row:last-child { border-bottom: none; }
        .qa-row:hover { background: rgba(255,255,255,0.025); }
        .qa-icon {
          width: 36px;
          height: 36px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: rgba(255,255,255,0.04);
          border: 1px solid #222;
          color: #555;
          transition: color 0.15s, border-color 0.15s, background 0.15s;
        }
        .qa-row:hover .qa-icon {
          color: #c9a060;
          border-color: rgba(201,160,96,0.35);
          background: rgba(201,160,96,0.06);
        }
        .qa-text { flex: 1; }
        .qa-label {
          font-size: 13px;
          color: #aaa;
          letter-spacing: 0.02em;
          margin-bottom: 3px;
          transition: color 0.15s;
        }
        .qa-row:hover .qa-label { color: #f0e8d8; }
        .qa-sub {
          font-size: 11px;
          color: #444;
          letter-spacing: 0.03em;
        }
        .qa-arrow {
          color: #333;
          transition: color 0.15s, transform 0.15s;
          flex-shrink: 0;
        }
        .qa-row:hover .qa-arrow {
          color: #c9a060;
          transform: translateX(2px);
        }

        /* ── Responsive ── */
        @media (max-width: 1200px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .dash-body  { grid-template-columns: 1fr; }
          .right-col  { display: grid; grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 720px) {
          .dash         { padding: 28px 20px; }
          .dash-header  { flex-direction: column; align-items: flex-start; }
          .stats-grid   { grid-template-columns: 1fr 1fr; gap: 10px; }
          .right-col    { grid-template-columns: 1fr; }
          .dash-title   { font-size: 34px; }
        }
      `}</style>

      <div className="dash">

        {/* ── Header ── */}
        <div className="dash-header">
          <div>
            <div className="dash-greeting">{greeting}</div>
            <h1 className="dash-title">
              {firstName},&nbsp;
              <em>apa yang ingin</em> Anda buat?
            </h1>
          </div>
          <Link href="/dashboard/events/new" className="dash-new-btn">
            <IconPlus />
            Buat Event
          </Link>
        </div>

        {/* ── Stats ── */}
        <div className="stats-grid">

          {/* Total event */}
          <div
            className="stat-card"
            style={{
              "--card-accent": "#c9a060",
              "--icon-color":  "#c9a060",
              "--icon-bg":     "rgba(201,160,96,0.1)",
              "--icon-border": "rgba(201,160,96,0.2)",
            } as React.CSSProperties}
          >
            <div className="stat-icon-wrap"><IconCalendar /></div>
            <div className="stat-number">{eventTotal.toString()}</div>
            <div className="stat-name">Total Event</div>
            {limits.maxEvents < 999 ? (
              <>
                <div className="stat-desc">Batas {limits.maxEvents} event</div>
                <div className="usage-wrap">
                  <div className="usage-track">
                    <div
                      className={`usage-bar ${usagePercent > 85 ? "warn" : ""}`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <span className="usage-pct">{usagePercent}%</span>
                </div>
              </>
            ) : (
              <div className="stat-desc">Tidak terbatas</div>
            )}
          </div>

          {/* Published */}
          <div
            className="stat-card"
            style={{
              "--card-accent": "#6aaa38",
              "--icon-color":  "#6aaa38",
              "--icon-bg":     "rgba(106,170,56,0.1)",
              "--icon-border": "rgba(106,170,56,0.2)",
            } as React.CSSProperties}
          >
            <div className="stat-icon-wrap"><IconCheckCircle /></div>
            <div className="stat-number">{eventPublished.toString()}</div>
            <div className="stat-name">Dipublikasi</div>
            <div className="stat-desc">Event aktif &amp; publik</div>
          </div>

          {/* Draft */}
          <div
            className="stat-card"
            style={{
              "--card-accent": "#444",
              "--icon-color":  "#666",
              "--icon-bg":     "rgba(255,255,255,0.04)",
              "--icon-border": "#252525",
            } as React.CSSProperties}
          >
            <div className="stat-icon-wrap"><IconClock /></div>
            <div className="stat-number">{eventDraft.toString()}</div>
            <div className="stat-name">Draft</div>
            <div className="stat-desc">Belum dipublikasi</div>
          </div>

          {/* Tier */}
          <div
            className="stat-card"
            style={{
              "--card-accent": tierColor,
              "--icon-color":  tierColor,
              "--icon-bg":     tierBg,
              "--icon-border": `${tierColor}33`,
            } as React.CSSProperties}
          >
            <div className="stat-icon-wrap"><IconTrendUp /></div>
            <div className="stat-number colored">{tierLabel}</div>
            <div className="stat-name">Paket Aktif</div>
            <div className="stat-desc">
              {tier === "free"  && "3 event · tanpa publish"}
              {tier === "basic" && "20 event · publish aktif"}
              {tier === "pro"   && "Tak terbatas · featured"}
            </div>
          </div>

        </div>

        {/* ── Body ── */}
        <div className="dash-body">

          {/* Recent events */}
          <div className="card">
            <div className="card-head">
              <span className="card-title">Event Terbaru</span>
              <Link href="/dashboard/events" className="card-link">
                Lihat semua <IconArrowRight />
              </Link>
            </div>

            {recentEvents.length === 0 ? (
              <div className="empty">
                <div className="empty-icon"><IconCalendar /></div>
                <div className="empty-title">Belum ada event</div>
                <div className="empty-sub">
                  Buat event pertama Anda dan mulai<br />bagikan ke audiens yang lebih luas.
                </div>
                <Link href="/dashboard/events/new" className="empty-cta">
                  <IconPlus /> Buat event pertama
                </Link>
              </div>
            ) : (
              recentEvents.map(({ event: ev, category }) => {
                const d = new Date(ev.startDate);
                return (
                  <Link
                    key={ev.id}
                    href={`/dashboard/events/${ev.id}`}
                    className="ev-row"
                  >
                    <div className="ev-date-box">
                      <div className="ev-day">{d.getDate()}</div>
                      <div className="ev-mon">
                        {d.toLocaleDateString("id-ID", { month: "short" })}
                      </div>
                    </div>

                    <div className="ev-info">
                      <div className="ev-name">{ev.title}</div>
                      <div className="ev-meta">
                        <span className="ev-meta-item">
                          <IconMapPin />
                          {ev.location.length > 28
                            ? ev.location.slice(0, 28) + "…"
                            : ev.location}
                        </span>
                        {category && (
                          <span style={{
                            fontSize: 10, padding: "1px 7px", borderRadius: 100,
                            background: "rgba(255,255,255,0.04)", border: "1px solid #1e1e1e",
                            color: "#3a3a3a", letterSpacing: "0.06em", whiteSpace: "nowrap",
                          }}>
                            {category.emoji} {category.name}
                          </span>
                        )}
                        {Number(ev.ticketPrice) > 0 && (
                          <span>
                            Rp {Number(ev.ticketPrice).toLocaleString("id-ID")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="ev-right">
                      <StatusBadge status={ev.status ?? "draft"} />
                      <span className="ev-age">
                        {formatRelative(new Date(ev.createdAt))}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Right column */}
          <div className="right-col">

            {/* Tier card */}
            <div className="tier-card" style={{ "--tc": tierColor } as React.CSSProperties}>
              <div className="tier-card-eyebrow">Paket Anda</div>
              <div className="tier-card-name" style={{ color: tierColor }}>
                {tierLabel}
              </div>
              <div className="tier-feat-list">
                <div className={`tier-feat ${limits.maxEvents >= 999 || Number(eventTotal) < limits.maxEvents ? "on" : "off"}`}>
                  <div className="tier-feat-dot" />
                  {limits.maxEvents >= 999
                    ? "Event tak terbatas"
                    : `${eventTotal} / ${limits.maxEvents} event`}
                </div>
                <div className={`tier-feat ${limits.canPublish ? "on" : "off"}`}>
                  <div className="tier-feat-dot" />
                  Publish &amp; promosi event
                </div>
                <div className={`tier-feat ${limits.featured ? "on" : "off"}`}>
                  <div className="tier-feat-dot" />
                  Featured di homepage
                </div>
              </div>
              {tier !== "pro" && (
                <Link href="/dashboard/upgrade" className="tier-upgrade-btn">
                  Upgrade paket →
                </Link>
              )}
            </div>

            {/* Quick actions */}
            <div className="card">
              <div className="card-head">
                <span className="card-title">Aksi Cepat</span>
              </div>

              <Link href="/dashboard/events/new" className="qa-row">
                <div className="qa-icon"><IconPlus /></div>
                <div className="qa-text">
                  <div className="qa-label">Buat Event Baru</div>
                  <div className="qa-sub">Draft siap diedit</div>
                </div>
                <span className="qa-arrow"><IconArrowRight /></span>
              </Link>

              <Link href="/dashboard/events" className="qa-row">
                <div className="qa-icon"><IconCalendar /></div>
                <div className="qa-text">
                  <div className="qa-label">Kelola Event</div>
                  <div className="qa-sub">Edit, publish, atau hapus</div>
                </div>
                <span className="qa-arrow"><IconArrowRight /></span>
              </Link>

              <Link href="/dashboard/analytics" className="qa-row">
                <div className="qa-icon"><IconTrendUp /></div>
                <div className="qa-text">
                  <div className="qa-label">Lihat Analitik</div>
                  <div className="qa-sub">Performa event Anda</div>
                </div>
                <span className="qa-arrow"><IconArrowRight /></span>
              </Link>

              {tier === "free" && (
                <Link href="/dashboard/upgrade" className="qa-row">
                  <div
                    className="qa-icon"
                    style={{
                      color: "#c9a060",
                      borderColor: "rgba(201,160,96,0.25)",
                      background: "rgba(201,160,96,0.06)",
                    }}
                  >
                    <IconZap />
                  </div>
                  <div className="qa-text">
                    <div className="qa-label" style={{ color: "#c9a060" }}>
                      Upgrade Paket
                    </div>
                    <div className="qa-sub">Buka fitur publish</div>
                  </div>
                  <span className="qa-arrow"><IconArrowRight /></span>
                </Link>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
