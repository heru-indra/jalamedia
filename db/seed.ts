/**
 * Seed script untuk mengisi tabel categories.
 *
 * Jalankan dengan:
 *   npx tsx src/db/seed.ts
 *
 * Atau tambahkan ke package.json:
 *   "db:seed": "tsx src/db/seed.ts"
 */

import { db } from "./index";
import { categories, CATEGORY_SEEDS } from "../db/schema";

async function seed() {
  console.log("🌱 Seeding categories...");

  // Insert semua kategori, abaikan jika slug sudah ada (idempotent)
  await db
    .insert(categories)
    .values(CATEGORY_SEEDS.map((c) => ({ ...c })))
    .onConflictDoNothing({ target: categories.slug });

  const result = await db.select().from(categories);
  console.log(`✅ ${result.length} kategori tersedia:`);
  result.forEach((c) => console.log(`   ${c.emoji}  ${c.name} (${c.slug})`));

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed gagal:", err);
  process.exit(1);
});