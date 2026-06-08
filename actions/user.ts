"use server";

import { db } from "@/db";
import { user } from "@/db/schema";
import { requireAuth } from "@/lib/auth-helper";
import { PricingTier } from "@/lib/tiers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function upgradeTier(tier: PricingTier) {
  const session = await requireAuth();
  // Di produksi: proses pembayaran dulu (Midtrans, Stripe, dll)
  await db.update(user)
    .set({ pricingTier: tier })
    .where(eq(user.id, session.user.id));
  revalidatePath("/dashboard");
  return { success: true };
}