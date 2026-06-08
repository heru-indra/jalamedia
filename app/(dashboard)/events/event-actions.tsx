"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishEvent, unpublishEvent, deleteEvent } from "@/actions/event";
function IconEye()    { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>; }
function IconEyeOff() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M13.4 13.4L2.6 2.6M6.5 6.5a2 2 0 0 0 3 3M1 8s2-3.9 5.5-4.8M10 5.2C12.1 6 14.1 8 14.1 8s-2.5 5-6.1 5"/></svg>; }
function IconLink()   { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M7 9a3 3 0 0 0 4.5.3l2-2a3 3 0 0 0-4.2-4.2l-1.1 1.1"/><path d="M9 7a3 3 0 0 0-4.5-.3l-2 2a3 3 0 0 0 4.2 4.2l1.1-1.1"/></svg>; }
interface Props { eventId: string; status: string; canPublish: boolean; }
export function EventActions({ eventId, status, canPublish }: Props) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  function handle(fn: ()=>Promise<unknown>) {
    start(async () => { await fn(); router.refresh(); });
  }
  return (
    <div className="flex items-center gap-1.5">
      {canPublish && (
        <button onClick={()=>handle(()=>status==="published"?unpublishEvent(eventId):publishEvent(eventId))} disabled={isPending}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] tracking-[0.08em] uppercase cursor-pointer border transition-all font-[family-name:var(--font-mono)] disabled:opacity-40 bg-transparent ${status==="published"?"border-[rgba(201,160,96,0.25)] text-[#c9a060] hover:bg-[rgba(201,160,96,0.06)]":"border-[rgba(106,170,56,0.25)] text-[#6aaa38] hover:bg-[rgba(106,170,56,0.06)]"}`}>
          {status==="published" ? <><IconEyeOff/>Unpublish</> : <><IconEye/>Publish</>}
        </button>
      )}
      {status==="published" && (
        <a href={`/jelajahi/${eventId}`} target="_blank"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] tracking-[0.08em] uppercase border border-[#252525] text-[#555] hover:border-[#2e2e2e] hover:text-[#888] transition-all no-underline font-[family-name:var(--font-mono)]">
          <IconLink/>Lihat
        </a>
      )}
    </div>
  );
}