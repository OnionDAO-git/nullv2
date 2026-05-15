CREATE TABLE "faction_standing" (
	"human_id" uuid NOT NULL,
	"faction" text NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "faction_standing_human_id_faction_pk" PRIMARY KEY("human_id","faction")
);
--> statement-breakpoint
CREATE TABLE "humans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"shard_balance" integer DEFAULT 0 NOT NULL,
	"badge_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_inventory" (
	"human_id" uuid NOT NULL,
	"resource_id" text NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resource_inventory_human_id_resource_id_pk" PRIMARY KEY("human_id","resource_id")
);
--> statement-breakpoint
CREATE TABLE "library_of_souls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resident_id" uuid NOT NULL,
	"name" text NOT NULL,
	"faction" text NOT NULL,
	"owner_human_id" uuid,
	"epitaph" text NOT NULL,
	"lived_ticks" integer NOT NULL,
	"death_cause" text NOT NULL,
	"archived_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resident_memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resident_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resident_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resident_id" uuid NOT NULL,
	"human_id" uuid,
	"speaker" text NOT NULL,
	"channel" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "residents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"faction" text NOT NULL,
	"persona" text NOT NULL,
	"owner_human_id" uuid,
	"attention_balance" integer DEFAULT 0 NOT NULL,
	"lifespan_ticks_total" integer NOT NULL,
	"lifespan_ticks_remaining" integer NOT NULL,
	"status" text DEFAULT 'alive' NOT NULL,
	"death_cause" text,
	"born_at" timestamp with time zone DEFAULT now() NOT NULL,
	"died_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workshop_attendance" (
	"workshop_id" uuid NOT NULL,
	"human_id" uuid NOT NULL,
	"shards_awarded" integer NOT NULL,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workshop_attendance_workshop_id_human_id_pk" PRIMARY KEY("workshop_id","human_id")
);
--> statement-breakpoint
CREATE TABLE "workshops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"faction" text,
	"kind" text DEFAULT 'workshop' NOT NULL,
	"shard_reward" integer NOT NULL,
	"qr_code" text NOT NULL,
	"scheduled_at" timestamp with time zone,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workshops_qr_code_unique" UNIQUE("qr_code")
);
--> statement-breakpoint
CREATE TABLE "attention_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resident_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"source_human_id" uuid,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resident_id" uuid NOT NULL,
	"human_id" uuid NOT NULL,
	"resource_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"shards_paid" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shard_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"human_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"reason" text NOT NULL,
	"ref_kind" text,
	"ref_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "human_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"human_id" uuid NOT NULL,
	"achievement_id" text NOT NULL,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "print_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"human_id" uuid NOT NULL,
	"achievement_id" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"claim_code" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "print_jobs_claim_code_unique" UNIQUE("claim_code")
);
--> statement-breakpoint
CREATE TABLE "parcels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"faction" text NOT NULL,
	"ratified_by_human_id" uuid,
	"achievement_id" text,
	"week" integer,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "faction_standing" ADD CONSTRAINT "faction_standing_human_id_humans_id_fk" FOREIGN KEY ("human_id") REFERENCES "public"."humans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_inventory" ADD CONSTRAINT "resource_inventory_human_id_humans_id_fk" FOREIGN KEY ("human_id") REFERENCES "public"."humans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_of_souls" ADD CONSTRAINT "library_of_souls_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_of_souls" ADD CONSTRAINT "library_of_souls_owner_human_id_humans_id_fk" FOREIGN KEY ("owner_human_id") REFERENCES "public"."humans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resident_memories" ADD CONSTRAINT "resident_memories_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resident_messages" ADD CONSTRAINT "resident_messages_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resident_messages" ADD CONSTRAINT "resident_messages_human_id_humans_id_fk" FOREIGN KEY ("human_id") REFERENCES "public"."humans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residents" ADD CONSTRAINT "residents_owner_human_id_humans_id_fk" FOREIGN KEY ("owner_human_id") REFERENCES "public"."humans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_attendance" ADD CONSTRAINT "workshop_attendance_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_attendance" ADD CONSTRAINT "workshop_attendance_human_id_humans_id_fk" FOREIGN KEY ("human_id") REFERENCES "public"."humans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attention_ledger" ADD CONSTRAINT "attention_ledger_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attention_ledger" ADD CONSTRAINT "attention_ledger_source_human_id_humans_id_fk" FOREIGN KEY ("source_human_id") REFERENCES "public"."humans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_grants" ADD CONSTRAINT "resource_grants_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_grants" ADD CONSTRAINT "resource_grants_human_id_humans_id_fk" FOREIGN KEY ("human_id") REFERENCES "public"."humans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shard_ledger" ADD CONSTRAINT "shard_ledger_human_id_humans_id_fk" FOREIGN KEY ("human_id") REFERENCES "public"."humans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_achievements" ADD CONSTRAINT "human_achievements_human_id_humans_id_fk" FOREIGN KEY ("human_id") REFERENCES "public"."humans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_human_id_humans_id_fk" FOREIGN KEY ("human_id") REFERENCES "public"."humans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_ratified_by_human_id_humans_id_fk" FOREIGN KEY ("ratified_by_human_id") REFERENCES "public"."humans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "humans_user_id_uniq" ON "humans" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "humans_badge_id_uniq" ON "humans" USING btree ("badge_id");--> statement-breakpoint
CREATE INDEX "resident_memories_resident_idx" ON "resident_memories" USING btree ("resident_id");--> statement-breakpoint
CREATE INDEX "resident_messages_resident_idx" ON "resident_messages" USING btree ("resident_id");--> statement-breakpoint
CREATE INDEX "resident_messages_human_idx" ON "resident_messages" USING btree ("human_id");--> statement-breakpoint
CREATE INDEX "residents_faction_idx" ON "residents" USING btree ("faction");--> statement-breakpoint
CREATE INDEX "residents_status_idx" ON "residents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "residents_owner_idx" ON "residents" USING btree ("owner_human_id");--> statement-breakpoint
CREATE INDEX "workshops_status_idx" ON "workshops" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workshops_scheduled_idx" ON "workshops" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "attention_ledger_resident_idx" ON "attention_ledger" USING btree ("resident_id");--> statement-breakpoint
CREATE INDEX "resource_grants_human_idx" ON "resource_grants" USING btree ("human_id");--> statement-breakpoint
CREATE INDEX "resource_grants_resident_idx" ON "resource_grants" USING btree ("resident_id");--> statement-breakpoint
CREATE INDEX "shard_ledger_human_idx" ON "shard_ledger" USING btree ("human_id");--> statement-breakpoint
CREATE INDEX "shard_ledger_created_idx" ON "shard_ledger" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "human_achievements_uniq" ON "human_achievements" USING btree ("human_id","achievement_id");--> statement-breakpoint
CREATE INDEX "print_jobs_status_idx" ON "print_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "print_jobs_human_idx" ON "print_jobs" USING btree ("human_id");--> statement-breakpoint
CREATE INDEX "parcels_faction_idx" ON "parcels" USING btree ("faction");--> statement-breakpoint
CREATE INDEX "parcels_coord_idx" ON "parcels" USING btree ("x","y");