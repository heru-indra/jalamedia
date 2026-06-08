import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  uuid,
  decimal,
} from "drizzle-orm/pg-core";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const pricingTierEnum = pgEnum("pricing_tier", [
  "free",
  "basic",
  "pro",
  "commission",   // ← tier baru: tanpa biaya bulanan, bayar % per tiket
]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "cancelled",
]);

// ── Better Auth tables ────────────────────────────────────────────────────────

export const user = pgTable("user", {
  id:            text("id").primaryKey(),
  name:          text("name").notNull(),
  email:         text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image:         text("image"),
  pricingTier:   pricingTierEnum("pricing_tier").default("free"),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
  updatedAt:     timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id:        text("id").primaryKey(),
  userId:    text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  token:     text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id:                    text("id").primaryKey(),
  userId:                text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId:             text("account_id").notNull(),
  providerId:            text("provider_id").notNull(),
  accessToken:           text("access_token"),
  refreshToken:          text("refresh_token"),
  idToken:               text("id_token"),
  accessTokenExpiresAt:  timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope:                 text("scope"),
  password:              text("password"),
  createdAt:             timestamp("created_at").notNull().defaultNow(),
  updatedAt:             timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id:         text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value:      text("value").notNull(),
  expiresAt:  timestamp("expires_at").notNull(),
  createdAt:  timestamp("created_at"),
  updatedAt:  timestamp("updated_at"),
});

// ── Categories ────────────────────────────────────────────────────────────────

export const categories = pgTable("categories", {
  id:        uuid("id").primaryKey().defaultRandom(),
  name:      text("name").notNull().unique(),
  slug:      text("slug").notNull().unique(),
  emoji:     text("emoji").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Events ────────────────────────────────────────────────────────────────────

export const events = pgTable("events", {
  id:          uuid("id").primaryKey().defaultRandom(),
  userId:      text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  categoryId:  uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  title:       text("title").notNull(),
  description: text("description").notNull(),
  location:    text("location").notNull(),
  startDate:   timestamp("start_date").notNull(),
  endDate:     timestamp("end_date").notNull(),
  coverImage:  text("cover_image"),
  galleryImages: text("gallery_images"),  // JSON array of URLs: ["url1","url2",...]
  capacity:    integer("capacity"),
  ticketPrice: decimal("ticket_price", { precision: 10, scale: 2 }).default("0"),
  // ── Kolom baru untuk tier Commission ──────────────────────────────────────
  ticketSold:     integer("ticket_sold").default(0),          // jumlah tiket terjual
  commissionRate: decimal("commission_rate", {                // % komisi platform per tiket
    precision: 5, scale: 2,
  }),
  // ─────────────────────────────────────────────────────────────────────────
  status:      eventStatusEnum("status").default("draft"),
  isFeatured:  boolean("is_featured").default(false),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),
});

// ── Ticket transactions (untuk tier Commission) ───────────────────────────────
// Mencatat setiap penjualan tiket dan komisi yang didapat platform.

export const ticketTransactions = pgTable("ticket_transactions", {
  id:              uuid("id").primaryKey().defaultRandom(),
  eventId:         uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  buyerName:       text("buyer_name").notNull(),
  buyerEmail:      text("buyer_email").notNull(),
  quantity:        integer("quantity").notNull().default(1),
  pricePerTicket:  decimal("price_per_ticket",  { precision: 10, scale: 2 }).notNull(),
  commissionRate:  decimal("commission_rate",    { precision: 5,  scale: 2 }).notNull(),
  commissionTotal: decimal("commission_total",   { precision: 10, scale: 2 }).notNull(),
  netToOrganizer:  decimal("net_to_organizer",   { precision: 10, scale: 2 }).notNull(),
  status:          text("status").default("pending"),  // pending | paid | refunded
  createdAt:       timestamp("created_at").notNull().defaultNow(),
});

// ── Seed data ─────────────────────────────────────────────────────────────────

export const CATEGORY_SEEDS = [
  { name: "Edukasi & Workshop", slug: "edukasi",   emoji: "🎓" },
  { name: "Bisnis & Networking", slug: "bisnis",   emoji: "💼" },
  { name: "Teknologi",           slug: "teknologi", emoji: "💻" },
  { name: "Seni & Hiburan",      slug: "hiburan",   emoji: "🎵" },
  { name: "Olahraga",            slug: "olahraga",  emoji: "🏃" },
  { name: "Komunitas & Sosial",  slug: "komunitas", emoji: "🤝" },
  { name: "Kuliner",             slug: "kuliner",   emoji: "🍽️" },
  { name: "Travel & Wisata",     slug: "travel",    emoji: "✈️" },
  { name: "Lainnya",             slug: "lainnya",   emoji: "📋" },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export type User                = typeof user.$inferSelect;
export type Category            = typeof categories.$inferSelect;
export type Event               = typeof events.$inferSelect;
export type NewEvent            = typeof events.$inferInsert;
export type TicketTransaction   = typeof ticketTransactions.$inferSelect;
export type NewTicketTransaction = typeof ticketTransactions.$inferInsert;

export type EventWithCategory = Event & {
  category: Category | null;
};

export type PricingTier = "free" | "basic" | "pro" | "commission";