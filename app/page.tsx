// src/app/page.tsx
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { CategoryCards } from "@/components/category-cards";

function IconArrow() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="2" y1="8" x2="14" y2="8"/><polyline points="9 3 14 8 9 13"/></svg>; }
function IconCheck() { return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="2 8.5 6 12 14 4"/></svg>; }
function IconX()     { return <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>; }

function PricingCard({ name, price, period, desc, features, cta, ctaHref, highlighted, badge, commissionNote }: {
  name:string; price:string; period:string; desc:string;
  features:{text:string;included:boolean}[]; cta:string; ctaHref:string;
  highlighted?:boolean; badge?:string; commissionNote?:string;
}) {
  const isCm = !!commissionNote;
  return (
    <div className={`flex-1 min-w-0 relative rounded-xl overflow-hidden p-7 ${highlighted?"bg-bg-3 border border-[rgba(201,160,96,0.4)]":isCm?"bg-[#0f110e] border border-[rgba(106,170,56,0.25)]":"bg-bg-2 border border-border"}`}>
      <div className="absolute top-0 left-0 right-0 h-0.5"
        style={{background:highlighted?"linear-gradient(to right,transparent,#c9a060,transparent)":isCm?"linear-gradient(to right,transparent,#6aaa38,transparent)":"linear-gradient(to right,transparent,#2a2a2a,transparent)"}} />
      {badge && (
        <span className={`absolute top-3.5 right-3.5 text-[9px] px-2.5 py-0.5 rounded border tracking-[0.12em] uppercase font-mono ${isCm?"bg-[rgba(106,170,56,0.12)] border-green-border text-green":"bg-gold-dim border-[rgba(201,160,96,0.3)] text-gold"}`}>{badge}</span>
      )}
      <div className="text-[10px] text-[#333] tracking-[0.18em] uppercase mb-2.5 font-mono">{name}</div>
      <div className={`font-serif text-[46px] font-light leading-none tracking-[-0.03em] mb-1 ${highlighted?"text-text":isCm?"text-green":"text-[#555]"}`}>{price}</div>
      <div className="text-[11px] text-[#333] tracking-[0.06em] mb-2 font-mono">{period}</div>
      <p className="text-[13px] text-[#555] leading-[1.7] mb-4 pb-4 border-b border-bg-4 font-mono">{desc}</p>
      <div className="flex flex-col gap-2 mb-4">
        {features.map((f,i) => (
          <div key={i} className={`flex items-center gap-2 text-[13px] font-mono ${f.included?"text-[#888]":"text-border-3"}`}>
            <span className={`w-4.5 h-4.5 rounded flex items-center justify-center shrink-0 ${f.included?"bg-[rgba(106,170,56,0.12)] border border-green-border text-green":"bg-white/3 border border-border text-border-3"}`}>{f.included?<IconCheck/>:<IconX/>}</span>
            {f.text}
          </div>
        ))}
      </div>
      {commissionNote && (
        <div className="mb-3.5 px-3 py-2.5 bg-[rgba(106,170,56,0.06)] border border-[rgba(106,170,56,0.15)] rounded-md text-[11px] text-[#5a8830] leading-[1.7] font-mono">💡 {commissionNote}</div>
      )}
      <Link href={ctaHref} className={`flex items-center justify-center gap-2 px-5 py-3 rounded-[7px] text-[13px] tracking-widest uppercase no-underline transition-all font-mono ${highlighted?"bg-gold text-[#0d0d0d] hover:bg-gold-light":isCm?"bg-[rgba(106,170,56,0.12)] border border-[rgba(106,170,56,0.4)] text-green hover:bg-[rgba(106,170,56,0.18)]":"bg-transparent border border-border-2 text-[#555] hover:border-[#333] hover:text-[#888]"}`}>{cta} <IconArrow /></Link>
    </div>
  );
}

function FeatureCard({ emoji, title, desc, tags }: { emoji:string; title:string; desc:string; tags?:string[] }) {
  return (
    <div className="bg-bg-2 border border-border rounded-[10px] p-7">
      <div className="text-[32px] mb-4">{emoji}</div>
      <div className="font-serif text-xl font-light text-text mb-2.5">{title}</div>
      <p className="text-[13px] text-[#555] leading-[1.8] mb-4 font-mono">{desc}</p>
      {tags?.length && (
        <div className="flex gap-1.5 flex-wrap">
          {tags.map(t=><span key={t} className="text-[10px] px-2.5 py-0.5 bg-[rgba(201,160,96,0.08)] border border-[rgba(201,160,96,0.2)] rounded text-gold tracking-widest uppercase font-mono">{t}</span>)}
        </div>
      )}
    </div>
  );
}

function IconLogo() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#c9a060" strokeWidth="1.2"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><circle cx="11.5" cy="11.5" r="2.5"/></svg>; }

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-dvh flex flex-col items-center justify-center text-center px-10 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0"
            style={{backgroundImage:"linear-gradient(rgba(201,160,96,0.03) 1px, transparent 1px),linear-gradient(90deg, rgba(201,160,96,0.03) 1px, transparent 1px)",backgroundSize:"60px 60px",maskImage:"radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 80%)"}} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-100"
            style={{background:"radial-gradient(ellipse, rgba(201,160,96,0.06) 0%, transparent 70%)"}} />
        </div>
        <div className="relative z-10 max-w-225">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[rgba(201,160,96,0.08)] border border-[rgba(201,160,96,0.2)] rounded-full text-[13px] text-gold tracking-widest uppercase mb-9 animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse-dot" />
            Platform Event Organizer Indonesia
          </div>
          <h1 className="font-serif text-[clamp(42px,8vw,72px)] font-light text-text leading-[1.05] tracking-[-0.03em] mb-7 animate-fade-up delay-100"
            style={{textShadow:"0 2px 20px rgba(0,0,0,0.4)"}}>
            Buat event yang<br /><em className="italic text-gold">tak terlupakan</em>
            <span className="block text-[rgba(240,232,216,0.45)]">dimulai dari sini.</span>
          </h1>
          <p className="text-[17px] text-white/45 leading-[1.8] max-w-130 mx-auto mb-14 animate-fade-up delay-200">
            Dari workshop kecil hingga konferensi ribuan peserta — Eventara hadir sebagai mitra terpercaya.
          </p>
          <div className="flex items-center justify-center gap-3.5 flex-wrap animate-fade-up delay-300">
            <Link href="/register" className="inline-flex items-center gap-2.5 px-8 py-4 bg-gold rounded-[7px] text-[#0d0d0d] text-[15px] tracking-widest uppercase no-underline hover:bg-gold-light transition-colors">
              Mulai sekarang <IconArrow />
            </Link>
            <Link href="/jelajahi" className="inline-flex items-center gap-2.5 px-7 py-4 bg-white/[0.07] border border-white/[0.14] rounded-[7px] text-[#888] text-[15px] tracking-widest uppercase no-underline backdrop-blur-sm hover:border-white/28 hover:text-text transition-all">
              Jelajahi event
            </Link>
          </div>
          <div className="flex items-center justify-center gap-14 mt-20 pt-12 border-t border-white/6 flex-wrap animate-fade-up delay-400">
            {[["2.4K+","Event Aktif"],["18K+","Organizer"],["340K+","Peserta"]].map(([n,l],i)=>(
              <>
                {i>0 && <div key={`d${i}`} className="w-px h-8 bg-white/[0.07]" />}
                <div key={l} className="text-center">
                  <div className="font-serif text-[42px] font-light text-text leading-none tracking-[-0.03em] mb-1.5">{n}</div>
                  <div className="text-[10px] text-white/30 tracking-[0.16em] uppercase">{l}</div>
                </div>
              </>
            ))}
          </div>
        </div>
        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
          <span className="text-[9px] text-[#333] tracking-[0.16em] uppercase">Scroll</span>
          <div className="w-px h-9 animate-scroll-line" style={{background:"linear-gradient(to bottom, #252525, transparent)"}} />
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-[#0d0d0d] border-y border-bg-3">
        <div className="max-w-300 mx-auto px-10 py-20">
          <div className="max-w-120 mb-14">
            <div className="text-[10px] text-gold tracking-[0.18em] uppercase mb-4">Fitur Platform</div>
            <h2 className="font-serif text-[clamp(32px,4vw,52px)] font-light text-text tracking-[-0.02em] leading-[1.15] mb-4">
              Semua yang Anda <em className="italic text-gold">butuhkan</em>
            </h2>
            <p className="text-[15px] text-[#555] leading-[1.8]">Dashboard lengkap untuk mengelola event dari awal hingga akhir.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard emoji="📅" title="Manajemen Event" desc="Buat, edit, dan publish event dalam hitungan menit." tags={["Draft","Published","Cancelled"]} />
            <FeatureCard emoji="🖼" title="Upload Gambar" desc="Cover banner, galeri foto, dan logo organizer via Cloudinary." tags={["Cloudinary","WebP","Auto-compress"]} />
            <FeatureCard emoji="🗺" title="Google Maps" desc="Preview lokasi real-time langsung di form buat event." />
            <FeatureCard emoji="📊" title="Analitik" desc="Pantau performa event: view, tiket terjual, pendapatan." />
            <FeatureCard emoji="🔐" title="Auth & Keamanan" desc="Login email atau Google OAuth. Session timeout otomatis." tags={["Better Auth","Google OAuth"]} />
            <FeatureCard emoji="💳" title="Sistem Tier" desc="4 paket: Free, Basic, Pro, dan Komisi — bayar sesuai kebutuhan." tags={["Free","Basic","Pro","Komisi"]} />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-bg-3">
        <div className="max-w-300 mx-auto px-10 py-20">
          <div className="text-center mb-14">
            <div className="text-[10px] text-gold tracking-[0.18em] uppercase mb-4">Cara Kerja</div>
            <h2 className="font-serif text-[clamp(32px,4vw,52px)] font-light text-text tracking-[-0.02em]">
              Tiga langkah <em className="italic text-gold">sederhana</em>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative">
            <div className="absolute top-7 left-[10%] right-[10%] h-px hidden md:block"
              style={{background:"linear-gradient(to right, transparent, #1e1e1e 20%, #1e1e1e 80%, transparent)"}} />
            {[
              {n:"1",t:"Daftar gratis",   d:"Buat akun dalam 30 detik. Tidak perlu kartu kredit."},
              {n:"2",t:"Buat event",       d:"Isi detail, upload gambar, dan set harga. Tersimpan sebagai draft."},
              {n:"3",t:"Publish & promosi",d:"Publish ke halaman publik dan bagikan link ke audiens Anda."},
              {n:"4",t:"Kelola & analisis",d:"Monitor performa event lewat dashboard."},
            ].map(s=>(
              <div key={s.n} className="flex flex-col items-center text-center relative z-10">
                <div className="w-14 h-14 rounded-full bg-bg-2 border border-border flex items-center justify-center font-serif text-xl font-light text-gold mb-6">{s.n}</div>
                <div className="font-serif text-xl font-light text-text mb-2.5">{s.t}</div>
                <p className="text-[13px] text-[#555] leading-[1.7] font-mono">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <div className="border-b border-bg-3">
        <CategoryCards baseHref="/jelajahi" showHeading={true} cols={3} />
      </div>

      {/* PRICING */}
      <section className="border-b border-bg-3" id="harga">
        <div className="max-w-300 mx-auto px-10 py-20">
          <div className="max-w-120 mb-14">
            <div className="text-[10px] text-gold tracking-[0.18em] uppercase mb-4">Harga</div>
            <h2 className="font-serif text-[clamp(32px,4vw,52px)] font-light text-text tracking-[-0.02em] leading-[1.15]">
              Mulai <em className="italic text-gold">gratis,</em><br />upgrade kapan saja
            </h2>
          </div>
          <div className="flex gap-3.5 flex-wrap">
            <PricingCard name="Free" price="Rp 0" period="selamanya gratis" desc="Untuk individu yang baru memulai."
              features={[{text:"Hingga 3 event",included:true},{text:"Muncul di listing publik",included:true},{text:"Upload 1 cover image",included:true},{text:"Tampilan listing premium",included:false},{text:"Featured di homepage",included:false}]}
              cta="Mulai gratis" ctaHref="/register" />
            <PricingCard name="Basic" price="Rp 99K" period="per bulan" desc="Untuk organizer aktif yang ingin menjangkau lebih luas."
              features={[{text:"20 event aktif",included:true},{text:"Tampilan listing premium",included:true},{text:"Cover + 4 foto galeri",included:true},{text:"Analitik dasar",included:true},{text:"Featured di homepage",included:false}]}
              cta="Pilih Basic" ctaHref="/register?plan=basic" highlighted badge="Populer" />
            <PricingCard name="Pro" price="Rp 299K" period="per bulan" desc="Untuk organizer profesional skala besar."
              features={[{text:"Event tak terbatas",included:true},{text:"Tampilan listing premium",included:true},{text:"Cover + 20 foto galeri",included:true},{text:"Featured di homepage",included:true},{text:"Analitik lengkap & ekspor",included:true}]}
              cta="Pilih Pro" ctaHref="/register?plan=pro" />
            <PricingCard name="Komisi" price="5%" period="per tiket terjual" desc="Tanpa biaya bulanan. Bayar hanya saat tiket laku."
              features={[{text:"Event tak terbatas",included:true},{text:"Tampilan listing premium",included:true},{text:"Cover + 20 foto galeri",included:true},{text:"Tanpa biaya bulanan",included:true},{text:"Featured di homepage",included:false}]}
              cta="Pilih Komisi" ctaHref="/register?plan=commission" badge="Fleksibel"
              commissionNote="Platform ambil 5% per tiket terjual. Tidak ada biaya jika tidak ada tiket terjual." />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden text-center py-32 px-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-75"
            style={{background:"radial-gradient(ellipse, rgba(201,160,96,0.08) 0%, transparent 70%)"}} />
        </div>
        <div className="relative z-10 max-w-150 mx-auto">
          <h2 className="font-serif text-[clamp(32px,5vw,56px)] font-light text-text leading-[1.1] tracking-[-0.02em] mb-5">
            Siap membuat event<br /><em className="italic text-gold">pertama Anda?</em>
          </h2>
          <p className="text-[15px] text-[#555] leading-[1.8] mb-11">Bergabung dengan ribuan event organizer. Gratis untuk memulai.</p>
          <div className="flex items-center justify-center gap-3.5 flex-wrap">
            <Link href="/register" className="inline-flex items-center gap-2.5 px-8 py-4 bg-gold rounded-[7px] text-[#0d0d0d] text-[15px] tracking-widest uppercase no-underline hover:bg-gold-light transition-colors">
              Daftar sekarang — gratis <IconArrow />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2.5 px-7 py-4 bg-white/[0.07] border border-white/[0.14] rounded-[7px] text-[#888] text-[15px] tracking-widest uppercase no-underline hover:text-text transition-all">
              Sudah punya akun?
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-bg-3">
        <div className="max-w-300 mx-auto px-10 py-15">
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-13 mb-14">
            <div>
              <div className="flex items-center gap-2.5 font-serif text-xl font-light text-text tracking-widest uppercase mb-3.5">
                <div className="w-7 h-7 border border-[rgba(201,160,96,0.4)] rounded-[5px] flex items-center justify-center"><IconLogo /></div>
                Eventara
              </div>
              <p className="text-[13px] text-[#333] leading-[1.8] max-w-60 font-mono">Platform event organizer terpercaya untuk profesional Indonesia.</p>
            </div>
            {[
              {title:"Platform", links:[["Fitur","#"],["Harga","#harga"],["Jelajahi Event","/jelajahi"]]},
              {title:"Akun",     links:[["Masuk","/login"],["Daftar","/register"],["Dashboard","/dashboard"]]},
              {title:"Hukum",   links:[["Privasi","#"],["Ketentuan","#"],["Kontak","#"]]},
            ].map(col=>(
              <div key={col.title}>
                <div className="text-[10px] text-[#555] tracking-[0.16em] uppercase mb-4 font-mono">{col.title}</div>
                <div className="flex flex-col gap-2.5">
                  {col.links.map(([l,h])=><Link key={l} href={h} className="text-[13px] text-[#333] no-underline hover:text-[#888] transition-colors font-mono">{l}</Link>)}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-8 border-t border-bg-3 text-[11px] text-[#333] flex-wrap gap-3 font-mono">
            <span>© 2026 Eventara. All rights reserved.</span>
            <div className="flex gap-6">
              {["Privacy","Terms"].map(l=><Link key={l} href="#" className="text-[#333] no-underline hover:text-[#888] transition-colors">{l}</Link>)}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}