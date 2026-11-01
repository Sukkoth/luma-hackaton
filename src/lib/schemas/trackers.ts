import * as v from "valibot";

export const TRACKER_CANONS = [
  "protestant",
  "catholic",
  "eastern_orthodox",
  "ethiopian_orthodox",
] as const;

export type TrackerCanon = (typeof TRACKER_CANONS)[number];

export const CreateTrackerSchema = v.object({
  name: v.pipe(
    v.string("Tracker name is required"),
    v.trim(),
    v.nonEmpty("Tracker name is required"),
    v.minLength(2, "Tracker name must be at least 2 characters"),
    v.maxLength(50, "Tracker name cannot exceed 50 characters")
  ),
  canon: v.pipe(
    v.string("Canon selection is required"),
    v.picklist(TRACKER_CANONS, "Invalid Bible canon selected")
  ),
  description: v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.maxLength(200, "Description cannot exceed 200 characters")
    ),
    ""
  ),
  color: v.pipe(
    v.string("Color selection is required"),
    v.trim(),
    v.nonEmpty("Color selection is required")
  ),
  icon: v.pipe(
    v.string("Icon selection is required"),
    v.trim(),
    v.nonEmpty("Icon selection is required")
  ),
});

export type CreateTrackerInput = v.InferOutput<typeof CreateTrackerSchema>;

export const UpdateTrackerSchema = v.object({
  trackerId: v.pipe(
    v.string("Tracker ID is required"),
    v.trim(),
    v.nonEmpty("Tracker ID is required")
  ),
  name: v.pipe(
    v.string("Tracker name is required"),
    v.trim(),
    v.nonEmpty("Tracker name is required"),
    v.minLength(2, "Tracker name must be at least 2 characters"),
    v.maxLength(50, "Tracker name cannot exceed 50 characters")
  ),
  description: v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.maxLength(200, "Description cannot exceed 200 characters")
    ),
    ""
  ),
  color: v.pipe(
    v.string("Color selection is required"),
    v.trim(),
    v.nonEmpty("Color selection is required")
  ),
  icon: v.pipe(
    v.string("Icon selection is required"),
    v.trim(),
    v.nonEmpty("Icon selection is required")
  ),
});

export type UpdateTrackerInput = v.InferOutput<typeof UpdateTrackerSchema>;

export const SwitchTrackerSchema = v.object({
  trackerId: v.pipe(
    v.string("Tracker ID is required"),
    v.trim(),
    v.nonEmpty("Tracker ID is required")
  ),
});

export type SwitchTrackerInput = v.InferOutput<typeof SwitchTrackerSchema>;
