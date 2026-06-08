// src/components/category-cards.tsx
import Link from "next/link";
import { db } from "@/db";
import { categories } from "@/db/schema";

function IconArrow() { return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="2" y1="8" x2="14" y2="8"/><polyline points="9 3 14 8 9 13"/></svg>; }

const CAT_COLORS = [
  { bg:"rgba(201,160,96,0.06)",  border:"rgba(201,160,96,0.2)",  text:"#c9a060",  hover:"rgba(201,160,96,0.1)" },
  { bg:"rgba(106,170,56,0.06)",  border:"rgba(106,170,56,0.2)",  text:"#6aaa38",  hover:"rgba(106,170,56,0.1)" },
  { bg:"rgba(56,138,180,0.06)",  border:"rgba(56,138,180,0.2)",  text:"#3878b4",  hover:"rgba(56,138,180,0.1)" },
  { bg:"rgba(180,80,140,0.06)",  border:"rgba(180,80,140,0.2)",  text:"#b4508c",  hover:"rgba(180,80,140,0.1)" },
  { bg:"rgba(224,144,64,0.06)",  border:"rgba(224,144,64,0.2)",  text:"#e09040",  hover:"rgba(224,144,64,0.1)" },
  { bg:"rgba(80,160,180,0.06)",  border:"rgba(80,160,180,0.2)",  text:"#50a0b4",  hover:"rgba(80,160,180,0.1)" },
  { bg:"rgba(160,106,56,0.06)",  border:"rgba(160,106,56,0.2)",  text:"#a06a38",  hover:"rgba(160,106,56,0.1)" },
  { bg:"rgba(106,80,180,0.06)",  border:"rgba(106,80,180,0.2)",  text:"#6a50b4",  hover:"rgba(106,80,180,0.1)" },
  { bg:"rgba(100,100,100,0.06)", border:"rgba(100,100,100,0.2)", text:"#888",     hover:"rgba(100,100,100,0.1)" },
];

interface Props {
  baseHref?:   string;
  showHeading?: boolean;
  cols?:        2 | 3 | 4;
}

export async function CategoryCards({ baseHref="/jelajahi", showHeading=true, cols=3 }: Props) {
  const cats = await db.select().from(categories).orderBy(categories.name);
  const colClass = cols===2 ? "grid-cols-2 md:grid-cols-2" : cols===4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3";

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-16">
      {showHeading && (
        <div className="mb-12">
          <div className="text-[10px] text-[#c9a060] tracking-[0.18em] uppercase mb-3.5">Kategori Event</div>
          <h2 className="font-[family-name:var(--font-serif)] text-[clamp(32px,4vw,52px)] font-light text-[#f0e8d8] tracking-[-0.02em] leading-[1.15] mb-4">
            Temukan <em className="italic text-[#c9a060]">event</em> yang tepat
          </h2>
          <p className="text-[15px] text-[#555] leading-[1.8] max-w-[480px]">
            Dari edukasi hingga hiburan — temukan event yang sesuai minat dan kebutuhanmu.
          </p>
        </div>
      )}
      <div className={`grid gap-3.5 ${colClass}`}>
        {cats.map((cat, i) => {
          const c = CAT_COLORS[i % CAT_COLORS.length];
          return (
            <Link
              key={cat.id}
              href={`${baseHref}?category=${cat.slug}`}
              className="group relative flex flex-col bg-[#0f0f0f] rounded-[10px] px-6 py-7 no-underline overflow-hidden transition-all hover:-translate-y-[3px]"
              style={{
                border: `1px solid ${c.border}`,
                background: c.bg,
              }}
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] opacity-60 transition-opacity group-hover:opacity-100"
                style={{background:`linear-gradient(to right, transparent, ${c.text}, transparent)`}} />

              <span className="text-[34px] leading-none mb-4 block transition-transform group-hover:scale-110 duration-200">
                {cat.emoji}
              </span>
              <div className="font-[family-name:var(--font-serif)] text-xl font-light text-[#f0e8d8] mb-1.5 transition-colors"
                style={{}}>
                {cat.name}
              </div>
              <div className="text-[10px] tracking-[0.1em] uppercase mb-3.5" style={{color:c.text}}>
                {cat.slug}
              </div>
              <div className="mt-auto flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] transition-all group-hover:gap-2.5"
                style={{color:c.text}}>
                Jelajahi <IconArrow />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}