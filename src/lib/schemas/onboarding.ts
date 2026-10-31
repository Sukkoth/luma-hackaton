import * as v from "valibot";

export const CANON_OPTIONS = [
  {
    id: "protestant",
    name: "Standard 66 Books",
    subtitle:
      "Historical Protestant collection (39 Old Testament, 27 New Testament)",
    totalBooks: 66,
  },
  {
    id: "catholic",
    name: "Catholic Canon (73 Books)",
    subtitle: "Includes Tobit, Judith, 1 & 2 Maccabees, Wisdom, Sirach, Baruch",
    totalBooks: 73,
  },
  {
    id: "eastern_orthodox",
    name: "Eastern Orthodox Canon (78 Books)",
    subtitle: "Includes 3 Maccabees, 1 Esdras, Prayer of Manasseh, Psalm 151",
    totalBooks: 78,
  },
  {
    id: "ethiopian_orthodox",
    name: "Ethiopian Orthodox Tewahedo (81 Books)",
    subtitle: "Includes Henok (1 Enoch), Kufale (Jubilees), 1–3 Meqabyan",
    totalBooks: 81,
  },
] as const;

export const OnboardingTrackerSchema = v.object({
  name: v.pipe(
    v.string("Tracker name is required"),
    v.trim(),
    v.nonEmpty("Tracker name is required"),
    v.minLength(2, "Tracker name must be at least 2 characters"),
    v.maxLength(50, "Tracker name cannot exceed 50 characters")
  ),
  canon: v.pipe(
    v.string("Canon selection is required"),
    v.picklist(
      ["protestant", "catholic", "eastern_orthodox", "ethiopian_orthodox"],
      "Invalid canon selection"
    )
  ),
  color: v.pipe(
    v.string("Color selection is required"),
    v.nonEmpty("Color selection is required")
  ),
  icon: v.pipe(
    v.string("Icon selection is required"),
    v.nonEmpty("Icon selection is required")
  ),
});

export type OnboardingTrackerInput = v.InferOutput<
  typeof OnboardingTrackerSchema
>;
