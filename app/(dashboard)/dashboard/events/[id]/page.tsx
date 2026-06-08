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
      <div className="min-h-screen bg-[#0a0a0a] font-mono">
        {/* ── Hero ── */}
        <div className="relative border-b border-[#0d0d0d] bg-[#0f0f0f] px-11 py-8 overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `
              radial-gradient(ellipse 50% 80% at 80% 50%, rgba(180,140,80,0.05) 0%, transparent 70%),
              radial-gradient(ellipse 30% 60% at 10% 80%, rgba(180,140,80,0.03) 0%, transparent 70%)
            `,
          }} />

          {/* Breadcrumb */}
          <div className="relative flex items-center gap-2 mb-6 text-xs text-[#333] tracking-widest">
            <Link href="/dashboard/events" className="inline-flex items-center gap-1 text-[#333] transition-colors hover:text-[#b48c50]">
              <IconArrowLeft />
              Event Saya
            </Link>
            <span className="text-[#1a1a1a]">/</span>
            <span className="text-[#555]">Detail</span>
          </div>

          <div className="relative flex items-start justify-between gap-5">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#333] tracking-widest uppercase mb-2.5">Event · {event.id.slice(0, 8).toUpperCase()}</div>
              <h1 className="font-serif text-4xl font-light text-[#e8e0d0] tracking-tight leading-tight mb-4">
                {event.title.includes(" ") ? (
                  <>
                    {event.title.split(" ").slice(0, -1).join(" ")}{" "}
                    <em className="italic text-[#b48c50]">{event.title.split(" ").slice(-1)}</em>
                  </>
                ) : (
                  <em className="italic text-[#b48c50]">{event.title}</em>
                )}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[rgba(255,255,255,0.03)] border border-[#1a1a1a] rounded text-xs text-[#444] tracking-tight">
                  <IconMapPin />
                  {event.location}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[rgba(255,255,255,0.03)] border border-[#1a1a1a] rounded text-xs text-[#444] tracking-tight">
                  <IconCalendar />
                  {formatDate(startDate)}
                </span>
                {event.capacity && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[rgba(255,255,255,0.03)] border border-[#1a1a1a] rounded text-xs text-[#444] tracking-tight">
                    <IconUsers />
                    {event.capacity.toLocaleString("id-ID")} kapasitas
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <StatusBadge status={event.status ?? "draft"} />
              {isUpcoming && (
                <div className="text-xs text-[#5a8830] tracking-widest uppercase px-2 py-1 border border-[rgba(90,136,48,0.25)] rounded-sm bg-[rgba(90,136,48,0.06)]">Akan datang</div>
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
          <div className="relative w-full bg-[#111]" style={{ aspectRatio: "16/9", maxHeight: 420, overflow: "hidden" }}>
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
        <div className="grid grid-cols-[1fr_320px]">
          {/* Main */}
          <div className="border-r border-[#0d0d0d] px-11 py-9">

            {/* Category pill */}
            {category && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(201,160,96,0.07)] border border-[rgba(201,160,96,0.2)] text-xs text-[#c9a060] tracking-tight font-mono mb-5">
                {category.emoji} {category.name}
              </div>
            )}

            {/* Description */}
            <div className="mb-9">
              <div className="flex items-center gap-2 text-xs text-[#2e2e2e] tracking-widest uppercase mb-4">
                Deskripsi
                <div className="flex-1 h-px bg-[#0d0d0d]" />
              </div>
              <p className="text-xs text-[#666] leading-8 tracking-tight whitespace-pre-wrap">{event.description}</p>
            </div>

            {/* Gallery */}
            {event.galleryImages && (() => {
              try {
                const urls: string[] = JSON.parse(event.galleryImages);
                if (!urls.length) return null;
                return (
                  <div className="mb-9">
                    <div className="flex items-center gap-2 text-xs text-[#2e2e2e] tracking-widest uppercase mb-4">
                      Galeri Foto
                      <div className="flex-1 h-px bg-[#0d0d0d]" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {urls.map((url, i) => (
                        <div key={i} className="relative bg-[#111]" style={{ aspectRatio: "1" }}>
                          <Image
                            src={url}
                            alt={`Gallery ${i + 1}`}
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="(max-width: 900px) 50vw, 25vw"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } catch {
                return null;
              }
            })()}

            {/* Info section */}
            <div className="mb-9">
              <div className="flex items-center gap-2 text-xs text-[#2e2e2e] tracking-widest uppercase mb-4">
                Informasi Event
                <div className="flex-1 h-px bg-[#0d0d0d]" />
              </div>
              <div className="flex flex-col gap-0">
                <InfoRow icon={<IconMapPin />} label="Lokasi" value={event.location} accent />
                <InfoRow icon={<IconCalendar />} label="Tanggal Mulai" value={formatDateTime(startDate)} />
                <InfoRow icon={<IconTimer />} label="Durasi" value={duration} />
                <InfoRow icon={<IconTicket />} label="Harga" value={formatPrice(event.ticketPrice)} accent />
                {event.capacity && <InfoRow icon={<IconUsers />} label="Kapasitas" value={`${event.capacity.toLocaleString("id-ID")} peserta`} />}
              </div>
            </div>

            {/* Timeline section */}
            <div className="mb-9">
              <div className="flex items-center gap-2 text-xs text-[#2e2e2e] tracking-widest uppercase mb-4">
                Timeline
                <div className="flex-1 h-px bg-[#0d0d0d]" />
              </div>
              <div className="flex flex-col gap-0">
                {/* Created */}
                <div className="flex gap-4 pb-5">
                  <div className="flex flex-col items-center w-4 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full border border-[#b48c50] bg-[#0a0a0a] flex-shrink-0 mt-1" />
                    <div className="w-px flex-1 bg-[#0d0d0d] mt-1" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-[#333] tracking-widest uppercase mb-1">Dibuat</div>
                    <div className="text-xs text-[#888] tracking-tight">{formatDateTime(createdAt)}</div>
                  </div>
                </div>
                {/* Updated */}
                <div className="flex gap-4 pb-5">
                  <div className="flex flex-col items-center w-4 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full border border-[#b48c50] bg-[#0a0a0a] flex-shrink-0 mt-1" />
                    <div className="w-px flex-1 bg-[#0d0d0d] mt-1" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-[#333] tracking-widest uppercase mb-1">Terakhir Diperbarui</div>
                    <div className="text-xs text-[#888] tracking-tight">{formatDateTime(updatedAt)}</div>
                  </div>
                </div>
                {/* Event date */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center w-4 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full border border-[#222] bg-[#0a0a0a] flex-shrink-0 mt-1" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-[#333] tracking-widest uppercase mb-1">Event</div>
                    <div className="text-xs text-[#888] tracking-tight">{formatDateTime(startDate)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Section */}
            <div className="mt-9 pt-9 border-t border-[#0d0d0d]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs text-[#2e2e2e] tracking-widest uppercase">Edit Event</h2>
              </div>
              <EditEventForm event={event} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="sticky top-0 h-fit px-7 py-9">
            {/* Stats Card */}
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg overflow-hidden mb-3">
              <div className="px-4 py-3 border-b border-[#0d0d0d] text-xs text-[#2e2e2e] tracking-widest uppercase">Statistik</div>
              <div className="flex flex-col gap-0">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#0d0d0d]">
                  <span className="text-xs text-[#333] tracking-tight">Tiket Terjual</span>
                  <span className="text-xs text-[#888] tracking-tight text-right">{event.ticketSold ?? 0}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#0d0d0d]">
                  <span className="text-xs text-[#333] tracking-tight">Pendapatan</span>
                  <span className="text-xs text-[#b48c50] tracking-tight text-right">{formatPrice(event.ticketPrice)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-[#333] tracking-tight">Status</span>
                  <span className="text-xs text-[#5a8830] tracking-tight text-right">{event.status === "published" ? "Aktif" : "Draft"}</span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="mt-3 pt-4 px-1">
              <div className="flex justify-between text-xs text-[#222] tracking-tight pb-1.5 border-b border-[#0d0d0d]">
                <span>Dibuat:</span>
                <span>{formatDateTime(createdAt)}</span>
              </div>
              <div className="flex justify-between text-xs text-[#222] tracking-tight pt-1.5">
                <span>Diperbarui:</span>
                <span>{formatDateTime(updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
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
