"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

export type UploadType = "cover" | "gallery" | "logo";
export interface UploadedImage { url: string; publicId: string; }

interface SingleProps {
  type: UploadType; name: string; label: string;
  hint?: string; defaultUrl?: string;
  aspectRatio?: string; maxSizeMB?: number;
  onChange?: (url: string) => void;
}

export function SingleImageUpload({
  type, name, label, hint, defaultUrl, aspectRatio="16/9", maxSizeMB=5, onChange,
}: SingleProps) {
  const [url,      setUrl]      = useState(defaultUrl ?? "");
  const [uploading,setUploading] = useState(false);
  const [error,    setError]     = useState<string|null>(null);
  const [dragging, setDragging]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isLogo = type === "logo";

  const upload = useCallback(async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) return setError("Hanya file gambar yang diizinkan.");
    if (file.size > maxSizeMB * 1024 * 1024) return setError(`Ukuran maksimal ${maxSizeMB} MB.`);
    setUploading(true);
    const fd = new FormData(); fd.append("file", file); fd.append("type", type);
    try {
      const res  = await fetch("/api/upload", { method:"POST", body:fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload gagal");
      setUrl(data.url); onChange?.(data.url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload gagal.");
    } finally { setUploading(false); }
  }, [type, maxSizeMB, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0]; if (file) upload(file);
  }, [upload]);

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      <div className={`text-[10px] text-[#555] tracking-[0.16em] uppercase mb-2 flex items-center gap-1.5`}>🖼 {label}</div>

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        className={`relative cursor-pointer overflow-hidden transition-all ${isLogo ? "rounded-full w-24" : "w-full rounded-[8px]"} ${dragging ? "border-[#c9a060] bg-[rgba(201,160,96,0.05)]" : url ? "border-[#2a2a2a]" : "border-[#1e1e1e]"} ${uploading ? "cursor-wait" : ""}`}
        style={{
          border: `1.5px dashed ${dragging ? "#c9a060" : url ? "#2a2a2a" : "#1e1e1e"}`,
          background: dragging ? "rgba(201,160,96,0.05)" : "#141414",
          aspectRatio: isLogo ? "1/1" : aspectRatio,
          width: isLogo ? "96px" : "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {url && (
          <Image src={url} alt="preview" fill style={{objectFit:"cover"}} sizes={isLogo?"96px":"(max-width:768px) 100vw,50vw"} />
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-2.5 z-10">
            <div className="w-7 h-7 rounded-full border-[2.5px] border-[rgba(201,160,96,0.2)] border-t-[#c9a060] animate-spin-slow" />
            <span className="text-[11px] text-[#c9a060] tracking-[0.08em] font-[family-name:var(--font-mono)]">Mengupload...</span>
          </div>
        )}

        {url && !uploading && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/45 flex items-center justify-center transition-all z-10">
            <span className="opacity-0 hover:opacity-100 text-[11px] text-[#f0e8d8] tracking-[0.1em] uppercase bg-black/60 px-3 py-1.5 rounded transition-opacity font-[family-name:var(--font-mono)]">
              Ganti gambar
            </span>
          </div>
        )}

        {!url && !uploading && (
          <div className="flex flex-col items-center gap-2.5 p-6 z-10">
            <div className="w-10 h-10 rounded-[8px] bg-[rgba(201,160,96,0.08)] border border-[rgba(201,160,96,0.2)] flex items-center justify-center text-[18px]">
              {isLogo ? "🏷" : "🖼"}
            </div>
            <div className="text-center">
              <div className="text-[12px] text-[#555] tracking-[0.04em] font-[family-name:var(--font-mono)] mb-1">
                {dragging ? "Lepaskan di sini" : "Klik atau drag & drop"}
              </div>
              <div className="text-[10px] text-[#333] tracking-[0.04em] font-[family-name:var(--font-mono)]">
                JPG, PNG, WebP · maks {maxSizeMB} MB
              </div>
            </div>
          </div>
        )}
      </div>

      {url && !uploading && (
        <button type="button" onClick={e => { e.stopPropagation(); setUrl(""); onChange?.(""); }}
          className="mt-2 px-3 py-1.5 bg-transparent border border-[#1e1e1e] rounded text-[#555] text-[10px] tracking-[0.1em] uppercase cursor-pointer hover:text-[#e05a5a] hover:border-[rgba(224,90,90,0.3)] transition-all font-[family-name:var(--font-mono)]">
          ✕ Hapus gambar
        </button>
      )}
      {error && <div className="mt-2 text-[11px] text-[#e05a5a] flex items-center gap-1.5 font-[family-name:var(--font-mono)]">⚠ {error}</div>}
      {hint && !error && <div className="mt-1.5 text-[11px] text-[#2e2e2e] font-[family-name:var(--font-mono)]">{hint}</div>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
    </div>
  );
}

interface GalleryProps {
  name: string; defaultUrls?: string[]; maxImages?: number; onChange?: (urls: string[]) => void;
}

export function GalleryUpload({ name, defaultUrls=[], maxImages=8, onChange }: GalleryProps) {
  const [images,    setImages]   = useState<UploadedImage[]>(defaultUrls.map((url,i) => ({ url, publicId:`existing_${i}` })));
  const [uploading, setUploading] = useState(false);
  const [error,     setError]    = useState<string|null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(async (files: FileList) => {
    const remaining = maxImages - images.length;
    const toUpload  = Array.from(files).slice(0, remaining);
    if (!toUpload.length) return setError(`Maksimal ${maxImages} foto.`);
    setError(null); setUploading(true);
    const results: UploadedImage[] = [];
    for (const file of toUpload) {
      if (!file.type.startsWith("image/") || file.size > 5*1024*1024) continue;
      const fd = new FormData(); fd.append("file", file); fd.append("type", "gallery");
      try {
        const res  = await fetch("/api/upload", { method:"POST", body:fd });
        const data = await res.json();
        if (res.ok) results.push({ url: data.url, publicId: data.publicId });
      } catch {}
    }
    const updated = [...images, ...results];
    setImages(updated); onChange?.(updated.map(i => i.url)); setUploading(false);
  }, [images, maxImages, onChange]);

  const remove = (idx: number) => {
    const updated = images.filter((_,i) => i !== idx);
    setImages(updated); onChange?.(updated.map(i => i.url));
  };

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(images.map(i => i.url))} />
      <div className="flex items-center gap-1.5 text-[10px] text-[#555] tracking-[0.16em] uppercase mb-2">
        🗂 Galeri Foto <span className="text-[#333] text-[9px]">({images.length}/{maxImages})</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {images.map((img, idx) => (
          <div key={img.publicId} className="relative rounded-[6px] overflow-hidden bg-[#1a1a1a]" style={{aspectRatio:"1/1"}}>
            <Image src={img.url} alt="" fill style={{objectFit:"cover"}} sizes="120px" />
            <button type="button" onClick={() => remove(idx)}
              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 border-0 text-[#f0e8d8] cursor-pointer text-[11px] flex items-center justify-center hover:bg-black/90 transition-colors">
              ✕
            </button>
          </div>
        ))}
        {images.length < maxImages && (
          <div onClick={() => !uploading && inputRef.current?.click()}
            className={`rounded-[6px] border-[1.5px] border-dashed border-[#1e1e1e] bg-[#141414] flex flex-col items-center justify-center gap-1 transition-colors hover:border-[#252525] ${uploading ? "cursor-wait" : "cursor-pointer"}`}
            style={{aspectRatio:"1/1"}}>
            {uploading ? (
              <div className="w-5 h-5 rounded-full border-2 border-[rgba(201,160,96,0.2)] border-t-[#c9a060] animate-spin-slow" />
            ) : (
              <>
                <span className="text-[18px] text-[#333]">+</span>
                <span className="text-[9px] text-[#2a2a2a] tracking-[0.1em] uppercase font-[family-name:var(--font-mono)]">Tambah</span>
              </>
            )}
          </div>
        )}
      </div>
      {error && <div className="mt-2 text-[11px] text-[#e05a5a] font-[family-name:var(--font-mono)]">⚠ {error}</div>}
      <div className="mt-1.5 text-[11px] text-[#2e2e2e] font-[family-name:var(--font-mono)]">Maks {maxImages} foto · JPG, PNG, WebP · 5 MB per foto</div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
        onChange={e => e.target.files && uploadFiles(e.target.files)} />
    </div>
  );
}