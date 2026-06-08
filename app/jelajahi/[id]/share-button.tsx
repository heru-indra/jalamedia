"use client";
import { useState } from "react";
function IconShare() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="13" cy="3" r="1.5"/><circle cx="3" cy="8" r="1.5"/><circle cx="13" cy="13" r="1.5"/><line x1="4.4" y1="7.1" x2="11.6" y2="4"/><line x1="4.4" y1="9" x2="11.6" y2="12.1"/></svg>; }
function IconCheck() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="2.5 8.5 6 12 13.5 4"/></svg>; }
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title, url }); return; } catch {} }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(()=>setCopied(false),2500); } catch {}
  }
  return (
    <button onClick={handleShare}
      className={`flex items-center justify-center gap-2 w-full py-3.5 border rounded-[7px] text-[13px] tracking-widest uppercase cursor-pointer transition-all font-[family-name:var(--font-mono)] bg-transparent ${copied?"border-[rgba(106,170,56,0.3)] text-[#6aaa38]":"border-[#252525] text-[#555] hover:border-[#2e2e2e] hover:text-[#888]"}`}>
      {copied ? <><IconCheck />Link tersalin!</> : <><IconShare />Bagikan event</>}
    </button>
  );
}