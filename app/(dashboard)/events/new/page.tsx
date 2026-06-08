// src/app/(dashboard)/events/new/page.tsx
// Server Component — fetch kategori + tier user, pass ke client form

import { requireAuth } from "@/lib/auth-helper";
import { getCategories } from "@/actions/event";
import { TIER_CONFIG } from "@/lib/tiers";
import type { PricingTier } from "@/lib/tiers";
import NewEventPage from "./new-event-page";

export default async function Page() {
  const [session, categories] = await Promise.all([
    requireAuth(),
    getCategories(),
  ]);

  const tier        = (session.user.pricingTier ?? "free") as PricingTier;
  const tierConfig  = TIER_CONFIG[tier];

  return (
    <NewEventPage
      canUploadImages={tierConfig.canUploadImages}
      maxGalleryPhotos={tierConfig.maxGalleryPhotos}
      tier={tier}
    />
  );
}