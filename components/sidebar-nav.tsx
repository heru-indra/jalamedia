"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { TIER_CONFIG } from "@/lib/tiers";
import type { PricingTier } from "@/lib/tiers";

function IconGrid()   { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>; }
function IconCal()    { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1.5" y="2.5" width="13" height="12" rx="2"/><line x1="1.5" y1="7" x2="14.5" y2="7"/><line x1="5" y1="1" x2="5" y2="4"/><line x1="11" y1="1" x2="11" y2="4"/></svg>; }
function IconPlus()   { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>; }
function IconChart()  { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><polyline points="1 11 5 7 9 10 15 4"/><line x1="1" y1="14" x2="15" y2="14"/></svg>; }
function IconLogout() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/><polyline points="10 11 14 8 10 5"/><line x1="6" y1="8" x2="14" y2="8"/></svg>; }
function IconStar()   { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><polygon points="8 1.5 10 6 15 6.5 11.5 10 12.5 15 8 12.5 3.5 15 4.5 10 1 6.5 6 6"/></svg>; }
function IconLogo()   { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#c9a060" strokeWidth="1.2"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><circle cx="11.5" cy="11.5" r="2.5"/></svg>; }

const NAV_LINKS = [
  { href: "/dashboard",            label: "Dashboard",   icon: <IconGrid />  },
  { href: "/dashboard/events",     label: "Event Saya",  icon: <IconCal />   },
  { href: "/dashboard/events/new", label: "Buat Event",  icon: <IconPlus />  },
  { href: "/dashboard/analytics",  label: "Analitik",    icon: <IconChart /> },
];

const TIER_COLORS: Record<string, string> = {
  free:       "text-[#555] bg-white/[0.04] border-[#2a2a2a]",
  basic:      "text-[#888] bg-white/[0.06] border-[#333]",
  pro:        "text-[#c9a060] bg-[rgba(201,160,96,0.1)] border-[rgba(201,160,96,0.3)]",
  commission: "text-[#6aaa38] bg-[rgba(106,170,56,0.1)] border-[rgba(106,170,56,0.3)]",
};

interface Props { userName: string; userEmail: string; userImage?: string | null; pricingTier: string; }

export function SidebarNav({ userName, userEmail, userImage, pricingTier }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const tier     = (pricingTier ?? "free") as PricingTier;
  const tierCfg  = TIER_CONFIG[tier];
  const tierCls  = TIER_COLORS[tier] ?? TIER_COLORS.free;

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
  }

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="w-60 min-h-dvh bg-[rgb(15,15,15)] border-r border-border flex flex-col shrink-0 font-mono">
      {/* Header */}
      <div className="px-5 pt-6 pb-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5 no-underline mb-5">
          <div className="w-8 h-8 border border-[rgba(201,160,96,0.35)] rounded-md flex items-center justify-center shrink-0">
            <IconLogo />
          </div>
          <span className="font-serif text-base font-light text-text tracking-widest uppercase">Eventara</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-full bg-bg-3 border border-border flex items-center justify-center text-[13px] text-[#888] shrink-0 overflow-hidden">
            {userImage ? <Image src={userImage} alt={userName} width={34} height={34} className="w-full h-full object-cover" /> : userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] text-text-2 truncate">{userName}</div>
            <div className="text-[11px] text-[#333] truncate mt-px">{userEmail}</div>
            <div className={`inline-flex items-center mt-1.5 px-2 py-px text-[10px] tracking-widest uppercase rounded border ${tierCls}`}>
              {tierCfg.label}{tierCfg.isCommission && " · 5%"}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        <div className="px-2.5 mb-1 mt-2.5 text-[10px] text-[#333] tracking-[0.16em] uppercase">Menu</div>
        {NAV_LINKS.map(link => (
          <Link key={link.href} href={link.href}
            className={`flex items-center gap-2.5 px-3 py-2.75 rounded-[7px] text-[13px] no-underline transition-all ${
              isActive(link.href)
                ? "text-text bg-white/6 border-l-2 border-gold pl-2.5"
                : "text-[#555] hover:text-text-2 hover:bg-white/4"
            }`}>
            {link.icon} {link.label}
          </Link>
        ))}
        {tier === "free" && (
          <>
            <div className="px-2.5 mb-1 mt-4 text-[10px] text-[#333] tracking-[0.16em] uppercase">Upgrade</div>
            <Link href="/dashboard/upgrade" className="flex items-center gap-2.5 px-3 py-2.75 rounded-[7px] text-[13px] text-[#555] hover:text-text-2 hover:bg-white/4 no-underline">
              <IconStar /> Upgrade Plan
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border">
        <button onClick={handleSignOut}
          className="flex items-center gap-2.5 w-full px-3 py-2.75 rounded-[7px] text-[13px] text-[#333] hover:text-red hover:bg-red-bg transition-all text-left cursor-pointer bg-transparent border-0 font-mono">
          <IconLogout /> Keluar
        </button>
      </div>
    </aside>
  );
}