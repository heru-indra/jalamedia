"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishEvent, unpublishEvent, deleteEvent } from "@/actions/event";
function IconEye()    { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>; }
function IconEyeOff() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M13.4 13.4L2.6 2.6M6.5 6.5a2 2 0 0 0 3 3M1 8s2-3.9 5.5-4.8M10 5.2C12.1 6 14.1 8 14.1 8s-2.5 5-6.1 5c-.8 0-1.6-.2-2.3-.5"/></svg>; }
function IconTrash()  { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><polyline points="2 4 14 4"/><path d="M5 4V2h6v2"/><path d="M3 4l1 10h8l1-10"/></svg>; }
interface Props { eventId: string; status: string; canPublish: boolean; }
export function EventDetailActions({ eventId, status, canPublish }: Props) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState<string|null>(null);
  async function handlePublish() {
    setErr(null);
    start(async () => {
      const r = status === "published" ? await unpublishEvent(eventId) : await publishEvent(eventId);
      if (r.success) router.refresh(); else setErr(r.error);
    });
  }
  async function handleDelete() {
    if (!confirm) return setConfirm(true);
    start(async () => {
      const r = await deleteEvent(eventId);
      if (r.success) router.push("/dashboard/events"); else setErr(r.error);
    });
  }
  return (
    <div className="flex flex-col gap-2 items-end">
      {err && <div className="text-[11px] text-[#e05a5a] bg-[rgba(224,90,90,0.08)] border border-[rgba(224,90,90,0.2)] rounded px-2.5 py-1">{err}</div>}
      <div className="flex items-center gap-2">
        {canPublish && (
          <button onClick={handlePublish} disabled={isPending}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded text-[11px] tracking-[0.08em] uppercase cursor-pointer border transition-all font-[family-name:var(--font-mono)] disabled:opacity-40 bg-transparent ${status==="published"?"border-[rgba(201,160,96,0.3)] text-[#c9a060] hover:bg-[rgba(201,160,96,0.06)]":"border-[rgba(106,170,56,0.3)] text-[#6aaa38] hover:bg-[rgba(106,170,56,0.08)]"}`}>
            {status==="published" ? <><IconEyeOff />Unpublish</> : <><IconEye />Publish</>}
          </button>
        )}
        <button onClick={handleDelete} disabled={isPending}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded text-[11px] tracking-[0.08em] uppercase cursor-pointer border transition-all font-[family-name:var(--font-mono)] disabled:opacity-40 bg-transparent ${confirm?"border-[rgba(224,90,90,0.4)] text-[#e05a5a] bg-[rgba(224,90,90,0.06)]":"border-[#252525] text-[#333] hover:border-[rgba(224,90,90,0.3)] hover:text-[#e05a5a]"}`}>
          <IconTrash />{confirm ? "Konfirmasi?" : "Hapus"}
        </button>
        {confirm && <button onClick={()=>setConfirm(false)} className="text-[11px] text-[#555] cursor-pointer bg-transparent border-0 hover:text-[#888] transition-colors">Batal</button>}
      </div>
    </div>
  );
}