ALTER TYPE "public"."pricing_tier" ADD VALUE 'commission';--> statement-breakpoint
CREATE TABLE "ticket_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"buyer_name" text NOT NULL,
	"buyer_email" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price_per_ticket" numeric(10, 2) NOT NULL,
	"commission_rate" numeric(5, 2) NOT NULL,
	"commission_total" numeric(10, 2) NOT NULL,
	"net_to_organizer" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "ticket_sold" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "commission_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "ticket_transactions" ADD CONSTRAINT "ticket_transactions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;