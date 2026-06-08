// src/app/(auth)/register/page.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Tier = "free" | "basic" | "pro" | "commission";

const TIERS: { id: Tier; label: string; price: string; period: string; perks: string[] }[] = [
  { id:"free",       label:"Free",   price:"Rp 0",    period:"selamanya", perks:["3 event draft","Tampilan listing standar"] },
  { id:"basic",      label:"Basic",  price:"Rp 99K",  period:"per bulan", perks:["20 event aktif","Tampilan listing premium"] },
  { id:"pro",        label:"Pro",    price:"Rp 299K", period:"per bulan", perks:["Event tak terbatas","Featured di homepage"] },
  { id:"commission", label:"Komisi", price:"5%",      period:"per tiket", perks:["Event tak terbatas","Bayar per tiket terjual"] },
];

function IconLogo()   { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#c9a060" strokeWidth="1.2"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><circle cx="11.5" cy="11.5" r="2.5"/></svg>; }
function IconGoogle() { return <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>; }
function IconCheck()  { return <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="2 8.5 6 12 14 4"/></svg>; }
function IconEye()    { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>; }
function IconEyeOff() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M13.4 13.4L2.6 2.6M6.5 6.5a2 2 0 0 0 3 3M1 8s2-3.9 5.5-4.8M10 5.2C12.1 6 14.1 8 14.1 8s-2.5 5-6.1 5c-.8 0-1.6-.2-2.3-.5"/></svg>; }

function PwStrength({ pw }: { pw: string }) {
  const score = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  const colors = ["bg-[#1e1e1e]","bg-[#e05a5a]","bg-[#e09040]","bg-[#c9a060]","bg-[#6aaa38]"];
  const labels = ["","Sangat lemah","Lemah","Sedang","Kuat"];
  return pw ? (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1,2,3,4].map(i => <div key={i} className={`h-0.75 flex-1 rounded-sm transition-colors ${i<=score ? colors[score] : "bg-border"}`} />)}
      </div>
      <div className="text-[10px] text-[#555]">{labels[score]}</div>
    </div>
  ) : null;
}

function Field({ label, name, type="text", value, onChange, placeholder, hint }: {
  label:string; name:string; type?:string; value:string;
  onChange:(v:string)=>void; placeholder?:string; hint?:string;
}) {
  const [focused, setFocused] = useState(false);
  const [show,    setShow]    = useState(false);
  const isPw = type === "password";
  return (
    <div className="mb-5">
      <label className={`block text-[10px] tracking-[0.16em] uppercase mb-2 transition-colors ${focused?"text-gold":"text-[#555]"}`}>{label}</label>
      <div className="relative">
        <input name={name} type={isPw&&show?"text":type} value={value} placeholder={placeholder}
          onChange={e=>onChange(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          className={`w-full bg-bg-3 border-[1.5px] rounded-[7px] text-text font-mono text-[15px] px-4 py-3.5 outline-none caret-gold placeholder-[#333] transition-colors ${focused?"border-gold":"border-border"}`}
        />
        {isPw && <button type="button" onClick={()=>setShow(v=>!v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#333] hover:text-[#888]">{show?<IconEyeOff/>:<IconEye/>}</button>}
      </div>
      {hint && <div className="text-[11px] text-[#333] mt-1.5">{hint}</div>}
      {isPw && name==="password" && <PwStrength pw={value} />}
    </div>
  );
}

export default function RegisterPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const planParam    = searchParams.get("plan") as Tier | null;
  const [step,     setStep]     = useState(1);
  const [tier,     setTier]     = useState<Tier>(planParam ?? "free");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState<string|null>(null);
  const [isPending, start]      = useTransition();
  const [gPending,  setGPending] = useState(false);

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) return setError("Isi semua field.");
    if (password !== confirm) return setError("Password tidak sama.");
    if (password.length < 8) return setError("Password minimal 8 karakter.");
    setError(null);
    setStep(2);
  }

  function handleSubmit() {
    setError(null);
    start(async () => {
      const { error: err } = await authClient.signUp.email({ name, email, password });
      if (err) return setError(err.message ?? "Pendaftaran gagal.");
      router.push("/dashboard");
    });
  }

  async function handleGoogle() {
    setGPending(true);
    await authClient.signIn.social({ provider:"google", callbackURL:"/dashboard" });
  }

  return (
    <div className="min-h-dvh grid grid-cols-1 md:grid-cols-2 bg-bg font-mono">
      {/* Left panel */}
      <div className="hidden md:flex flex-col justify-between p-13 bg-bg-2 border-r border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{background:"radial-gradient(ellipse 60% 40% at 20% 80%, rgba(201,160,96,0.07) 0%, transparent 70%)"}} />
        <Link href="/" className="flex items-center gap-3 no-underline z-10">
          <div className="w-8.5 h-8.5 border border-gold rounded-[7px] flex items-center justify-center"><IconLogo /></div>
          <span className="font-serif text-xl font-light text-text tracking-widest uppercase">Eventara</span>
        </Link>
        <div className="z-10">
          <h2 className="font-serif text-[clamp(32px,4vw,52px)] font-light text-text leading-[1.1] tracking-[-0.01em] mb-4">
            Mulai buat event<br /><em className="italic text-gold">pertama Anda.</em>
          </h2>
          <p className="text-[13px] text-[#555] tracking-widest uppercase">Gratis selamanya. Upgrade kapan saja.</p>
        </div>
        <div className="flex flex-col gap-3 z-10">
          {["Daftar dalam 30 detik","Tidak perlu kartu kredit","Upgrade kapan saja"].map(t=>(
            <div key={t} className="flex items-center gap-2.5 text-[13px] text-[#555]">
              <span className="w-4 h-4 rounded-full bg-green-bg border border-green-border flex items-center justify-center text-green shrink-0"><IconCheck /></span>
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center px-6 py-16 md:p-13 overflow-y-auto">
        <div className="w-full max-w-110">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1,2].map(s=>(
              <div key={s} className={`h-0.75 rounded-sm transition-all ${s===step?"w-6 bg-gold":s<step?"w-1.75 bg-[rgba(201,160,96,0.3)]":"w-1.75 bg-border"}`} />
            ))}
            <span className="text-[10px] text-[#333] tracking-[0.12em] uppercase ml-1">Langkah {step} dari 2</span>
          </div>

          {error && (
            <div className="flex items-start gap-3 px-4 py-3 bg-red-bg border-[1.5px] border-red-border rounded-[7px] mb-5 text-[13px] text-red">
              ⚠ {error}
            </div>
          )}

          {step === 1 ? (
            <>
              <h1 className="font-serif text-[42px] font-light text-text tracking-[-0.01em] mb-1.5">Daftar</h1>
              <p className="text-[10px] text-[#555] tracking-[0.16em] uppercase mb-8">Buat akun Eventara Anda</p>

              <button onClick={handleGoogle} disabled={gPending}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-bg-3 border-[1.5px] border-border-2 rounded-[7px] text-text-2 text-[15px] hover:border-border-3 hover:text-text transition-all mb-6 cursor-pointer disabled:opacity-45 font-mono">
                <IconGoogle />{gPending?"Mengalihkan...":"Daftar dengan Google"}
              </button>
              <div className="flex items-center gap-3.5 text-[10px] text-[#333] tracking-[0.12em] uppercase mb-6">
                <div className="flex-1 h-px bg-border" /> atau <div className="flex-1 h-px bg-border" />
              </div>
              <form onSubmit={handleNext} noValidate>
                <Field label="Nama Lengkap" name="name"     value={name}     onChange={setName}     placeholder="Nama Anda" />
                <Field label="Email"        name="email"    type="email"     value={email}    onChange={setEmail}    placeholder="nama@email.com" />
                <Field label="Password"     name="password" type="password"  value={password} onChange={setPassword} placeholder="Minimal 8 karakter" />
                <Field label="Konfirmasi Password" name="confirm" type="password" value={confirm} onChange={setConfirm} placeholder="Ulangi password" />
                <button type="submit" disabled={!name||!email||!password||!confirm}
                  className="w-full py-4 bg-gold rounded-[7px] text-bg text-[15px] tracking-widest uppercase hover:bg-gold-light transition-colors disabled:bg-border disabled:text-[#333] disabled:cursor-not-allowed font-mono cursor-pointer">
                  Lanjutkan →
                </button>
              </form>
              <p className="mt-7 text-center text-[13px] text-[#333]">
                Sudah punya akun?{" "}
                <Link href="/login" className="text-gold no-underline hover:text-text">Masuk</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="font-serif text-[42px] font-light text-text tracking-[-0.01em] mb-1.5">Pilih Paket</h1>
              <p className="text-[10px] text-[#555] tracking-[0.16em] uppercase mb-8">Bisa diubah kapan saja</p>
              <div className="flex flex-col gap-3 mb-6">
                {TIERS.map(t => (
                  <button key={t.id} type="button" onClick={()=>setTier(t.id)}
                    className={`flex items-center justify-between px-4 py-4 border rounded-[7px] cursor-pointer transition-all text-left font-mono bg-transparent ${tier===t.id?"border-gold bg-gold-bg":"border-border hover:border-border-2 hover:bg-white/1"}`}>
                    <div>
                      <div className={`text-[10px] tracking-[0.16em] uppercase mb-1.5 transition-colors ${tier===t.id?"text-gold":"text-[#555]"}`}>{t.label}</div>
                      <div className="flex gap-3 flex-wrap">
                        {t.perks.map(p=><span key={p} className="text-[11px] text-[#555]">{p}</span>)}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className={`font-serif text-2xl font-light transition-colors ${tier===t.id?"text-text":"text-[#333]"}`}>{t.price}</div>
                      <div className="text-[10px] text-[#333]">{t.period}</div>
                    </div>
                  </button>
                ))}
              </div>
              <input type="hidden" name="pricingTier" value={tier} />
              <button onClick={handleSubmit} disabled={isPending}
                className="w-full py-4 bg-gold rounded-[7px] text-bg text-[15px] tracking-widest uppercase hover:bg-gold-light transition-colors disabled:bg-border disabled:text-[#333] disabled:cursor-not-allowed cursor-pointer font-mono">
                {isPending ? "Membuat akun..." : "Buat Akun Sekarang"}
              </button>
              <button onClick={()=>{setStep(1);setError(null);}} className="w-full mt-3 py-3 border border-border rounded-[7px] text-[#555] text-[13px] tracking-widest uppercase hover:border-border-2 hover:text-[#888] transition-all cursor-pointer bg-transparent font-mono">
                ← Kembali
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}