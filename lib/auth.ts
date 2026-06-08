import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

// ── Idle timeout ──────────────────────────────────────────────────────────────
const IDLE_TIMEOUT = 15 * 60;  // 15 menit
const UPDATE_AGE   =  5 * 60;  //  5 menit
// ─────────────────────────────────────────────────────────────────────────────

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user:         schema.user,
      session:      schema.session,
      account:      schema.account,
      verification: schema.verification,
    },
  }),

  emailAndPassword: { enabled: true },

  socialProviders: {
    google: {
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  session: {
    expiresIn:   IDLE_TIMEOUT,
    updateAge:   UPDATE_AGE,
    cookieCache: { enabled: true, maxAge: UPDATE_AGE },
  },

  // ── Kolom tambahan di tabel user ───────────────────────────────────────────
  // Daftarkan semua kolom custom agar muncul di session.user type.
  // Tanpa ini, TypeScript tidak tahu kolom ini ada.
  user: {
    additionalFields: {
      pricingTier: {
        type:         "string",
        required:     false,
        defaultValue: "free",
        input:        false,   // user tidak bisa set sendiri via API
      },
    },
  },

  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL!],
});

export type Session = typeof auth.$Infer.Session;

// ── Augmented user type ────────────────────────────────────────────────────────
// Type helper yang menyertakan pricingTier — gunakan ini jika perlu cast manual.
export type AuthUser = Session["user"] & {
  pricingTier: "free" | "basic" | "pro" | "commission";
};