import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { requireAuth } from "@/lib/auth-helper";
import { db } from "@/db";
import { events, categories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { TIER_LIMITS } from "@/lib/tiers";
import { EditEventForm } from "./edit-event-form";
import { EventDetailActions } from "./event-detail-actions";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPrice(price: string | null) {
  const n = Number(price);
  if (!n) return "Gratis";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function getDuration(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  const h  = Math.floor(ms / 3600000);
  const m  = Math.floor((ms % 3600000) / 60000);
  if (h === 0) return `${m} menit`;
  if (m === 0) return `${h} jam`;
  return `${h} jam ${m} menit`;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <line x1="14" y1="8" x2="2" y2="8" />
      <polyline points="6 4 2 8 6 12" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M7.5 1.5a4.5 4.5 0 0 1 4.5 4.5C12 9.5 7.5 13.5 7.5 13.5S3 9.5 3 6a4.5 4.5 0 0 1 4.5-4.5z" />
      <circle cx="7.5" cy="6" r="1.5" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <circle cx="7.5" cy="7.5" r="6" />
      <polyline points="7.5 4 7.5 7.5 10 9" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <circle cx="5.5" cy="4.5" r="2.5" />
      <path d="M1 13c0-2.5 2-4.5 4.5-4.5S10 10.5 10 13" />
      <circle cx="11.5" cy="4.5" r="2" />
      <path d="M14 13c0-1.8-1.1-3.3-2.5-3.9" />
    </svg>
  );
}

function IconTicket() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M1 5.5V3.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <rect x="1.5" y="2.5" width="12" height="11" rx="2" />
      <line x1="1.5" y1="7" x2="13.5" y2="7" />
      <line x1="5" y1="1" x2="5" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
    </svg>
  );
}

function IconTimer() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <circle cx="7.5" cy="8.5" r="5.5" />
      <line x1="7.5" y1="3" x2="7.5" y2="1" />
      <line x1="5.5" y1="1" x2="9.5" y2="1" />
      <polyline points="7.5 6 7.5 8.5 9.5 9.5" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M10.5 2.5l2 2-8 8-2.5.5.5-2.5 8-8z" />
    </svg>
  );
}

function IconActivity() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <polyline points="1 8 4 5 7 9 10 4 13 7" />
    </svg>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string; border: string }> = {
    draft:     { label: "Draft",      color: "#666",    bg: "rgba(255,255,255,0.04)", border: "#1e1e1e" },
    published: { label: "Aktif",      color: "#5a8830", bg: "rgba(90,136,48,0.1)",   border: "rgba(90,136,48,0.25)" },
    cancelled: { label: "Dibatalkan", color: "#8b2020", bg: "rgba(139,32,32,0.1)",   border: "rgba(139,32,32,0.25)" },
  };
  const s = cfg[status] ?? cfg.draft;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 12px",
      borderRadius: 4,
      border: `1px solid ${s.border}`,
      fontSize: 10,
      letterSpacing: "0.12em",
      textTransform: "uppercase" as const,
      color: s.color,
      background: s.bg,
      fontFamily: "'DM Mono', monospace",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
      padding: "14px 0",
      borderBottom: "1px solid #111",
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        border: "1px solid #1a1a1a",
        background: "rgba(255,255,255,0.02)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: accent ? "#b48c50" : "#444",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, color: "#333", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>
          {label}
        </div>
        <div style={{ fontSize: 13, color: accent ? "#e8e0d0" : "#888", letterSpacing: "0.02em", fontFamily: "'DM Mono', monospace", lineHeight: 1.5 }}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: Props) {
  const { id }  = await params;
  const session = await requireAuth();
  const userId  = session.user.id;
  const tier    = (session.user.pricingTier ?? "free") as "free" | "basic" | "pro";
  const limits  = TIER_LIMITS[tier];

  // Fetch event — must belong to current user
  const [row] = await db
    .select({ event: events, category: categories })
    .from(events)
    .leftJoin(categories, eq(events.categoryId, categories.id))
    .where(and(eq(events.id, id), eq(events.userId, userId)))
    .limit(1);

  if (!row) notFound();

  const { event, category } = row;

  const startDate = new Date(event.startDate);
  const endDate   = new Date(event.endDate);
  const createdAt = new Date(event.createdAt);
  const updatedAt = new Date(event.updatedAt);
  const isUpcoming = startDate > new Date();
  const duration   = getDuration(startDate, endDate);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Mono:wght@300;400&display=swap');

        .det-page {
          min-height: 100%;
          background: #0a0a0a;
          font-family: 'DM Mono', monospace;
        }

        /* ── Hero banner ── */
        .det-hero {
          position: relative;
          background: #0f0f0f;
          border-bottom: 1px solid #1a1a1a;
          padding: 36px 44px 32px;
          overflow: hidden;
        }
        .det-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 50% 80% at 80% 50%, rgba(180,140,80,0.05) 0%, transparent 70%),
            radial-gradient(ellipse 30% 60% at 10% 80%, rgba(180,140,80,0.03) 0%, transparent 70%);
          pointer-events: none;
        }

        .det-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
          font-size: 10px;
          color: #333;
          letter-spacing: 0.08em;
        }
        .det-breadcrumb a {
          color: #333;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.15s;
        }
        .det-breadcrumb a:hover { color: #b48c50; }
        .det-breadcrumb-sep { color: #1e1e1e; }

        .det-hero-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }
        .det-hero-left { flex: 1; min-width: 0; }

        .det-event-label {
          font-size: 9px;
          color: #333;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .det-event-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(26px, 3vw, 40px);
          font-weight: 300;
          color: #e8e0d0;
          letter-spacing: -0.01em;
          line-height: 1.15;
          margin-bottom: 16px;
        }
        .det-event-title em {
          font-style: italic;
          color: #b48c50;
        }

        .det-hero-chips {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .det-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          color: #444;
          letter-spacing: 0.06em;
          background: rgba(255,255,255,0.03);
          border: 1px solid #1a1a1a;
          border-radius: 4px;
          padding: 5px 10px;
        }

        .det-hero-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          flex-shrink: 0;
        }

        /* upcoming badge */
        .det-upcoming {
          font-size: 9px;
          color: #5a8830;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 4px 10px;
          border: 1px solid rgba(90,136,48,0.25);
          border-radius: 3px;
          background: rgba(90,136,48,0.06);
        }

        /* ── Body ── */
        .det-body {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 0;
          align-items: start;
        }

        /* ── Main column ── */
        .det-main {
          padding: 36px 44px;
          border-right: 1px solid #111;
        }

        .det-section {
          margin-bottom: 36px;
        }
        .det-section-title {
          font-size: 9px;
          color: #2e2e2e;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .det-section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #111;
        }

        .det-description {
          font-size: 12px;
          color: #666;
          line-height: 2;
          letter-spacing: 0.04em;
          white-space: pre-wrap;
        }

        /* Edit form toggle */
        .det-edit-toggle {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 16px;
          background: transparent;
          border: 1px solid #1e1e1e;
          border-radius: 4px;
          color: #444;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
          margin-top: 20px;
          text-decoration: none;
        }
        .det-edit-toggle:hover { border-color: #b48c50; color: #b48c50; }

        /* Timeline */
        .det-timeline { display: flex; flex-direction: column; gap: 0; }
        .det-tl-item {
          display: flex;
          gap: 14px;
          padding-bottom: 20px;
          position: relative;
        }
        .det-tl-item:last-child { padding-bottom: 0; }
        .det-tl-item:last-child .det-tl-line { display: none; }
        .det-tl-dot-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }
        .det-tl-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 1px solid #b48c50;
          background: #0a0a0a;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .det-tl-dot.dim {
          border-color: #222;
        }
        .det-tl-line {
          width: 1px;
          flex: 1;
          background: #111;
          margin-top: 4px;
        }
        .det-tl-content { flex: 1; }
        .det-tl-label {
          font-size: 9px;
          color: #333;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .det-tl-value {
          font-size: 12px;
          color: #888;
          letter-spacing: 0.03em;
        }

        /* ── Sidebar ── */
        .det-side {
          padding: 36px 28px;
          position: sticky;
          top: 0;
        }

        .det-side-card {
          background: #0f0f0f;
          border: 1px solid #1a1a1a;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 14px;
        }
        .det-side-card-head {
          padding: 14px 18px;
          border-bottom: 1px solid #111;
          font-size: 9px;
          color: #2e2e2e;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .det-side-card-body { padding: 4px 0; }

        /* Stat rows in sidebar */
        .det-stat-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 18px;
          border-bottom: 1px solid #0d0d0d;
        }
        .det-stat-row:last-child { border-bottom: none; }
        .det-stat-key {
          font-size: 10px;
          color: #333;
          letter-spacing: 0.06em;
        }
        .det-stat-val {
          font-size: 11px;
          color: #888;
          letter-spacing: 0.04em;
          text-align: right;
        }
        .det-stat-val.accent { color: #b48c50; }
        .det-stat-val.green  { color: #5a8830; }

        /* Timestamp footer */
        .det-timestamps {
          margin-top: 16px;
          padding: 0 4px;
        }
        .det-ts-item {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 9px;
          color: #222;
          letter-spacing: 0.06em;
          border-bottom: 1px solid #0d0d0d;
        }
        .det-ts-item:last-child { border-bottom: none; }

        /* Responsive */
        @media (max-width: 900px) {
          .det-body { grid-template-columns: 1fr; }
          .det-main { border-right: none; border-bottom: 1px solid #111; padding: 28px 24px; }
          .det-side { padding: 24px; position: static; }
          .det-hero { padding: 24px; }
        }
        @media (max-width: 640px) {
          .det-hero-top { flex-direction: column; }
          .det-hero-right { align-items: flex-start; }
        }
      `}</style>

      <div className="det-page">
        {/* ── Hero ── */}
        <div className="det-hero">
          {/* Breadcrumb */}
          <div className="det-breadcrumb">
            <Link href="/dashboard/events">
              <IconArrowLeft />
              Event Saya
            </Link>
            <span className="det-breadcrumb-sep">/</span>
            <span style={{ color: "#555" }}>Detail</span>
          </div>

          <div className="det-hero-top">
            <div className="det-hero-left">
              <div className="det-event-label">Event · {event.id.slice(0, 8).toUpperCase()}</div>
              <h1 className="det-event-title">
                {event.title.includes(" ") ? (
                  <>
                    {event.title.split(" ").slice(0, -1).join(" ")}{" "}
                    <em>{event.title.split(" ").slice(-1)}</em>
                  </>
                ) : (
                  <em>{event.title}</em>
                )}
              </h1>
              <div className="det-hero-chips">
                <span className="det-chip">
                  <IconMapPin />
                  {event.location}
                </span>
                <span className="det-chip">
                  <IconCalendar />
                  {formatDate(startDate)}
                </span>
                {event.capacity && (
                  <span className="det-chip">
                    <IconUsers />
                    {event.capacity.toLocaleString("id-ID")} kapasitas
                  </span>
                )}
              </div>
            </div>

            <div className="det-hero-right">
              <StatusBadge status={event.status ?? "draft"} />
              {isUpcoming && (
                <div className="det-upcoming">Akan datang</div>
              )}
              {/* Client action buttons: publish/unpublish/delete */}
              <EventDetailActions
                eventId={event.id}
                status={event.status ?? "draft"}
                canPublish={limits.canPublish}
              />
            </div>
          </div>
        </div>

        {/* ── Cover Image ── */}
        {event.coverImage && (
          <div style={{
            position: "relative",
            width: "100%", aspectRatio: "16/9", maxHeight: 420,
            overflow: "hidden", background: "#111",
          }}>
            <Image
              src={event.coverImage}
              alt={event.title}
              fill
              style={{ objectFit: "cover" }}
              sizes="100vw"
              priority
            />
          </div>
        )}

        {/* ── Body ── */}
        <div className="det-body">
          {/* Main */}
          <div className="det-main">

            {/* Category pill */}
            {category && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "5px 12px", borderRadius: 100,
                background: "rgba(201,160,96,0.07)", border: "1px solid rgba(201,160,96,0.2)",
                fontSize: 11, color: "#c9a060", letterSpacing: "0.06em",
                fontFamily: "'DM Mono', monospace", marginBottom: 20,
              }}>
                {category.emoji} {category.name}
              </div>
            )}

            {/* Description */}
            <div className="det-section">
              <div className="det-section-title">Deskripsi</div>
              <p className="det-description">{event.description}</p>
            </div>

            {/* Gallery */}
            {event.galleryImages && (() => {
              try {
                const urls: string[] = JSON.parse(event.galleryImages);
                if (!urls.length) return null;
                return (
                  <div className="det-section">
                    <div className="det-section-title">Galeri Foto</div>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                      gap: 8, marginTop: 4,
                    }}>
                      {urls.map((url, i) => (
                        <div key={i} style={{
                          position: "relative",
                          aspectRatio: "1/1", borderRadius: 6,
                          overflow: "hidden", background: "#1a1a1a",
                        }}>
                          <Image
                            src={url}
                            alt={`Galeri ${i + 1}`}
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="140px"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } catch { return null; }
            })()}

            {/* Info rows */}
            <div className="det-section">
              <div className="det-section-title">Detail Event</div>
              <InfoRow icon={<IconMapPin />}  label="Lokasi"       value={event.location} />
              <InfoRow icon={<IconCalendar />} label="Mulai"       value={formatDateTime(startDate)} accent />
              <InfoRow icon={<IconCalendar />} label="Selesai"     value={formatDateTime(endDate)} />
              <InfoRow icon={<IconTimer />}    label="Durasi"      value={duration} />
              {event.capacity && (
                <InfoRow icon={<IconUsers />}  label="Kapasitas"   value={`${event.capacity.toLocaleString("id-ID")} orang`} />
              )}
              <InfoRow
                icon={<IconTicket />}
                label="Harga Tiket"
                value={formatPrice(event.ticketPrice?.toString() ?? null)}
                accent={Number(event.ticketPrice) > 0}
              />
            </div>

            {/* Timeline */}
            <div className="det-section">
              <div className="det-section-title">Timeline</div>
              <div className="det-timeline">
                <div className="det-tl-item">
                  <div className="det-tl-dot-wrap">
                    <div className="det-tl-dot" />
                    <div className="det-tl-line" />
                  </div>
                  <div className="det-tl-content">
                    <div className="det-tl-label">Dibuat</div>
                    <div className="det-tl-value">{formatDateTime(createdAt)}</div>
                  </div>
                </div>
                <div className="det-tl-item">
                  <div className="det-tl-dot-wrap">
                    <div className={`det-tl-dot ${updatedAt.getTime() === createdAt.getTime() ? "dim" : ""}`} />
                    <div className="det-tl-line" />
                  </div>
                  <div className="det-tl-content">
                    <div className="det-tl-label">Terakhir diperbarui</div>
                    <div className="det-tl-value">{formatDateTime(updatedAt)}</div>
                  </div>
                </div>
                <div className="det-tl-item">
                  <div className="det-tl-dot-wrap">
                    <div className={`det-tl-dot ${event.status !== "published" ? "dim" : ""}`} />
                  </div>
                  <div className="det-tl-content">
                    <div className="det-tl-label">Dipublikasi</div>
                    <div className="det-tl-value" style={{ color: event.status === "published" ? "#5a8830" : "#2e2e2e" }}>
                      {event.status === "published" ? "Sudah dipublikasi" : "Belum dipublikasi"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit form */}
            <div className="det-section">
              <div className="det-section-title">Edit Event</div>
              <EditEventForm event={event} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="det-side">
            {/* Stats */}
            <div className="det-side-card">
              <div className="det-side-card-head">Ringkasan</div>
              <div className="det-side-card-body">
                <div className="det-stat-row">
                  <span className="det-stat-key">Status</span>
                  <span className={`det-stat-val ${event.status === "published" ? "green" : ""}`}>
                    {event.status === "published" ? "Aktif" : event.status === "draft" ? "Draft" : "Dibatalkan"}
                  </span>
                </div>
                <div className="det-stat-row">
                  <span className="det-stat-key">Harga tiket</span>
                  <span className={`det-stat-val ${Number(event.ticketPrice) > 0 ? "accent" : ""}`}>
                    {formatPrice(event.ticketPrice?.toString() ?? null)}
                  </span>
                </div>
                {event.capacity && (
                  <div className="det-stat-row">
                    <span className="det-stat-key">Kapasitas</span>
                    <span className="det-stat-val">
                      {event.capacity.toLocaleString("id-ID")} orang
                    </span>
                  </div>
                )}
                <div className="det-stat-row">
                  <span className="det-stat-key">Durasi</span>
                  <span className="det-stat-val">{duration}</span>
                </div>
                <div className="det-stat-row">
                  <span className="det-stat-key">Event ID</span>
                  <span className="det-stat-val" style={{ fontSize: 9, color: "#2a2a2a" }}>
                    {event.id.slice(0, 12)}…
                  </span>
                </div>
              </div>
            </div>

            {/* Date card */}
            <div className="det-side-card">
              <div className="det-side-card-head">Jadwal</div>
              <div className="det-side-card-body">
                <div className="det-stat-row">
                  <span className="det-stat-key">Mulai</span>
                  <span className="det-stat-val" style={{ fontSize: 10 }}>
                    {formatDate(startDate)}
                  </span>
                </div>
                <div className="det-stat-row">
                  <span className="det-stat-key">Selesai</span>
                  <span className="det-stat-val" style={{ fontSize: 10 }}>
                    {formatDate(endDate)}
                  </span>
                </div>
                <div className="det-stat-row">
                  <span className="det-stat-key">Waktu mulai</span>
                  <span className="det-stat-val accent">
                    {startDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="det-stat-row">
                  <span className="det-stat-key">Waktu selesai</span>
                  <span className="det-stat-val">
                    {endDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="det-timestamps">
              <div className="det-ts-item">
                <span>Dibuat</span>
                <span>{formatDateTime(createdAt)}</span>
              </div>
              <div className="det-ts-item">
                <span>Diperbarui</span>
                <span>{formatDateTime(updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
