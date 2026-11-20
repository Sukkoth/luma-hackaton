import * as v from "valibot";
import {
  UserDataExportSchema,
  type UserDataExport,
} from "./schemas/data-export";

export const CURRENT_BACKUP_VERSION = 1;

// Legacy verbose schema for backward compatibility with early v1 backups
export const LegacyTrackerProgressSchema = v.object({
  bookId: v.string(),
  chapter: v.number(),
  completedAt: v.optional(v.string()),
});

export const LegacyTrackerVerseProgressSchema = v.object({
  bookId: v.string(),
  chapter: v.number(),
  verse: v.number(),
  completedAt: v.optional(v.string()),
});

export const LegacyTrackerSchema = v.object({
  refId: v.optional(v.string()),
  ref: v.optional(v.string()),
  name: v.string(),
  canon: v.string(),
  description: v.optional(v.string()),
  icon: v.optional(v.string()),
  isArchived: v.optional(v.boolean()),
  chapterProgress: v.optional(v.array(LegacyTrackerProgressSchema)),
  verseProgress: v.optional(v.array(LegacyTrackerVerseProgressSchema)),
  createdAt: v.optional(v.string()),
});

export const LegacyFolderSchema = v.object({
  refId: v.optional(v.string()),
  ref: v.optional(v.string()),
  name: v.string(),
  color: v.optional(v.nullable(v.string())),
  icon: v.optional(v.nullable(v.string())),
  isPinned: v.optional(v.boolean()),
  createdAt: v.optional(v.string()),
});

export const LegacyNoteSchema = v.object({
  title: v.string(),
  bodyHtml: v.optional(v.string()),
  body: v.optional(v.string()),
  plainTextSnippet: v.optional(v.string()),
  folderRef: v.optional(v.nullable(v.string())),
  trackerRef: v.optional(v.nullable(v.string())),
  planInstanceRef: v.optional(v.nullable(v.string())),
  planDayNumber: v.optional(v.nullable(v.number())),
  planSessionId: v.optional(v.nullable(v.number())),
  isPinned: v.optional(v.boolean()),
  isArchived: v.optional(v.boolean()),
  createdAt: v.optional(v.string()),
});

export const LegacyPlanSchema = v.object({
  refId: v.optional(v.string()),
  ref: v.optional(v.string()),
  templateId: v.string(),
  trackerRef: v.optional(v.string()),
  tracker: v.optional(v.string()),
  title: v.string(),
  status: v.optional(v.string()),
  mode: v.optional(v.string()),
  paceType: v.optional(v.string()),
  startDate: v.optional(v.string()),
  start: v.optional(v.string()),
  targetEndDate: v.optional(v.nullable(v.string())),
  dailyTarget: v.number(),
  totalChapters: v.number(),
  activeDaysMask: v.optional(v.string()),
  completedReadings: v.optional(
    v.array(
      v.object({
        readingItemId: v.string(),
        completedAt: v.optional(v.string()),
      })
    )
  ),
  dayOverrides: v.optional(
    v.array(
      v.object({
        dayIndex: v.number(),
        overrideDate: v.string(),
      })
    )
  ),
  createdAt: v.optional(v.string()),
});

export const LegacyReadingLogSchema = v.object({
  trackerRef: v.optional(v.string()),
  tracker: v.optional(v.string()),
  bookId: v.string(),
  bookName: v.optional(v.string()),
  chapter: v.number(),
  loggedAt: v.string(),
  planInstanceRef: v.optional(v.nullable(v.string())),
});

export const LegacyVerboseBackupSchema = v.object({
  version: v.literal(1),
  app: v.literal("Scripture Tracker"),
  exportedAt: v.optional(v.string()),
  trackers: v.array(LegacyTrackerSchema),
  noteFolders: v.optional(v.array(LegacyFolderSchema)),
  notes: v.optional(v.array(LegacyNoteSchema)),
  planInstances: v.optional(v.array(LegacyPlanSchema)),
  readingLogs: v.optional(v.array(LegacyReadingLogSchema)),
  achievements: v.optional(
    v.array(
      v.object({
        achievementId: v.string(),
        unlockedAt: v.optional(v.string()),
      })
    )
  ),
});

export type LegacyVerboseBackup = v.InferOutput<
  typeof LegacyVerboseBackupSchema
>;

/**
 * Migrates a legacy verbose backup (version: 1) to the modern compact schema (v: 1)
 */
export function migrateLegacyVerboseToV1({
  legacy,
}: {
  legacy: LegacyVerboseBackup;
}): UserDataExport {
  const trackers = legacy.trackers.map((t, idx) => {
    const ref = t.refId || t.ref || `t_${idx}`;

    const progress: Record<string, number[]> = {};
    for (const cp of t.chapterProgress ?? []) {
      if (!progress[cp.bookId]) progress[cp.bookId] = [];
      progress[cp.bookId]!.push(cp.chapter);
    }
    for (const b of Object.keys(progress)) {
      progress[b]!.sort((a, b) => a - b);
    }

    const verses: Record<string, Record<string, number[]>> = {};
    for (const vp of t.verseProgress ?? []) {
      if (!verses[vp.bookId]) verses[vp.bookId] = {};
      const chStr = String(vp.chapter);
      if (!verses[vp.bookId]![chStr]) verses[vp.bookId]![chStr] = [];
      verses[vp.bookId]![chStr]!.push(vp.verse);
    }

    return {
      ref,
      name: t.name,
      canon: t.canon,
      icon: t.icon,
      desc: t.description,
      archived: t.isArchived,
      created: t.createdAt,
      progress,
      verses: Object.keys(verses).length > 0 ? verses : undefined,
    };
  });

  const folders = (legacy.noteFolders ?? []).map((f, idx) => ({
    ref: f.refId || f.ref || `f_${idx}`,
    name: f.name,
    color: f.color,
    icon: f.icon,
    pinned: f.isPinned,
    created: f.createdAt,
  }));

  const notes = (legacy.notes ?? []).map((n) => ({
    title: n.title,
    body: n.bodyHtml || n.body || "",
    folder: n.folderRef ?? null,
    tracker: n.trackerRef ?? null,
    plan: n.planInstanceRef ?? null,
    day: n.planDayNumber ?? null,
    session: n.planSessionId ?? null,
    pinned: n.isPinned,
    archived: n.isArchived,
    created: n.createdAt,
  }));

  const plans = (legacy.planInstances ?? []).map((p, idx) => ({
    ref: p.refId || p.ref || `p_${idx}`,
    templateId: p.templateId,
    tracker: p.trackerRef || p.tracker || trackers[0]?.ref || "t_0",
    title: p.title,
    status: p.status,
    mode: p.mode,
    pace: p.paceType,
    start: p.startDate || p.start || new Date().toISOString(),
    targetEnd: p.targetEndDate ?? null,
    dailyTarget: p.dailyTarget,
    totalChapters: p.totalChapters,
    daysMask: p.activeDaysMask,
    created: p.createdAt,
    readings: (p.completedReadings ?? []).map((r) => r.readingItemId),
    overrides: (p.dayOverrides ?? []).map(
      (o) => [o.dayIndex, o.overrideDate] as [number, string]
    ),
  }));

  const logs = (legacy.readingLogs ?? []).map((l) => {
    const tRef = l.trackerRef || l.tracker || trackers[0]?.ref || "t_0";
    const tuple: [string, string, number, string, ...(string | null)[]] =
      l.planInstanceRef
        ? [tRef, l.bookId, l.chapter, l.loggedAt, l.planInstanceRef]
        : [tRef, l.bookId, l.chapter, l.loggedAt];
    return tuple;
  });

  const achievements: Record<string, string> = {};
  for (const a of legacy.achievements ?? []) {
    achievements[a.achievementId] = a.unlockedAt || new Date().toISOString();
  }

  return {
    v: 1,
    app: "Scripture Tracker",
    exportedAt: legacy.exportedAt || new Date().toISOString(),
    trackers,
    folders: folders.length > 0 ? folders : undefined,
    notes: notes.length > 0 ? notes : undefined,
    plans: plans.length > 0 ? plans : undefined,
    logs: logs.length > 0 ? logs : undefined,
    achievements:
      Object.keys(achievements).length > 0 ? achievements : undefined,
  };
}

export type NormalizeBackupParams = {
  raw: unknown;
};

/**
 * Normalizes any recognized backup version into the latest canonical UserDataExport format.
 * Automatically steps forward through sequential migrations.
 */
export function normalizeBackupToLatest({
  raw,
}: NormalizeBackupParams): UserDataExport {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid backup: Root payload must be a JSON object.");
  }

  const rawObj = raw as Record<string, unknown>;

  // Check 1: Modern compact format with 'v'
  if ("v" in rawObj) {
    const version = rawObj.v;
    if (version === 1) {
      const parsed = v.safeParse(UserDataExportSchema, raw);
      if (parsed.success) {
        return parsed.output;
      }
      const firstIssue =
        parsed.issues[0]?.message ?? "Invalid schema structure.";
      throw new Error(`Invalid v1 backup format: ${firstIssue}`);
    }

    throw new Error(`Unsupported backup version: v${version}.`);
  }

  // Check 2: Legacy verbose format with 'version: 1'
  if ("version" in rawObj && rawObj.version === 1) {
    const parsedLegacy = v.safeParse(LegacyVerboseBackupSchema, raw);
    if (!parsedLegacy.success) {
      const firstIssue =
        parsedLegacy.issues[0]?.message ?? "Invalid legacy backup structure.";
      throw new Error(`Invalid legacy backup format: ${firstIssue}`);
    }

    return migrateLegacyVerboseToV1({ legacy: parsedLegacy.output });
  }

  throw new Error(
    "Unrecognized backup file format. Missing valid 'v' or 'version' key."
  );
}
