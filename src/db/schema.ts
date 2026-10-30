import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
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
    color: text("color").default("#3B82F6").notNull(),
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
    title: text("title").notNull(),
    bodyHtml: text("body_html").default("").notNull(),
    plainTextSnippet: text("plain_text_snippet").default("").notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),
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
    index("idx_notes_user").on(table.userId),
    index("idx_notes_folder").on(table.folderId),
    index("idx_notes_plan_instance").on(table.planInstanceId),
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
    streakFreezesAvailable: integer("streak_freezes_available")
      .default(0)
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
