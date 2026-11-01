import * as v from "valibot";

export const ToggleChapterSchema = v.object({
  trackerId: v.pipe(v.string(), v.minLength(1, "Tracker ID is required")),
  bookId: v.pipe(v.string(), v.minLength(1, "Book ID is required")),
  bookName: v.pipe(v.string(), v.minLength(1, "Book name is required")),
  chapter: v.pipe(v.number(), v.minValue(1, "Chapter must be at least 1")),
});

export type ToggleChapterInput = v.InferOutput<typeof ToggleChapterSchema>;

export const MarkAllChaptersSchema = v.object({
  trackerId: v.pipe(v.string(), v.minLength(1, "Tracker ID is required")),
  bookId: v.pipe(v.string(), v.minLength(1, "Book ID is required")),
  bookName: v.pipe(v.string(), v.minLength(1, "Book name is required")),
  totalChapters: v.pipe(
    v.number(),
    v.minValue(1, "Total chapters must be at least 1")
  ),
});

export type MarkAllChaptersInput = v.InferOutput<typeof MarkAllChaptersSchema>;

export const ClearAllChaptersSchema = v.object({
  trackerId: v.pipe(v.string(), v.minLength(1, "Tracker ID is required")),
  bookId: v.pipe(v.string(), v.minLength(1, "Book ID is required")),
});

export type ClearAllChaptersInput = v.InferOutput<
  typeof ClearAllChaptersSchema
>;
