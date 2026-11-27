CREATE TABLE "bible_highlights" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"version_id" integer NOT NULL,
	"book_id" varchar(16) NOT NULL,
	"chapter" integer NOT NULL,
	"start_verse" integer NOT NULL,
	"start_offset" integer NOT NULL,
	"end_verse" integer NOT NULL,
	"end_offset" integer NOT NULL,
	"color" varchar(24) DEFAULT 'amber' NOT NULL,
	"selected_text" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "book_id" varchar(16);--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "chapter" integer;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "start_verse" integer;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "start_offset" integer;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "end_verse" integer;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "end_offset" integer;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "selected_text" text;--> statement-breakpoint
ALTER TABLE "bible_highlights" ADD CONSTRAINT "bible_highlights_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bible_highlights_lookup" ON "bible_highlights" USING btree ("user_id","version_id","book_id","chapter");--> statement-breakpoint
CREATE INDEX "idx_push_subscriptions_user" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_push_subscriptions_endpoint" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "idx_notes_passage" ON "notes" USING btree ("user_id","version_id","book_id","chapter");