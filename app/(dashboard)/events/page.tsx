// src/app/(dashboard)/events/page.tsx
import Link from "next/link";
import { requireAuth } from "@/lib/auth-helper";
import { db } from "@/db";
import { events, categories } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { TIER_CONFIG } from "@/lib/tiers";
import type { PricingTier } from "@/lib/tiers";
import { EventActions } from "./event-actions";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("id-ID", { day:"numeric", month:"short", year:"numeric" }).format(d);
}
function formatPrice(p: string | null) {
  const n = Number(p);
  if (!n) return "Gratis";
  return new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
}

function IconPlus() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>; }

interface Props {
  searchParams: Promise<{ category?: string; status?: string }>;
}

export default async function EventsPage({ searchParams }: Props) {
  const { category: catSlug, status: statusFilter } = await searchParams;
  const session = await requireAuth();
  const userId  = session.user.id;
  const tier    = (session.user.pricingTier ?? "free") as PricingTier;
  const tc      = TIER_CONFIG[tier];

  const allCategories = await db.select().from(categories).orderBy(categories.name);

  const conditions: any[] = [eq(events.userId, userId)];
  if (catSlug) {
    const cat = allCategories.find(c => c.slug === catSlug);
    if (cat) conditions.push(eq(events.categoryId, cat.id));
  }
  if (statusFilter && ["draft","published","cancelled"].includes(statusFilter)) {
    conditions.push(eq(events.status, statusFilter as any));
  }

  const rows = await db
    .select({ event: events, category: categories })
    .from(events)
    .leftJoin(categories, eq(events.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(events.createdAt));

  const allForCount = await db.select().from(events).where(eq(events.userId, userId));
  const atLimit = tc.maxEvents !== 999 && allForCount.length >= tc.maxEvents;

  const totalPublished = allForCount.filter(e => e.status === "published").length;
  const totalDraft     = allForCount.filter(e => e.status === "draft").length;

  const STATUS_TABS = [
    { key: "",           label: "Semua",     count: allForCount.length },
    { key: "published",  label: "Aktif",     count: totalPublished },
    { key: "draft",      label: "Draft",     count: totalDraft },
  ];

  return (
    <div className="dash-page">
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:16 }}>
        <div>
          <div className="dash-label">Event Saya</div>
          <h1 className="dash-title">Kelola <em>Event</em></h1>
        </div>
        {!atLimit ? (
          <Link href="/dashboard/events/new" className="btn btn-primary">
            <IconPlus /> Buat Event
          </Link>
        ) : (
          <Link href="/dashboard/upgrade" className="btn btn-ghost btn-sm">Upgrade untuk tambah event</Link>
        )}
      </div>

      {/* Summary strip */}
      <div className="ev-summary">
        <div className="ev-s-item">
          <div className="ev-s-num">{allForCount.length}</div>
          <div className="ev-s-lbl">Total</div>
        </div>
        <div className="ev-s-item">
          <div className="ev-s-num" style={{ color:"var(--c-green)" }}>{totalPublished}</div>
          <div className="ev-s-lbl">Aktif</div>
        </div>
        <div className="ev-s-item">
          <div className="ev-s-num">{totalDraft}</div>
          <div className="ev-s-lbl">Draft</div>
        </div>
        <div className="ev-s-item">
          <div className="ev-s-num" style={{ color:"var(--c-gold)" }}>
            {tc.maxEvents === 999 ? "∞" : tc.maxEvents}
          </div>
          <div className="ev-s-lbl">Batas</div>
        </div>
      </div>

      {/* Limit warning */}
      {atLimit && (
        <div className="ev-limit">
          ⚠ Batas {tc.maxEvents} event tercapai.{" "}
          <a href="/dashboard/upgrade">Upgrade</a> untuk lebih banyak.
        </div>
      )}

      {/* Status tabs */}
      <div className="status-tabs">
        {STATUS_TABS.map(t => (
          <Link
            key={t.key}
            href={t.key ? `/dashboard/events?status=${t.key}${catSlug ? `&category=${catSlug}` : ""}` : `/dashboard/events${catSlug ? `?category=${catSlug}` : ""}`}
            className={`status-tab${(statusFilter ?? "") === t.key ? " active" : ""}`}
          >
            {t.label} <span style={{ opacity:0.5, marginLeft:4 }}>{t.count}</span>
          </Link>
        ))}
      </div>

      {/* Category tabs */}
      <div className="cat-tabs">
        <Link href={`/dashboard/events${statusFilter ? `?status=${statusFilter}` : ""}`} className={`cat-tab${!catSlug ? " active" : ""}`}>
          Semua kategori
        </Link>
        {allCategories.map(c => (
          <Link
            key={c.id}
            href={`/dashboard/events?category=${c.slug}${statusFilter ? `&status=${statusFilter}` : ""}`}
            className={`cat-tab${catSlug === c.slug ? " active" : ""}`}
          >
            {c.emoji} {c.name}
          </Link>
        ))}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="ev-empty">
          <div className="ev-empty-icon">📭</div>
          <div className="ev-empty-title">Tidak ada event</div>
          <p className="ev-empty-desc">Belum ada event yang sesuai filter ini.</p>
          {!atLimit && (
            <Link href="/dashboard/events/new" className="btn btn-ghost btn-sm"><IconPlus /> Buat Event</Link>
          )}
        </div>
      ) : (
        <div className="ev-table">
          <div className="ev-thead">
            <span className="ev-th">Judul Event</span>
            <span className="ev-th hide-sm">Tanggal Mulai</span>
            <span className="ev-th hide-sm">Harga</span>
            <span className="ev-th">Status</span>
            <span className="ev-th right">Aksi</span>
          </div>
          {rows.map(({ event: ev, category }) => (
            <div key={ev.id} className="ev-row">
              <div className="ev-cell-main">
                <Link href={`/dashboard/events/${ev.id}`} className="ev-event-title">{ev.title}</Link>
                {category && (
                  <span className="ev-cat-pill">{category.emoji} {category.name}</span>
                )}
              </div>
              <div className="ev-cell hide-sm">
                <div className="ev-date-text">{formatDate(new Date(ev.startDate))}</div>
              </div>
              <div className="ev-cell hide-sm">
                <div className="ev-price-text">{formatPrice(ev.ticketPrice)}</div>
              </div>
              <div className="ev-cell">
                <span className={`badge ${ev.status === "published" ? "badge-green" : ev.status === "cancelled" ? "badge-red" : "badge-muted"}`}>
                  {ev.status === "published" ? "Aktif" : ev.status === "cancelled" ? "Batal" : "Draft"}
                </span>
              </div>
              <div className="ev-cell right">
                <EventActions eventId={ev.id} status={ev.status ?? "draft"} canPublish={tc.canPublish} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
