// src/lib/tiers.ts

export type PricingTier    = "free" | "basic" | "pro" | "commission";
export type ListingStyle   = "standard" | "premium";

export interface TierConfig {
  id:               PricingTier;
  label:            string;
  price:            string;
  priceMonthly:     number;
  period:           string;
  desc:             string;
  maxEvents:        number;        // 999 = tidak terbatas
  canPublish:       boolean;
  featured:         boolean;
  hasAnalytics:     boolean;
  // ── Publikasi & listing ───────────────────────────────────────────────────
  visibleInListing: boolean;       // tampil di /events publik
  listingStyle:     ListingStyle;  // "standard" = kecil | "premium" = mencolok
  canUploadImages:  boolean;
  maxGalleryPhotos: number;        // 0 = tidak bisa upload galeri
  // ── Komisi ────────────────────────────────────────────────────────────────
  isCommission:     boolean;
  commissionRate:   number | null;
  commissionLabel:  string | null;
}

export const TIER_CONFIG: Record<PricingTier, TierConfig> = {

  free: {
    id:               "free",
    label:            "Free",
    price:            "Rp 0",
    priceMonthly:     0,
    period:           "selamanya gratis",
    desc:             "Untuk individu yang baru memulai dan ingin mencoba platform.",
    maxEvents:        3,
    canPublish:       true,
    featured:         false,
    hasAnalytics:     false,
    visibleInListing: true,        // ← tampil di listing
    listingStyle:     "standard",  // ← tampilan kecil/standar
    canUploadImages:  true,        // ← bisa upload, tapi hanya 1 cover
    maxGalleryPhotos: 0,           // ← tidak ada galeri
    isCommission:     false,
    commissionRate:   null,
    commissionLabel:  null,
  },

  basic: {
    id:               "basic",
    label:            "Basic",
    price:            "Rp 99K",
    priceMonthly:     99_000,
    period:           "per bulan",
    desc:             "Untuk organizer aktif yang ingin menjangkau audiens lebih luas.",
    maxEvents:        20,
    canPublish:       true,
    featured:         false,
    hasAnalytics:     true,
    visibleInListing: true,
    listingStyle:     "premium",   // ← tampilan mencolok
    canUploadImages:  true,
    maxGalleryPhotos: 4,
    isCommission:     false,
    commissionRate:   null,
    commissionLabel:  null,
  },

  pro: {
    id:               "pro",
    label:            "Pro",
    price:            "Rp 299K",
    priceMonthly:     299_000,
    period:           "per bulan",
    desc:             "Untuk organizer profesional dengan kebutuhan skala besar.",
    maxEvents:        999,
    canPublish:       true,
    featured:         true,
    hasAnalytics:     true,
    visibleInListing: true,
    listingStyle:     "premium",
    canUploadImages:  true,
    maxGalleryPhotos: 20,
    isCommission:     false,
    commissionRate:   null,
    commissionLabel:  null,
  },

  commission: {
    id:               "commission",
    label:            "Komisi",
    price:            "5%",
    priceMonthly:     0,
    period:           "per tiket terjual",
    desc:             "Tanpa biaya bulanan. Platform hanya mengambil komisi dari tiket yang terjual.",
    maxEvents:        999,
    canPublish:       true,
    featured:         false,
    hasAnalytics:     true,
    visibleInListing: true,
    listingStyle:     "premium",
    canUploadImages:  true,
    maxGalleryPhotos: 20,
    isCommission:     true,
    commissionRate:   5,
    commissionLabel:  "5% per tiket",
  },
};

// Alias untuk backward compatibility
export const TIER_LIMITS = TIER_CONFIG;

/** Hitung komisi platform dari harga tiket */
export function calcCommission(ticketPrice: number, rate: number) {
  const commission   = (ticketPrice * rate) / 100;
  const netOrganizer = ticketPrice - commission;
  return {
    commissionAmount: Math.round(commission),
    netToOrganizer:   Math.round(netOrganizer),
    rate,
  };
}

/** Format IDR */
export function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(amount);
}