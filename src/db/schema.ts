import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

// --- Trackers ---
export const readingTrackers = pgTable(
  "reading_trackers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").default("").notNull(),
    icon: text("icon").default("book").notNull(),
    canon: varchar("canon", { length: 50 }).default("protestant").notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_trackers_user").on(table.userId),
    index("idx_trackers_archived").on(table.isArchived),
  ]
);

export const readingTrackersRelations = relations(
  readingTrackers,
  ({ one, many }) => ({
    user: one(user, {
      fields: [readingTrackers.userId],
      references: [user.id],
    }),
    chapterProgress: many(trackerChapterProgress),
    verseProgress: many(trackerVerseProgress),
    logs: many(readingLogs),
    planInstances: many(planInstances),
    notes: many(notes),
  })
);

// --- Chapter & Verse Progress ---
export const trackerChapterProgress = pgTable(
  "tracker_chapter_progress",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    trackerId: text("tracker_id")
      .notNull()
      .references(() => readingTrackers.id, { onDelete: "cascade" }),
    bookId: text("book_id").notNull(),
    chapter: integer("chapter").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_chapter_progress_unique").on(
      table.trackerId,
      table.bookId,
      table.chapter
    ),
    index("idx_chapter_progress_tracker").on(table.trackerId),
  ]
);

export const trackerChapterProgressRelations = relations(
  trackerChapterProgress,
  ({ one }) => ({
    tracker: one(readingTrackers, {
      fields: [trackerChapterProgress.trackerId],
      references: [readingTrackers.id],
    }),
  })
);

export const trackerVerseProgress = pgTable(
  "tracker_verse_progress",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    trackerId: text("tracker_id")
      .notNull()
      .references(() => readingTrackers.id, { onDelete: "cascade" }),
    bookId: text("book_id").notNull(),
    chapter: integer("chapter").notNull(),
    verse: integer("verse").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_verse_progress_unique").on(
      table.trackerId,
      table.bookId,
      table.chapter,
      table.verse
    ),
    index("idx_verse_progress_tracker").on(table.trackerId),
  ]
);

export const trackerVerseProgressRelations = relations(
  trackerVerseProgress,
  ({ one }) => ({
    tracker: one(readingTrackers, {
      fields: [trackerVerseProgress.trackerId],
      references: [readingTrackers.id],
    }),
  })
);

// --- Plan Templates, Sections & Items ---
export const planTemplates = pgTable(
  "plan_templates",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    subtitle: text("subtitle").default("").notNull(),
    description: text("description").default("").notNull(),
    category: varchar("category", { length: 100 }).default("general").notNull(),
    icon: text("icon").default("calendar").notNull(),
    accentColor: text("accent_color").default("#3B82F6").notNull(),
    totalChapters: integer("total_chapters").notNull(),
    defaultDailyTarget: integer("default_daily_target").notNull(),
    targetDays: integer("target_days").notNull(),
    canonCompatibility: text("canon_compatibility"),
    allowCustomPace: boolean("allow_custom_pace").default(true).notNull(),
    allowSelfPaced: boolean("allow_self_paced").default(true).notNull(),
    isCustom: boolean("is_custom").default(false).notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    authorId: text("author_id"),
    authorName: text("author_name"),
    shareCode: text("share_code"),
    downloadsCount: integer("downloads_count").default(0).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_templates_category").on(table.category),
    index("idx_templates_published").on(table.isPublished),
  ]
);

export const planTemplatesRelations = relations(planTemplates, ({ many }) => ({
  sections: many(planSections),
  readings: many(planReadingItems),
  instances: many(planInstances),
}));

export const planSections = pgTable(
  "plan_sections",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    templateId: text("template_id")
      .notNull()
      .references(() => planTemplates.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    subtitle: text("subtitle").default("").notNull(),
    chaptersCount: integer("chapters_count").notNull(),
    booksDescription: text("books_description").default("").notNull(),
    sortOrder: integer("sort_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_plan_sections_template").on(table.templateId),
    index("idx_plan_sections_order").on(table.sortOrder),
  ]
);

export const planSectionsRelations = relations(planSections, ({ one }) => ({
  template: one(planTemplates, {
    fields: [planSections.templateId],
    references: [planTemplates.id],
  }),
}));

export const planReadingItems = pgTable(
  "plan_reading_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    templateId: text("template_id")
      .notNull()
      .references(() => planTemplates.id, { onDelete: "cascade" }),
    bookId: text("book_id").notNull(),
    chapter: integer("chapter").notNull(),
    startVerse: integer("start_verse"),
    endVerse: integer("end_verse"),
    verseRange: text("verse_range"),
    versesLabel: text("verses_label"),
    track: text("track"),
    displayText: text("display_text"),
    dayNumber: integer("day_number"),
    orderIndex: integer("order_index").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_reading_items_template").on(table.templateId),
    index("idx_reading_items_order").on(table.orderIndex),
  ]
);

export const planReadingItemsRelations = relations(
  planReadingItems,
  ({ one, many }) => ({
    template: one(planTemplates, {
      fields: [planReadingItems.templateId],
      references: [planTemplates.id],
    }),
    completedReadings: many(planInstanceReadings),
  })
);

// --- Plan Instances ---
export const planInstances = pgTable(
  "plan_instances",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    trackerId: text("tracker_id")
      .notNull()
      .references(() => readingTrackers.id, { onDelete: "cascade" }),
    templateId: text("template_id")
      .notNull()
      .references(() => planTemplates.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    status: varchar("status", { length: 50 }).default("active").notNull(), // 'active' | 'completed' | 'paused' | 'archived'
    mode: varchar("mode", { length: 50 }).default("scheduled").notNull(), // 'scheduled' | 'flexible'
    paceType: varchar("pace_type", { length: 50 })
      .default("by_daily_target")
      .notNull(), // 'by_daily_target' | 'by_end_date' | 'self_paced'
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    targetEndDate: timestamp("target_end_date", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    dailyTarget: integer("daily_target").notNull(),
    totalChapters: integer("total_chapters").notNull(),
    activeDaysMask: text("active_days_mask").default("1111111").notNull(),
    pacingSegmentsJson: text("pacing_segments_json"),
    reminderEnabled: boolean("reminder_enabled").default(false).notNull(),
    reminderTime: text("reminder_time"),
    groupPlanId: text("group_plan_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_plan_instances_user").on(table.userId),
    index("idx_plan_instances_tracker").on(table.trackerId),
    index("idx_plan_instances_status").on(table.status),
    index("idx_plan_instances_group_plan").on(table.groupPlanId),
  ]
);

export const planInstancesRelations = relations(
  planInstances,
  ({ one, many }) => ({
    user: one(user, {
      fields: [planInstances.userId],
      references: [user.id],
    }),
    tracker: one(readingTrackers, {
      fields: [planInstances.trackerId],
      references: [readingTrackers.id],
    }),
    template: one(planTemplates, {
      fields: [planInstances.templateId],
      references: [planTemplates.id],
    }),
    completedReadings: many(planInstanceReadings),
    dayOverrides: many(planDayOverrides),
    notes: many(notes),
    logs: many(readingLogs),
  })
);

export const planInstanceReadings = pgTable(
  "plan_instance_readings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    instanceId: text("instance_id")
      .notNull()
      .references(() => planInstances.id, { onDelete: "cascade" }),
    readingItemId: text("reading_item_id")
      .notNull()
      .references(() => planReadingItems.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_instance_readings_unique").on(
      table.instanceId,
      table.readingItemId
    ),
    index("idx_instance_readings_instance").on(table.instanceId),
  ]
);

export const planInstanceReadingsRelations = relations(
  planInstanceReadings,
  ({ one }) => ({
    instance: one(planInstances, {
      fields: [planInstanceReadings.instanceId],
      references: [planInstances.id],
    }),
    readingItem: one(planReadingItems, {
      fields: [planInstanceReadings.readingItemId],
      references: [planReadingItems.id],
    }),
  })
);

export const planDayOverrides = pgTable(
  "plan_day_overrides",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    instanceId: text("instance_id")
      .notNull()
      .references(() => planInstances.id, { onDelete: "cascade" }),
    dayIndex: integer("day_index").notNull(),
    overrideDate: timestamp("override_date", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_day_overrides_unique").on(
      table.instanceId,
      table.dayIndex
    ),
  ]
);

export const planDayOverridesRelations = relations(
  planDayOverrides,
  ({ one }) => ({
    instance: one(planInstances, {
      fields: [planDayOverrides.instanceId],
      references: [planInstances.id],
    }),
  })
);

// --- Reading Logs ---
export const readingLogs = pgTable(
  "reading_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    trackerId: text("tracker_id")
      .notNull()
      .references(() => readingTrackers.id, { onDelete: "cascade" }),
    bookId: text("book_id").notNull(),
    bookName: text("book_name").notNull(),
    chapter: integer("chapter").notNull(),
    planInstanceId: text("plan_instance_id").references(
      () => planInstances.id,
      { onDelete: "set null" }
    ),
    loggedAt: timestamp("logged_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_reading_logs_user").on(table.userId),
    index("idx_reading_logs_tracker").on(table.trackerId),
    index("idx_reading_logs_date").on(table.loggedAt),
  ]
);

export const readingLogsRelations = relations(readingLogs, ({ one }) => ({
  user: one(user, {
    fields: [readingLogs.userId],
    references: [user.id],
  }),
  tracker: one(readingTrackers, {
    fields: [readingLogs.trackerId],
    references: [readingTrackers.id],
  }),
  planInstance: one(planInstances, {
    fields: [readingLogs.planInstanceId],
    references: [planInstances.id],
  }),
}));

// --- Notes & Folders ---
export const noteFolders = pgTable(
  "note_folders",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    icon: text("icon"),
    isPinned: boolean("is_pinned").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("idx_note_folders_user").on(table.userId)]
);

export const noteFoldersRelations = relations(noteFolders, ({ one, many }) => ({
  user: one(user, {
    fields: [noteFolders.userId],
    references: [user.id],
  }),
  notes: many(notes),
}));

export const notes = pgTable(
  "notes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    trackerId: text("tracker_id").references(() => readingTrackers.id, {
      onDelete: "cascade",
    }),
    folderId: text("folder_id").references(() => noteFolders.id, {
      onDelete: "set null",
    }),
    planInstanceId: text("plan_instance_id").references(
      () => planInstances.id,
      { onDelete: "set null" }
    ),
    planDayNumber: integer("plan_day_number"),
    planSessionId: integer("plan_session_id"),
    versionId: integer("version_id"),
    bookId: varchar("book_id", { length: 16 }),
    chapter: integer("chapter"),
    startVerse: integer("start_verse"),
    startOffset: integer("start_offset"),
    endVerse: integer("end_verse"),
    endOffset: integer("end_offset"),
    selectedText: text("selected_text"),
    title: text("title").notNull(),
    bodyHtml: text("body_html").default("").notNull(),
    plainTextSnippet: text("plain_text_snippet").default("").notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    isSharedWithCommunity: boolean("is_shared_with_community")
      .default(false)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_notes_user").on(table.userId),
    index("idx_notes_folder").on(table.folderId),
    index("idx_notes_plan_instance").on(table.planInstanceId),
    index("idx_notes_community_shared").on(
      table.planInstanceId,
      table.planDayNumber,
      table.isSharedWithCommunity
    ),
    index("idx_notes_passage").on(
      table.userId,
      table.versionId,
      table.bookId,
      table.chapter
    ),
  ]
);

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(user, {
    fields: [notes.userId],
    references: [user.id],
  }),
  tracker: one(readingTrackers, {
    fields: [notes.trackerId],
    references: [readingTrackers.id],
  }),
  folder: one(noteFolders, {
    fields: [notes.folderId],
    references: [noteFolders.id],
  }),
  planInstance: one(planInstances, {
    fields: [notes.planInstanceId],
    references: [planInstances.id],
  }),
}));

// --- User Settings ---
export const userSettings = pgTable(
  "user_settings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    activeTrackerId: text("active_tracker_id"),
    hasCompletedOnboarding: boolean("has_completed_onboarding")
      .default(false)
      .notNull(),
    themePreference: varchar("theme_preference", { length: 50 })
      .default("system")
      .notNull(),
    hapticsEnabled: boolean("haptics_enabled").default(true).notNull(),
    celebrationsEnabled: boolean("celebrations_enabled")
      .default(true)
      .notNull(),
    defaultPacing: varchar("default_pacing", { length: 50 })
      .default("scheduled")
      .notNull(),
    currentStreak: integer("current_streak").default(0).notNull(),
    longestStreak: integer("longest_streak").default(0).notNull(),
    lastReadDate: text("last_read_date"),
    timezone: varchar("timezone", { length: 100 }).default("UTC").notNull(),
    streakFreezesAvailable: integer("streak_freezes_available")
      .default(0)
      .notNull(),
    dailyReminderEnabled: boolean("daily_reminder_enabled")
      .default(false)
      .notNull(),
    dailyReminderTime: varchar("daily_reminder_time", { length: 10 })
      .default("20:00")
      .notNull(),
    frozenDatesJson: text("frozen_dates_json"),
    freezeRestorationDaysCount: integer("freeze_restoration_days_count")
      .default(0)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("idx_user_settings_user").on(table.userId)]
);

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(user, {
    fields: [userSettings.userId],
    references: [user.id],
  }),
}));

// --- Achievements ---
export const unlockedAchievements = pgTable(
  "unlocked_achievements",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    achievementId: text("achievement_id").notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    celebratedAt: timestamp("celebrated_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("idx_user_achievement_unique").on(
      table.userId,
      table.achievementId
    ),
    index("idx_achievements_user").on(table.userId),
  ]
);

export const unlockedAchievementsRelations = relations(
  unlockedAchievements,
  ({ one }) => ({
    user: one(user, {
      fields: [unlockedAchievements.userId],
      references: [user.id],
    }),
  })
);

// --- Community & Cohort Reading ---

export type GroupRole = "owner" | "admin" | "member";
export type GroupPlanStatus =
  "scheduled" | "active" | "completed" | "cancelled";
export type GroupLateJoinPolicy = "strict_locked" | "skip_ahead" | "backfill";
export type GroupMembershipStatus = "active" | "pending_approval";

export const groups = pgTable(
  "groups",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description").default("").notNull(),
    avatarUrl: text("avatar_url"),
    inviteCode: varchar("invite_code", { length: 32 }).notNull().unique(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    isPrivate: boolean("is_private").default(true).notNull(),
    requiresApproval: boolean("requires_approval").default(false).notNull(),
    pinnedNoticeTitle: varchar("pinned_notice_title", { length: 150 }),
    pinnedNoticeContent: text("pinned_notice_content"),
    pinnedNoticeExpiresAt: timestamp("pinned_notice_expires_at", {
      withTimezone: true,
    }),
    pinnedNoticeAuthorId: text("pinned_notice_author_id").references(
      () => user.id,
      { onDelete: "set null" }
    ),
    pinnedNoticeUpdatedAt: timestamp("pinned_notice_updated_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_groups_owner").on(table.ownerId),
    uniqueIndex("idx_groups_invite_code").on(table.inviteCode),
    index("idx_groups_is_private").on(table.isPrivate),
  ]
);

export const groupsRelations = relations(groups, ({ one, many }) => ({
  owner: one(user, {
    fields: [groups.ownerId],
    references: [user.id],
  }),
  pinnedNoticeAuthor: one(user, {
    fields: [groups.pinnedNoticeAuthorId],
    references: [user.id],
  }),
  members: many(groupMembers),
  plans: many(groupPlans),
  activities: many(groupActivities),
}));

export const groupMembers = pgTable(
  "group_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).default("member").notNull(), // 'owner' | 'admin' | 'member'
    status: varchar("status", { length: 20 }).default("active").notNull(), // 'active' | 'pending_approval'
    hideProgress: boolean("hide_progress").default(false).notNull(),
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    privacyUpdatedAt: timestamp("privacy_updated_at", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_group_members_unique").on(table.groupId, table.userId),
    index("idx_group_members_group").on(table.groupId),
    index("idx_group_members_user").on(table.userId),
    index("idx_group_members_status").on(table.status),
  ]
);

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(user, {
    fields: [groupMembers.userId],
    references: [user.id],
  }),
}));

export const groupActivities = pgTable(
  "group_activities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(), // 'member_joined' | 'notice_pinned' | 'plan_scheduled'
    title: text("title").notNull(),
    body: text("body").notNull(),
    actionUrl: text("action_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_group_activities_group").on(table.groupId),
    index("idx_group_activities_actor").on(table.actorId),
    index("idx_group_activities_created").on(table.createdAt),
  ]
);

export const groupActivitiesRelations = relations(
  groupActivities,
  ({ one }) => ({
    group: one(groups, {
      fields: [groupActivities.groupId],
      references: [groups.id],
    }),
    actor: one(user, {
      fields: [groupActivities.actorId],
      references: [user.id],
    }),
  })
);

export const groupPlans = pgTable(
  "group_plans",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    planTemplateId: text("plan_template_id")
      .notNull()
      .references(() => planTemplates.id, { onDelete: "restrict" }),
    scheduledStartDate: timestamp("scheduled_start_date", {
      withTimezone: true,
    }).notNull(),
    status: varchar("status", { length: 30 }).default("scheduled").notNull(), // 'scheduled' | 'active' | 'completed' | 'cancelled'
    lateJoinPolicy: varchar("late_join_policy", { length: 30 })
      .default("skip_ahead")
      .notNull(), // 'strict_locked' | 'skip_ahead' | 'backfill'
    dailyChapterTarget: integer("daily_chapter_target").default(3).notNull(),
    activeWeekdaysMask: text("active_weekdays_mask")
      .default("1111111")
      .notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_group_plans_group").on(table.groupId),
    index("idx_group_plans_status").on(table.status),
    index("idx_group_plans_template").on(table.planTemplateId),
  ]
);

export const groupPlansRelations = relations(groupPlans, ({ one, many }) => ({
  group: one(groups, {
    fields: [groupPlans.groupId],
    references: [groups.id],
  }),
  template: one(planTemplates, {
    fields: [groupPlans.planTemplateId],
    references: [planTemplates.id],
  }),
  creator: one(user, {
    fields: [groupPlans.createdBy],
    references: [user.id],
  }),
  enrollments: many(groupMemberEnrollments),
}));

export const groupMemberEnrollments = pgTable(
  "group_member_enrollments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    groupPlanId: text("group_plan_id")
      .notNull()
      .references(() => groupPlans.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    planInstanceId: text("plan_instance_id")
      .notNull()
      .references(() => planInstances.id, { onDelete: "cascade" }),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_group_enrollments_unique").on(
      table.groupPlanId,
      table.userId
    ),
    index("idx_group_enrollments_plan").on(table.groupPlanId),
    index("idx_group_enrollments_user").on(table.userId),
    index("idx_group_enrollments_instance").on(table.planInstanceId),
  ]
);

export const groupMemberEnrollmentsRelations = relations(
  groupMemberEnrollments,
  ({ one }) => ({
    groupPlan: one(groupPlans, {
      fields: [groupMemberEnrollments.groupPlanId],
      references: [groupPlans.id],
    }),
    user: one(user, {
      fields: [groupMemberEnrollments.userId],
      references: [user.id],
    }),
    planInstance: one(planInstances, {
      fields: [groupMemberEnrollments.planInstanceId],
      references: [planInstances.id],
    }),
  })
);

// --- Notifications ---
export const notifications = pgTable(
  "notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(), // 'streak_alert' | 'freeze_used' | 'plan_reminder' | 'group_activity' | 'achievement' | 'system'
    title: text("title").notNull(),
    body: text("body").notNull(),
    actionUrl: text("action_url"),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_notifications_user").on(table.userId),
    index("idx_notifications_user_unread").on(table.userId, table.isRead),
    index("idx_notifications_created").on(table.createdAt),
  ]
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(user, {
    fields: [notifications.userId],
    references: [user.id],
  }),
}));

// --- Web Push Subscriptions ---
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_push_subscriptions_user").on(table.userId),
    uniqueIndex("idx_push_subscriptions_endpoint").on(table.endpoint),
  ]
);

export const pushSubscriptionsRelations = relations(
  pushSubscriptions,
  ({ one }) => ({
    user: one(user, {
      fields: [pushSubscriptions.userId],
      references: [user.id],
    }),
  })
);

// --- Bible Highlights ---
export const bibleHighlights = pgTable(
  "bible_highlights",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    versionId: integer("version_id").notNull(),
    bookId: varchar("book_id", { length: 16 }).notNull(),
    chapter: integer("chapter").notNull(),
    startVerse: integer("start_verse").notNull(),
    startOffset: integer("start_offset").notNull(),
    endVerse: integer("end_verse").notNull(),
    endOffset: integer("end_offset").notNull(),
    color: varchar("color", { length: 24 }).default("amber").notNull(),
    selectedText: text("selected_text").default("").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_bible_highlights_lookup").on(
      table.userId,
      table.versionId,
      table.bookId,
      table.chapter
    ),
  ]
);

export const bibleHighlightsRelations = relations(
  bibleHighlights,
  ({ one }) => ({
    user: one(user, {
      fields: [bibleHighlights.userId],
      references: [user.id],
    }),
  })
);

// --- Luma AI Folders, Conversations & Messages ---
export const aiFolders = pgTable(
  "ai_folders",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("idx_ai_folders_user").on(table.userId)]
);

export const aiFoldersRelations = relations(aiFolders, ({ one, many }) => ({
  user: one(user, {
    fields: [aiFolders.userId],
    references: [user.id],
  }),
  conversations: many(aiConversations),
}));

export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    folderId: text("folder_id").references(() => aiFolders.id, {
      onDelete: "set null",
    }),
    mode: varchar("mode", { length: 16 }).default("plan").notNull(),
    canon: varchar("canon", { length: 32 }).default("protestant").notNull(),
    title: text("title").notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    messageCount: integer("message_count").default(0).notNull(),
    lastMessageSequence: integer("last_message_sequence").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_ai_conversations_user_updated").on(
      table.userId,
      table.updatedAt
    ),
    index("idx_ai_conversations_folder").on(table.folderId),
  ]
);

export const aiConversationsRelations = relations(
  aiConversations,
  ({ one, many }) => ({
    user: one(user, {
      fields: [aiConversations.userId],
      references: [user.id],
    }),
    folder: one(aiFolders, {
      fields: [aiConversations.folderId],
      references: [aiFolders.id],
    }),
    messages: many(aiMessages),
  })
);

export const aiMessages = pgTable(
  "ai_messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => aiConversations.id, { onDelete: "cascade" }),
    parentMessageId: text("parent_message_id"),
    sequence: integer("sequence").notNull(),
    role: varchar("role", { length: 16 }).notNull(),
    content: text("content").notNull(),
    provider: text("provider"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_ai_messages_conv_seq").on(table.conversationId, table.sequence),
  ]
);

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  conversation: one(aiConversations, {
    fields: [aiMessages.conversationId],
    references: [aiConversations.id],
  }),
}));

export const aiRateLimits = pgTable(
  "ai_rate_limits",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    bucketKey: text("bucket_key").notNull(),
    count: integer("count").default(1).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.bucketKey] }),
    index("idx_ai_rate_limits_expires").on(table.expiresAt),
  ]
);
