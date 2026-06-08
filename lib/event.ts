"use server";

import { db } from "@/db";
import { events, categories } from "@/db/schema";
import { requireAuth } from "@/lib/auth-helper";
import { TIER_LIMITS } from "@/lib/tiers";
import { revalidatePath } from "next/cache";
import { eq, and, count as drizzleCount } from "drizzle-orm";
import { z } from "zod";
import type { Event } from "@/db/schema";

// ── Validation schema ─────────────────────────────────────────────────────────

const eventSchema = z.object({
  title:       z.string().min(3, "Judul minimal 3 karakter").max(100),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  location:    z.string().min(3, "Lokasi minimal 3 karakter"),
  startDate:   z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate:     z.string().min(1, "Tanggal selesai wajib diisi"),
  categoryId:  z.string().uuid("Kategori tidak valid").optional(),
  capacity:    z.coerce.number().positive().optional(),
  ticketPrice: z.coerce.number().min(0).optional(),
});

// ── Return type ───────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true;  data: T }
  | { success: false; error: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Ambil semua kategori untuk dropdown form */
export async function getCategories() {
  return db.select().from(categories).orderBy(categories.name);
}

// ── CREATE ────────────────────────────────────────────────────────────────────

export async function createEvent(
  _prevState: ActionResult<Event> | null,
  formData: FormData,
): Promise<ActionResult<Event>> {
  const session = await requireAuth();
  const userId  = session.user.id;
  const tier    = (session.user.pricingTier ?? "free") as "free" | "basic" | "pro";
  const limits  = TIER_LIMITS[tier];

  // Cek batas event per tier
  const [{ eventCount }] = await db
    .select({ eventCount: drizzleCount() })
    .from(events)
    .where(eq(events.userId, userId));

  if (Number(eventCount) >= limits.maxEvents) {
    return {
      success: false,
      error: `Batas ${limits.maxEvents} event untuk tier ${tier} telah tercapai. Upgrade paket untuk menambah lebih banyak event.`,
    };
  }

  const raw = {
    title:       formData.get("title"),
    description: formData.get("description"),
    location:    formData.get("location"),
    startDate:   formData.get("startDate"),
    endDate:     formData.get("endDate"),
    categoryId:  formData.get("categoryId") || undefined,
    capacity:    formData.get("capacity")    || undefined,
    ticketPrice: formData.get("ticketPrice") || undefined,
  };

  // Gambar — URL dari Cloudinary (sudah diupload sebelum form di-submit)
  const coverImage    = (formData.get("coverImage")    as string) || null;
  const galleryImages = (formData.get("galleryImages") as string) || null;
  const organizerLogo = (formData.get("organizerLogo") as string) || null;

  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { startDate, endDate, ...rest } = parsed.data;
  const start = new Date(startDate);
  const end   = new Date(endDate);

  if (isNaN(start.getTime())) return { success: false, error: "Format tanggal mulai tidak valid." };
  if (isNaN(end.getTime()))   return { success: false, error: "Format tanggal selesai tidak valid." };
  if (end <= start)           return { success: false, error: "Tanggal selesai harus setelah tanggal mulai." };

  try {
    const [event] = await db
      .insert(events)
      .values({ ...rest, userId, startDate: start, endDate: end, status: "draft",
                coverImage, galleryImages })
      .returning();

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/events");
    return { success: true, data: event };
  } catch (err) {
    console.error("[createEvent]", err);
    return { success: false, error: "Gagal menyimpan event. Silakan coba lagi." };
  }
}

// ── UPDATE ────────────────────────────────────────────────────────────────────

export async function updateEvent(
  id: string,
  formData: FormData,
): Promise<ActionResult<Event>> {
  const session = await requireAuth();
  const userId  = session.user.id;

  const raw = {
    title:       formData.get("title"),
    description: formData.get("description"),
    location:    formData.get("location"),
    startDate:   formData.get("startDate"),
    endDate:     formData.get("endDate"),
    categoryId:  formData.get("categoryId") || undefined,
    capacity:    formData.get("capacity")    || undefined,
    ticketPrice: formData.get("ticketPrice") || undefined,
  };

  // Gambar — ambil URL terbaru dari Cloudinary
  const coverImage    = (formData.get("coverImage")    as string) || null;
  const galleryImages = (formData.get("galleryImages") as string) || null;

  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { startDate, endDate, ...rest } = parsed.data;
  const start = new Date(startDate);
  const end   = new Date(endDate);

  if (end <= start) return { success: false, error: "Tanggal selesai harus setelah tanggal mulai." };

  try {
    const [event] = await db
      .update(events)
      .set({ ...rest, ticketPrice: rest.ticketPrice ? String(rest.ticketPrice) : undefined, startDate: start, endDate: end, updatedAt: new Date(),
             coverImage, galleryImages })
      .where(and(eq(events.id, id), eq(events.userId, userId)))
      .returning();

    if (!event) return { success: false, error: "Event tidak ditemukan atau Anda tidak punya akses." };

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/events");
    revalidatePath(`/dashboard/events/${id}`);
    return { success: true, data: event };
  } catch (err) {
    console.error("[updateEvent]", err);
    return { success: false, error: "Gagal memperbarui event." };
  }
}

// ── PUBLISH ───────────────────────────────────────────────────────────────────

export async function publishEvent(id: string): Promise<ActionResult> {
  const session = await requireAuth();
  const tier    = (session.user.pricingTier ?? "free") as "free" | "basic" | "pro";

  if (!TIER_LIMITS[tier].canPublish) {
    return { success: false, error: "Tier Free tidak dapat mempublikasi event. Upgrade ke Basic atau Pro." };
  }

  try {
    const [event] = await db
      .update(events)
      .set({ status: "published", updatedAt: new Date() })
      .where(and(eq(events.id, id), eq(events.userId, session.user.id)))
      .returning();

    if (!event) return { success: false, error: "Event tidak ditemukan." };

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/events");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[publishEvent]", err);
    return { success: false, error: "Gagal mempublikasi event." };
  }
}

// ── UNPUBLISH ─────────────────────────────────────────────────────────────────

export async function unpublishEvent(id: string): Promise<ActionResult> {
  const session = await requireAuth();
  try {
    await db
      .update(events)
      .set({ status: "draft", updatedAt: new Date() })
      .where(and(eq(events.id, id), eq(events.userId, session.user.id)));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/events");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[unpublishEvent]", err);
    return { success: false, error: "Gagal mengubah status event." };
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function deleteEvent(id: string): Promise<ActionResult> {
  const session = await requireAuth();
  try {
    const [deleted] = await db
      .delete(events)
      .where(and(eq(events.id, id), eq(events.userId, session.user.id)))
      .returning();

    if (!deleted) return { success: false, error: "Event tidak ditemukan atau Anda tidak punya akses." };

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/events");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteEvent]", err);
    return { success: false, error: "Gagal menghapus event." };
  }
}