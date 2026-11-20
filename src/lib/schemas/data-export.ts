import * as v from "valibot";

export const CompactTrackerSchema = v.object({
  ref: v.pipe(v.string(), v.minLength(1, "Tracker reference is required")),
  name: v.pipe(v.string(), v.minLength(1, "Tracker name is required")),
  canon: v.pipe(v.string(), v.minLength(1, "Canon tradition is required")),
  icon: v.optional(v.string()),
  desc: v.optional(v.string()),
  archived: v.optional(v.boolean()),
  created: v.optional(v.string()),
  // Book ID -> array of completed chapter numbers (e.g. { "GEN": [1, 2, 3] })
  progress: v.optional(v.record(v.string(), v.array(v.number()))),
  // Book ID -> chapter -> verses (e.g. { "GEN": { "1": [1, 2, 3] } })
  verses: v.optional(
    v.record(v.string(), v.record(v.string(), v.array(v.number())))
  ),
});

export const CompactFolderSchema = v.object({
  ref: v.pipe(v.string(), v.minLength(1, "Folder reference is required")),
  name: v.pipe(v.string(), v.minLength(1, "Folder name is required")),
  color: v.optional(v.nullable(v.string())),
  icon: v.optional(v.nullable(v.string())),
  pinned: v.optional(v.boolean()),
  created: v.optional(v.string()),
});

export const CompactNoteSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Note title is required")),
  body: v.optional(v.string()),
  folder: v.optional(v.nullable(v.string())),
  tracker: v.optional(v.nullable(v.string())),
  plan: v.optional(v.nullable(v.string())),
  day: v.optional(v.nullable(v.number())),
  session: v.optional(v.nullable(v.number())),
  pinned: v.optional(v.boolean()),
  archived: v.optional(v.boolean()),
  created: v.optional(v.string()),
});

export const CompactPlanSchema = v.object({
  ref: v.pipe(v.string(), v.minLength(1, "Plan reference is required")),
  templateId: v.pipe(v.string(), v.minLength(1, "Template ID is required")),
  tracker: v.pipe(
    v.string(),
    v.minLength(1, "Plan tracker reference is required")
  ),
  title: v.pipe(v.string(), v.minLength(1, "Plan title is required")),
  status: v.optional(v.string()),
  mode: v.optional(v.string()),
  pace: v.optional(v.string()),
  start: v.pipe(v.string(), v.minLength(1, "Start date is required")),
  targetEnd: v.optional(v.nullable(v.string())),
  completedAt: v.optional(v.nullable(v.string())),
  dailyTarget: v.pipe(
    v.number(),
    v.minValue(1, "Daily target must be at least 1")
  ),
  totalChapters: v.pipe(
    v.number(),
    v.minValue(1, "Total chapters must be at least 1")
  ),
  daysMask: v.optional(v.string()),
  pacingSegments: v.optional(v.nullable(v.string())),
  created: v.optional(v.string()),
  // Array of reading item IDs completed
  readings: v.optional(v.array(v.string())),
  // Day overrides: array of [dayIndex, overrideDateISO]
  overrides: v.optional(v.array(v.tuple([v.number(), v.string()]))),
});

// Compact reading log tuple: [trackerRef, bookId, chapterNumber, loggedAtTimestamp, planRef?]
export const CompactReadingLogTupleSchema = v.tupleWithRest(
  [v.string(), v.string(), v.number(), v.string()],
  v.union([v.string(), v.null()])
);

export const UserDataExportSchema = v.object({
  v: v.literal(1),
  app: v.literal("Scripture Tracker"),
  exportedAt: v.pipe(
    v.string(),
    v.minLength(1, "Export timestamp is required")
  ),
  trackers: v.array(CompactTrackerSchema),
  folders: v.optional(v.array(CompactFolderSchema)),
  notes: v.optional(v.array(CompactNoteSchema)),
  plans: v.optional(v.array(CompactPlanSchema)),
  // Array of tuples: [trackerRef, bookId, chapter, loggedAtISO, planRef?]
  logs: v.optional(v.array(CompactReadingLogTupleSchema)),
  // Map of achievementId -> unlockedAtISO
  achievements: v.optional(v.record(v.string(), v.string())),
});

export type UserDataExport = v.InferOutput<typeof UserDataExportSchema>;
export type CompactTracker = v.InferOutput<typeof CompactTrackerSchema>;
export type CompactFolder = v.InferOutput<typeof CompactFolderSchema>;
export type CompactNote = v.InferOutput<typeof CompactNoteSchema>;
export type CompactPlan = v.InferOutput<typeof CompactPlanSchema>;
