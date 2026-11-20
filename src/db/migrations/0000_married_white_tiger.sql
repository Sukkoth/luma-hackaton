CREATE TABLE "group_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"actor_id" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"action_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_member_enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"group_plan_id" text NOT NULL,
	"user_id" text NOT NULL,
	"plan_instance_id" text NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"hide_progress" boolean DEFAULT false NOT NULL,
	"last_viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"privacy_updated_at" timestamp with time zone,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"plan_template_id" text NOT NULL,
	"scheduled_start_date" timestamp with time zone NOT NULL,
	"status" varchar(30) DEFAULT 'scheduled' NOT NULL,
	"late_join_policy" varchar(30) DEFAULT 'skip_ahead' NOT NULL,
	"daily_chapter_target" integer DEFAULT 3 NOT NULL,
	"active_weekdays_mask" text DEFAULT '1111111' NOT NULL,
	"created_by" text NOT NULL,
	"activated_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"avatar_url" text,
	"invite_code" varchar(32) NOT NULL,
	"owner_id" text NOT NULL,
	"is_private" boolean DEFAULT true NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"pinned_notice_title" varchar(150),
	"pinned_notice_content" text,
	"pinned_notice_expires_at" timestamp with time zone,
	"pinned_notice_author_id" text,
	"pinned_notice_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "groups_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "note_folders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"icon" text,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tracker_id" text,
	"folder_id" text,
	"plan_instance_id" text,
	"plan_day_number" integer,
	"plan_session_id" integer,
	"title" text NOT NULL,
	"body_html" text DEFAULT '' NOT NULL,
	"plain_text_snippet" text DEFAULT '' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"is_shared_with_community" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"action_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_day_overrides" (
	"id" text PRIMARY KEY NOT NULL,
	"instance_id" text NOT NULL,
	"day_index" integer NOT NULL,
	"override_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_instance_readings" (
	"id" text PRIMARY KEY NOT NULL,
	"instance_id" text NOT NULL,
	"reading_item_id" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_instances" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tracker_id" text NOT NULL,
	"template_id" text NOT NULL,
	"title" text NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"mode" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"pace_type" varchar(50) DEFAULT 'by_daily_target' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"target_end_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"daily_target" integer NOT NULL,
	"total_chapters" integer NOT NULL,
	"active_days_mask" text DEFAULT '1111111' NOT NULL,
	"pacing_segments_json" text,
	"reminder_enabled" boolean DEFAULT false NOT NULL,
	"reminder_time" text,
	"group_plan_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_reading_items" (
	"id" text PRIMARY KEY NOT NULL,
	"template_id" text NOT NULL,
	"book_id" text NOT NULL,
	"chapter" integer NOT NULL,
	"start_verse" integer,
	"end_verse" integer,
	"verse_range" text,
	"verses_label" text,
	"track" text,
	"display_text" text,
	"day_number" integer,
	"order_index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"template_id" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text DEFAULT '' NOT NULL,
	"chapters_count" integer NOT NULL,
	"books_description" text DEFAULT '' NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" varchar(100) DEFAULT 'general' NOT NULL,
	"icon" text DEFAULT 'calendar' NOT NULL,
	"accent_color" text DEFAULT '#3B82F6' NOT NULL,
	"total_chapters" integer NOT NULL,
	"default_daily_target" integer NOT NULL,
	"target_days" integer NOT NULL,
	"canon_compatibility" text,
	"allow_custom_pace" boolean DEFAULT true NOT NULL,
	"allow_self_paced" boolean DEFAULT true NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"author_id" text,
	"author_name" text,
	"share_code" text,
	"downloads_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tracker_id" text NOT NULL,
	"book_id" text NOT NULL,
	"book_name" text NOT NULL,
	"chapter" integer NOT NULL,
	"plan_instance_id" text,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_trackers" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"icon" text DEFAULT 'book' NOT NULL,
	"canon" varchar(50) DEFAULT 'protestant' NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracker_chapter_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"tracker_id" text NOT NULL,
	"book_id" text NOT NULL,
	"chapter" integer NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracker_verse_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"tracker_id" text NOT NULL,
	"book_id" text NOT NULL,
	"chapter" integer NOT NULL,
	"verse" integer NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unlocked_achievements" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"achievement_id" text NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"celebrated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"active_tracker_id" text,
	"has_completed_onboarding" boolean DEFAULT false NOT NULL,
	"theme_preference" varchar(50) DEFAULT 'system' NOT NULL,
	"haptics_enabled" boolean DEFAULT true NOT NULL,
	"celebrations_enabled" boolean DEFAULT true NOT NULL,
	"default_pacing" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_read_date" text,
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"streak_freezes_available" integer DEFAULT 0 NOT NULL,
	"daily_reminder_enabled" boolean DEFAULT false NOT NULL,
	"daily_reminder_time" varchar(10) DEFAULT '20:00' NOT NULL,
	"frozen_dates_json" text,
	"freeze_restoration_days_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified_at" timestamp,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_activities" ADD CONSTRAINT "group_activities_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_activities" ADD CONSTRAINT "group_activities_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_member_enrollments" ADD CONSTRAINT "group_member_enrollments_group_plan_id_group_plans_id_fk" FOREIGN KEY ("group_plan_id") REFERENCES "public"."group_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_member_enrollments" ADD CONSTRAINT "group_member_enrollments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_member_enrollments" ADD CONSTRAINT "group_member_enrollments_plan_instance_id_plan_instances_id_fk" FOREIGN KEY ("plan_instance_id") REFERENCES "public"."plan_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_plans" ADD CONSTRAINT "group_plans_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_plans" ADD CONSTRAINT "group_plans_plan_template_id_plan_templates_id_fk" FOREIGN KEY ("plan_template_id") REFERENCES "public"."plan_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_plans" ADD CONSTRAINT "group_plans_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_pinned_notice_author_id_user_id_fk" FOREIGN KEY ("pinned_notice_author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_folders" ADD CONSTRAINT "note_folders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_tracker_id_reading_trackers_id_fk" FOREIGN KEY ("tracker_id") REFERENCES "public"."reading_trackers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_folder_id_note_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."note_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_plan_instance_id_plan_instances_id_fk" FOREIGN KEY ("plan_instance_id") REFERENCES "public"."plan_instances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_day_overrides" ADD CONSTRAINT "plan_day_overrides_instance_id_plan_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."plan_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_instance_readings" ADD CONSTRAINT "plan_instance_readings_instance_id_plan_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."plan_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_instance_readings" ADD CONSTRAINT "plan_instance_readings_reading_item_id_plan_reading_items_id_fk" FOREIGN KEY ("reading_item_id") REFERENCES "public"."plan_reading_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_instances" ADD CONSTRAINT "plan_instances_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_instances" ADD CONSTRAINT "plan_instances_tracker_id_reading_trackers_id_fk" FOREIGN KEY ("tracker_id") REFERENCES "public"."reading_trackers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_instances" ADD CONSTRAINT "plan_instances_template_id_plan_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."plan_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_reading_items" ADD CONSTRAINT "plan_reading_items_template_id_plan_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."plan_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_sections" ADD CONSTRAINT "plan_sections_template_id_plan_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."plan_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_logs" ADD CONSTRAINT "reading_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_logs" ADD CONSTRAINT "reading_logs_tracker_id_reading_trackers_id_fk" FOREIGN KEY ("tracker_id") REFERENCES "public"."reading_trackers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_logs" ADD CONSTRAINT "reading_logs_plan_instance_id_plan_instances_id_fk" FOREIGN KEY ("plan_instance_id") REFERENCES "public"."plan_instances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_trackers" ADD CONSTRAINT "reading_trackers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_chapter_progress" ADD CONSTRAINT "tracker_chapter_progress_tracker_id_reading_trackers_id_fk" FOREIGN KEY ("tracker_id") REFERENCES "public"."reading_trackers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_verse_progress" ADD CONSTRAINT "tracker_verse_progress_tracker_id_reading_trackers_id_fk" FOREIGN KEY ("tracker_id") REFERENCES "public"."reading_trackers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unlocked_achievements" ADD CONSTRAINT "unlocked_achievements_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_group_activities_group" ON "group_activities" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_group_activities_actor" ON "group_activities" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_group_activities_created" ON "group_activities" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_group_enrollments_unique" ON "group_member_enrollments" USING btree ("group_plan_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_group_enrollments_plan" ON "group_member_enrollments" USING btree ("group_plan_id");--> statement-breakpoint
CREATE INDEX "idx_group_enrollments_user" ON "group_member_enrollments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_group_enrollments_instance" ON "group_member_enrollments" USING btree ("plan_instance_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_group_members_unique" ON "group_members" USING btree ("group_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_group_members_group" ON "group_members" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_group_members_user" ON "group_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_group_members_status" ON "group_members" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_group_plans_group" ON "group_plans" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_group_plans_status" ON "group_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_group_plans_template" ON "group_plans" USING btree ("plan_template_id");--> statement-breakpoint
CREATE INDEX "idx_groups_owner" ON "groups" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_groups_invite_code" ON "groups" USING btree ("invite_code");--> statement-breakpoint
CREATE INDEX "idx_groups_is_private" ON "groups" USING btree ("is_private");--> statement-breakpoint
CREATE INDEX "idx_note_folders_user" ON "note_folders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notes_user" ON "notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notes_folder" ON "notes" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "idx_notes_plan_instance" ON "notes" USING btree ("plan_instance_id");--> statement-breakpoint
CREATE INDEX "idx_notes_community_shared" ON "notes" USING btree ("plan_instance_id","plan_day_number","is_shared_with_community");--> statement-breakpoint
CREATE INDEX "idx_notifications_user" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_unread" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_created" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_day_overrides_unique" ON "plan_day_overrides" USING btree ("instance_id","day_index");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_instance_readings_unique" ON "plan_instance_readings" USING btree ("instance_id","reading_item_id");--> statement-breakpoint
CREATE INDEX "idx_instance_readings_instance" ON "plan_instance_readings" USING btree ("instance_id");--> statement-breakpoint
CREATE INDEX "idx_plan_instances_user" ON "plan_instances" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_plan_instances_tracker" ON "plan_instances" USING btree ("tracker_id");--> statement-breakpoint
CREATE INDEX "idx_plan_instances_status" ON "plan_instances" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_plan_instances_group_plan" ON "plan_instances" USING btree ("group_plan_id");--> statement-breakpoint
CREATE INDEX "idx_reading_items_template" ON "plan_reading_items" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_reading_items_order" ON "plan_reading_items" USING btree ("order_index");--> statement-breakpoint
CREATE INDEX "idx_plan_sections_template" ON "plan_sections" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_plan_sections_order" ON "plan_sections" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_templates_category" ON "plan_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_templates_published" ON "plan_templates" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "idx_reading_logs_user" ON "reading_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_reading_logs_tracker" ON "reading_logs" USING btree ("tracker_id");--> statement-breakpoint
CREATE INDEX "idx_reading_logs_date" ON "reading_logs" USING btree ("logged_at");--> statement-breakpoint
CREATE INDEX "idx_trackers_user" ON "reading_trackers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_trackers_archived" ON "reading_trackers" USING btree ("is_archived");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_chapter_progress_unique" ON "tracker_chapter_progress" USING btree ("tracker_id","book_id","chapter");--> statement-breakpoint
CREATE INDEX "idx_chapter_progress_tracker" ON "tracker_chapter_progress" USING btree ("tracker_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_verse_progress_unique" ON "tracker_verse_progress" USING btree ("tracker_id","book_id","chapter","verse");--> statement-breakpoint
CREATE INDEX "idx_verse_progress_tracker" ON "tracker_verse_progress" USING btree ("tracker_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_achievement_unique" ON "unlocked_achievements" USING btree ("user_id","achievement_id");--> statement-breakpoint
CREATE INDEX "idx_achievements_user" ON "unlocked_achievements" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_settings_user" ON "user_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");