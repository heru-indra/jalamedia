"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function IconMenu()  { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="2" y1="5" x2="16" y2="5"/><line x1="2" y1="9" x2="16" y2="9"/><line x1="2" y1="13" x2="16" y2="13"/></svg>; }
function IconX()     { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="3" y1="3" x2="15" y2="15"/><line x1="15" y1="3" x2="3" y2="15"/></svg>; }
function IconLogo()  { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#c9a060" strokeWidth="1.2"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><circle cx="11.5" cy="11.5" r="2.5"/></svg>; }

const NAV_LINKS = [
  { label: "Beranda",  href: "/" },
  { label: "Event",    href: "/jelajahi" },
  { label: "Harga",    href: "/#harga" },
];

export function Navbar() {
  const pathname   = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open,     setOpen]     = useState(false);
  const [session,  setSession]  = useState<{ user: { name: string } } | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    authClient.getSession().then(({ data }) => setSession(data));
  }, []);

  useEffect(() => { if (open) document.body.style.overflow = "hidden"; else document.body.style.overflow = ""; return () => { document.body.style.overflow = ""; }; }, [open]);

  return (
    <>
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-bg/93 backdrop-blur-xl border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}>
        <div className="max-w-300 mx-auto px-11 h-17.5 flex items-center">
          <Link href="/" className="flex items-center gap-3 mr-auto no-underline group">
            <div className="w-9 h-9 border border-[rgba(201,160,96,0.4)] rounded-[7px] flex items-center justify-center transition-colors group-hover:border-gold">
              <IconLogo />
            </div>
            <span className="font-serif text-xl font-light text-text tracking-widest uppercase">Eventara</span>
          </Link>
          <div className="hidden md:flex items-center gap-0.5 mx-9">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href}
                className={`relative px-4 py-2.5 text-[13px] tracking-widest uppercase rounded no-underline transition-colors ${pathname === link.href ? "text-text" : "text-[#555] hover:text-text-2 hover:bg-white/4"}`}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-2">
            {session ? (
              <Link href="/dashboard" className="px-5 py-2.5 bg-gold-bg border border-gold-border rounded text-gold text-[13px] tracking-widest uppercase no-underline hover:bg-[rgba(201,160,96,0.12)]">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="px-5 py-2.5 border border-border rounded text-[#888] text-[13px] tracking-widest uppercase no-underline hover:border-border-3 hover:text-text-2">Masuk</Link>
                <Link href="/register" className="px-5 py-2.5 bg-gold rounded text-bg text-[13px] tracking-widest uppercase no-underline hover:bg-gold-light">Daftar</Link>
              </>
            )}
          </div>
          <button className="md:hidden ml-3.5 w-10 h-10 border border-border rounded flex items-center justify-center text-[#888] hover:text-text hover:border-border-2" onClick={() => setOpen(v => !v)}>
            {open ? <IconX /> : <IconMenu />}
          </button>
        </div>
      </nav>
      {open && <div className="md:hidden fixed inset-0 bg-black/60 z-99 backdrop-blur-sm" onClick={() => setOpen(false)} />}
      <div className={`md:hidden fixed top-0 right-0 h-dvh w-[min(320px,85vw)] bg-bg-2 border-l border-border z-100 flex flex-col p-6 transition-transform duration-280 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="flex items-center gap-2.5 no-underline" onClick={() => setOpen(false)}>
            <div className="w-8 h-8 border border-[rgba(201,160,96,0.35)] rounded-md flex items-center justify-center"><IconLogo /></div>
            <span className="font-serif text-base font-light text-text tracking-widest uppercase">Eventara</span>
          </Link>
          <button onClick={() => setOpen(false)} className="text-[#555] hover:text-text"><IconX /></button>
        </div>
        <div className="flex flex-col gap-0.5 flex-1">
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
              className={`flex items-center px-3.5 py-4 text-[15px] tracking-widest uppercase rounded-[7px] no-underline border-b border-bg-3 ${pathname === link.href ? "text-gold" : "text-[#555] hover:text-text hover:bg-white/3"}`}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className="border-t border-border pt-5 flex flex-col gap-2.5">
          {session ? (
            <Link href="/dashboard" onClick={() => setOpen(false)} className="block py-4 px-5 bg-gold-bg border border-gold-border rounded-[7px] text-gold text-[15px] tracking-widest uppercase text-center no-underline">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="block py-4 px-5 border border-border-2 rounded-[7px] text-[#888] text-[15px] tracking-widest uppercase text-center no-underline">Masuk</Link>
              <Link href="/register" onClick={() => setOpen(false)} className="block py-4 px-5 bg-gold rounded-[7px] text-bg text-[15px] tracking-widest uppercase text-center no-underline hover:bg-gold-light">Daftar</Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}