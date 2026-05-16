CREATE TABLE "letters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"human_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"faction" text,
	"resident_id" uuid,
	"from_name" text NOT NULL,
	"from_monogram" text NOT NULL,
	"from_emotion" text NOT NULL,
	"subject" text NOT NULL,
	"preview" text NOT NULL,
	"body" text NOT NULL,
	"ref_kind" text,
	"ref_id" text,
	"read_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resident_messages" ADD COLUMN "room_id" text;--> statement-breakpoint
ALTER TABLE "residents" ADD COLUMN "emotion" text DEFAULT 'stillness' NOT NULL;--> statement-breakpoint
ALTER TABLE "residents" ADD COLUMN "room_id" text DEFAULT 'atrium' NOT NULL;--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_human_id_humans_id_fk" FOREIGN KEY ("human_id") REFERENCES "public"."humans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "letters_human_idx" ON "letters" USING btree ("human_id");--> statement-breakpoint
CREATE INDEX "letters_created_idx" ON "letters" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "resident_messages_room_idx" ON "resident_messages" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "residents_room_idx" ON "residents" USING btree ("room_id");