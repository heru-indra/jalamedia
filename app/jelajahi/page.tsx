// src/app/jelajahi/page.tsx
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { CategoryCards } from "@/components/category-cards";
import { db } from "@/db";
import { events, categories, user } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { TIER_CONFIG } from "@/lib/tiers";
import type { PricingTier } from "@/lib/tiers";

function fmtDate(d:Date){ return new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"short",year:"numeric"}).format(d); }
function fmtPrice(p:string|null){ const n=Number(p); if(!n) return "Gratis"; return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n); }

function IconCal() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1" y="1.5" width="10" height="9" rx="1.5"/><line x1="1" y1="5" x2="11" y2="5"/><line x1="4" y1="0" x2="4" y2="3"/><line x1="8" y1="0" x2="8" y2="3"/></svg>; }
function IconPin() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M6 1a3.5 3.5 0 0 1 3.5 3.5C9.5 7.5 6 11 6 11S2.5 7.5 2.5 4.5A3.5 3.5 0 0 1 6 1z"/><circle cx="6" cy="4.5" r="1.2"/></svg>; }

interface Props { searchParams: Promise<{category?:string}>; }

export default async function JelajahiPage({ searchParams }: Props) {
  const { category: slug } = await searchParams;
  const activeCat = slug ? await db.select().from(categories).where(eq(categories.slug, slug)).then(r=>r[0]??null) : null;
  const conds = [eq(events.status,"published")];
  if (activeCat) conds.push(eq(events.categoryId, activeCat.id));
  const rows = await db.select({ event:events, category:categories, organizer:user })
    .from(events).leftJoin(categories, eq(events.categoryId, categories.id))
    .leftJoin(user, eq(events.userId, user.id)).where(and(...conds)).orderBy(desc(events.startDate)).limit(48);

  const premium  = rows.filter(r => TIER_CONFIG[(r.organizer?.pricingTier??"free") as PricingTier].listingStyle==="premium");
  const standard = rows.filter(r => TIER_CONFIG[(r.organizer?.pricingTier??"free") as PricingTier].listingStyle==="standard");

  return (
    <>
      <Navbar />
      {/* Hero */}
      <div className="max-w-300 mx-auto px-10 pt-32 pb-16 text-center">
        <div className="inline-flex items-center gap-2 text-[10px] text-gold tracking-[0.18em] uppercase mb-3.5">Jelajahi Event</div>
        <h1 className="font-serif text-[clamp(36px,5vw,64px)] font-light text-text tracking-[-0.02em] leading-[1.1] mb-4">
          {activeCat ? <>{activeCat.emoji} <em className="italic text-gold">{activeCat.name}</em></> : <>Event <em className="italic text-gold">terbaik</em> untukmu</>}
        </h1>
        <p className="text-[15px] text-[#555] leading-[1.8] max-w-120 mx-auto">
          {activeCat ? `Semua event ${activeCat.name} yang sedang berlangsung.` : "Temukan workshop, konferensi, festival, dan berbagai event menarik dari seluruh Indonesia."}
        </p>
      </div>

      {activeCat ? (
        <div className="flex items-center justify-between max-w-300 mx-auto px-10 py-4 bg-[rgba(201,160,96,0.06)] border-y border-gold-dim flex-wrap gap-3">
          <div className="flex items-center gap-3 text-[15px] text-gold">
            <span className="text-[22px]">{activeCat.emoji}</span>
            Kategori <strong className="font-normal text-text">{activeCat.name}</strong>
          </div>
          <Link href="/jelajahi" className="text-[11px] text-[#555] tracking-[0.08em] uppercase no-underline px-3.5 py-1.5 border border-[#252525] rounded-full hover:text-[#f0e8d8] hover:border-[#555] transition-all">✕ Lihat semua</Link>
        </div>
      ) : (
        <div className="border-t border-bg-3">
          <CategoryCards baseHref="/jelajahi" showHeading={false} cols={3} />
        </div>
      )}

      <div className="border-t border-bg-3" />

      <div className="max-w-300 mx-auto px-10 py-14">
        {rows.length === 0 ? (
          <div className="py-18 text-center border border-bg-3 rounded-[10px] bg-bg-2">
            <div className="text-4xl mb-4">🔍</div>
            <div className="font-serif text-xl font-light text-[#555] mb-2">Belum ada event</div>
            <p className="text-[13px] text-[#333]">Belum ada event yang dipublikasi saat ini.</p>
          </div>
        ) : (
          <>
            {/* Premium */}
            {premium.length > 0 && (
              <div className="mb-14">
                <div className="flex items-center gap-4 mb-7">
                  <span className="font-[family-name:var(--font-serif)] text-2xl font-light text-[#f0e8d8] whitespace-nowrap">Event <em className="italic text-[#c9a060]">Unggulan</em></span>
                  <div className="flex-1 h-px bg-[#141414]" />
                  <span className="text-[10px] text-[#333] tracking-[0.1em] whitespace-nowrap">{premium.length} event</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {premium.map(({ event:ev, category:cat, organizer:org }) => {
                    const price = Number(ev.ticketPrice);
                    return (
                      <Link key={ev.id} href={`/jelajahi/${ev.id}`}
                        className="flex flex-col bg-[#0f0f0f] border border-[#1e1e1e] rounded-[12px] overflow-hidden no-underline transition-all hover:border-[#2e2e2e] hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
                        <div className="relative bg-[#1a1a1a] overflow-hidden" style={{aspectRatio:"16/9"}}>
                          {ev.coverImage ? (
                            <Image src={ev.coverImage} alt={ev.title} fill style={{objectFit:"cover"}} sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-[44px]"
                              style={{background:"radial-gradient(ellipse at 50% 120%, rgba(201,160,96,0.1), transparent)"}}>
                              {cat?.emoji??"📅"}
                            </div>
                          )}
                          {cat && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/65 border border-white/[0.08] backdrop-blur-md text-[11px] text-[#c0b8a8] uppercase tracking-[0.06em]">{cat.emoji} {cat.name}</span>}
                          {ev.isFeatured && <span className="absolute top-3 right-3 px-2.5 py-1 bg-[rgba(201,160,96,0.88)] text-[#0a0a0a] text-[9px] tracking-[0.1em] uppercase rounded">★ Featured</span>}
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          <div className="font-[family-name:var(--font-serif)] text-xl font-light text-[#f0e8d8] leading-[1.3] mb-3 line-clamp-2 group-hover:text-[#c9a060] transition-colors">{ev.title}</div>
                          <div className="flex flex-col gap-1.5 flex-1 mb-4">
                            <div className="flex items-center gap-2 text-[13px] text-[#555]"><IconCal />{fmtDate(new Date(ev.startDate))}</div>
                            <div className="flex items-center gap-2 text-[13px] text-[#555]"><IconPin />{ev.location.length>32?ev.location.slice(0,32)+"…":ev.location}</div>
                          </div>
                          <div className="flex items-center justify-between pt-3.5 border-t border-[#141414]">
                            <span className={`font-[family-name:var(--font-serif)] text-xl font-light ${price===0?"text-[#6aaa38]":"text-[#f0e8d8]"}`}>{price===0?"Gratis":`Rp ${price.toLocaleString("id-ID")}`}</span>
                            {org && <span className="text-[10px] text-[#333] truncate max-w-[120px]">{org.name}</span>}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Standard */}
            {standard.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-7">
                  <span className="font-[family-name:var(--font-serif)] text-2xl font-light text-[#f0e8d8] whitespace-nowrap">Event Lainnya</span>
                  <div className="flex-1 h-px bg-[#141414]" />
                  <span className="text-[10px] text-[#333] tracking-[0.1em] whitespace-nowrap">{standard.length} event</span>
                </div>
                <div className="bg-[#0d0d0d] border border-[#141414] rounded-[10px] overflow-hidden">
                  <div className="hidden md:grid grid-cols-[1fr_130px_120px_90px] px-5 py-2.5 border-b border-[#141414] text-[10px] text-[#333] tracking-[0.16em] uppercase">
                    <span>Nama Event</span><span>Tanggal</span><span>Lokasi</span><span className="text-right">Harga</span>
                  </div>
                  {standard.map(({ event:ev, category:cat }) => {
                    const price = Number(ev.ticketPrice);
                    return (
                      <Link key={ev.id} href={`/jelajahi/${ev.id}`}
                        className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_130px_120px_90px] items-center px-5 py-4 border-b border-[#0d0d0d] last:border-0 no-underline hover:bg-white/[0.018] transition-colors">
                        <div className="min-w-0">
                          <div className="text-[15px] text-[#c0b8a8] truncate mb-1 hover:text-[#f0e8d8] transition-colors">{ev.title}</div>
                          {cat && <div className="text-[10px] text-[#333]">{cat.emoji} {cat.name}</div>}
                        </div>
                        <div className="hidden md:block text-[13px] text-[#333]">{fmtDate(new Date(ev.startDate))}</div>
                        <div className="hidden md:block text-[13px] text-[#2a2a2a] truncate">{ev.location.length>22?ev.location.slice(0,22)+"…":ev.location}</div>
                        <div className={`text-[13px] text-right ${price===0?"text-[#6aaa38]":"text-[#555]"}`}>{fmtPrice(ev.ticketPrice)}</div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}