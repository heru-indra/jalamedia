// src/app/(auth)/login/page.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function IconLogo() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#c9a060" strokeWidth="1.2"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><circle cx="11.5" cy="11.5" r="2.5"/></svg>; }
function IconGoogle() { return <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>; }
function IconEye()    { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>; }
function IconEyeOff() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M13.4 13.4L2.6 2.6M6.5 6.5a2 2 0 0 0 3 3M1 8s2-3.9 5.5-4.8M10 5.2C12.1 6 14.1 8 14.1 8s-2.5 5-6.1 5c-.8 0-1.6-.2-2.3-.5"/></svg>; }

function Field({ label, name, type="text", value, onChange, placeholder }: {
  label: string; name: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [show,    setShow]    = useState(false);
  const isPw = type === "password";
  return (
    <div className="mb-5">
      <label className={`block text-[10px] tracking-[0.16em] uppercase mb-2 transition-colors ${focused ? "text-gold" : "text-[#555]"}`}>{label}</label>
      <div className="relative">
        <input
          name={name} type={isPw && show ? "text" : type}
          value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className={`w-full bg-bg-3 border-[1.5px] rounded-[7px] text-text font-mono text-[15px] px-4 py-3.5 outline-none caret-gold placeholder-[#333] transition-colors ${focused ? "border-gold" : "border-border"}`}
        />
        {isPw && (
          <button type="button" onClick={() => setShow(v => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#333] hover:text-[#888] transition-colors">
            {show ? <IconEyeOff /> : <IconEye />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const reason       = searchParams.get("reason");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [gPending,  setGPending]     = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const { error: err } = await authClient.signIn.email({ email, password });
      if (err) setError(err.message ?? "Login gagal. Coba lagi.");
      else router.push("/dashboard");
    });
  }

  async function handleGoogle() {
    setGPending(true);
    await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
  }

  return (
    <div className="min-h-dvh grid grid-cols-1 md:grid-cols-2 bg-bg font-mono">
      {/* Left panel */}
      <div className="hidden md:flex flex-col justify-between p-13 bg-bg-2 border-r border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background:"radial-gradient(ellipse 60% 40% at 20% 80%, rgba(201,160,96,0.07) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 20%, rgba(201,160,96,0.04) 0%, transparent 70%)" }} />
        <Link href="/" className="flex items-center gap-3 no-underline z-10">
          <div className="w-8.5 h-8.5 border border-gold rounded-[7px] flex items-center justify-center"><IconLogo /></div>
          <span className="font-serif text-xl font-light text-text tracking-widest uppercase">Eventara</span>
        </Link>
        <div className="z-10">
          <h2 className="font-serif text-[clamp(32px,4vw,56px)] font-light text-text leading-[1.1] tracking-[-0.01em] mb-4">
            Selamat datang <br /><em className="italic text-gold">kembali.</em>
          </h2>
          <p className="text-[13px] text-[#555] tracking-widest uppercase leading-relaxed">Platform event organizer terpercaya</p>
        </div>
        <div className="flex gap-9 z-10">
          {[["2.4K+","Event Aktif"],["18K+","Organizer"],["340K+","Peserta"]].map(([n,l]) => (
            <div key={l}>
              <div className="font-serif text-3xl font-light text-text">{n}</div>
              <div className="text-[10px] text-[#333] tracking-[0.16em] uppercase mt-1">{l}</div>
            </div>
          ))}
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-30"
          style={{ background:"linear-gradient(to bottom, transparent, #c9a060, transparent)" }} />
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center px-6 py-16 md:p-13">
        <div className="w-full max-w-105">
          {/* Timeout banner */}
          {reason === "timeout" && (
            <div className="flex items-start gap-3 px-4 py-3.5 bg-gold-bg border border-gold-border rounded-[7px] mb-6 text-[13px] text-gold animate-fade-up">
              ⏱ Sesi berakhir karena tidak aktif. Silakan masuk kembali.
            </div>
          )}

          <h1 className="font-serif text-[42px] font-light text-text tracking-[-0.01em] mb-1.5">Masuk</h1>
          <p className="text-[10px] text-[#555] tracking-[0.16em] uppercase mb-8">ke akun Eventara Anda</p>

          {/* Google */}
          <button onClick={handleGoogle} disabled={gPending}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-bg-3 border-[1.5px] border-border-2 rounded-[7px] text-text-2 text-[15px] tracking-[0.06em] cursor-pointer hover:border-border-3 hover:text-text transition-all mb-6 disabled:opacity-45 disabled:cursor-not-allowed font-mono">
            <IconGoogle />{gPending ? "Mengalihkan..." : "Lanjutkan dengan Google"}
          </button>

          <div className="flex items-center gap-3.5 text-[10px] text-[#333] tracking-[0.12em] uppercase mb-6">
            <div className="flex-1 h-px bg-border" /> atau <div className="flex-1 h-px bg-border" />
          </div>

          {error && (
            <div className="flex items-start gap-3 px-4 py-3 bg-red-bg border-[1.5px] border-red-border rounded-[7px] mb-5 text-[13px] text-red">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Field label="Email"    name="email"    type="email"    value={email}    onChange={setEmail}    placeholder="nama@email.com" />
            <Field label="Password" name="password" type="password" value={password} onChange={setPassword} placeholder="Minimal 8 karakter" />
            <button type="submit" disabled={isPending || !email || !password}
              className="w-full py-4 bg-gold rounded-[7px] text-bg text-[15px] tracking-widest uppercase cursor-pointer hover:bg-gold-light transition-colors disabled:bg-border disabled:text-[#333] disabled:cursor-not-allowed font-mono">
              {isPending ? "Memverifikasi..." : "Masuk"}
            </button>
          </form>

          <p className="mt-7 text-center text-[13px] text-[#333] tracking-[0.06em]">
            Belum punya akun?{" "}
            <Link href="/register" className="text-gold no-underline hover:text-text transition-colors">Daftar sekarang</Link>
          </p>
        </div>
      </div>
    </div>
  );
}