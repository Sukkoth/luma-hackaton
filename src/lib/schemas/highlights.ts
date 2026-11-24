import * as v from "valibot";

export const HIGHLIGHT_COLORS = [
  "amber",
  "green",
  "blue",
  "rose",
  "purple",
] as const;

export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

export const HighlightColorSchema = v.picklist(HIGHLIGHT_COLORS);

export const GetChapterHighlightsSchema = v.object({
  versionId: v.pipe(v.number(), v.integer(), v.minValue(1)),
  bookId: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(16)),
  chapter: v.pipe(v.number(), v.integer(), v.minValue(1)),
});

export type GetChapterHighlightsInput = v.InferOutput<
  typeof GetChapterHighlightsSchema
>;

export const CreateHighlightSchema = v.pipe(
  v.object({
    versionId: v.pipe(v.number(), v.integer(), v.minValue(1)),
    bookId: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(16)),
    chapter: v.pipe(v.number(), v.integer(), v.minValue(1)),
    startVerse: v.pipe(v.number(), v.integer(), v.minValue(1)),
    startOffset: v.pipe(v.number(), v.integer(), v.minValue(0)),
    endVerse: v.pipe(v.number(), v.integer(), v.minValue(1)),
    endOffset: v.pipe(v.number(), v.integer(), v.minValue(1)),
    color: v.optional(HighlightColorSchema, "amber"),
    selectedText: v.optional(v.pipe(v.string(), v.maxLength(8000)), ""),
  }),
  v.check(
    (input) =>
      input.startVerse < input.endVerse ||
      (input.startVerse === input.endVerse &&
        input.startOffset < input.endOffset),
    "Highlight end must come after highlight start"
  )
);

export type CreateHighlightInput = v.InferOutput<typeof CreateHighlightSchema>;

export const UpdateHighlightColorSchema = v.object({
  highlightId: v.pipe(v.string(), v.minLength(1, "Highlight ID is required")),
  color: HighlightColorSchema,
});

export type UpdateHighlightColorInput = v.InferOutput<
  typeof UpdateHighlightColorSchema
>;

export const DeleteHighlightSchema = v.object({
  highlightId: v.pipe(v.string(), v.minLength(1, "Highlight ID is required")),
});

export type DeleteHighlightInput = v.InferOutput<typeof DeleteHighlightSchema>;
