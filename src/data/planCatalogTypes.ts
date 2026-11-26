import { BIBLE_BOOK_MAP, type BibleCanon, getBibleBooks } from "./bibleData";
import type {
  PlanCategory,
  PlanFilterType,
  PlanSection,
  ReadingPlanTemplate,
} from "./readingPlans";

export type { PlanCategory, PlanFilterType, PlanSection };

export type PlanCatalogSummary = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: PlanCategory;
  icon: string;
  accentColor: string;
  totalChapters: number;
  defaultDailyTarget: number;
  recommendedDays: number;
  allowCustomPace?: boolean;
  allowSelfPaced?: boolean;
  canonCompatibility?: BibleCanon | null;
  isFeatured?: boolean;
  sections: ReadonlyArray<PlanSection>;
  bookIds: ReadonlyArray<string>;
};

export type PlanFilterOption = {
  id: PlanFilterType;
  label: string;
};

export const PLAN_FILTERS: ReadonlyArray<PlanFilterOption> = [
  { id: "All", label: "All" },
  { id: "Featured", label: "Featured" },
  { id: "Custom", label: "My Custom" },
  { id: "Fixed", label: "Fixed" },
  { id: "Customizable", label: "Customizable" },
  { id: "Old", label: "Old Testament" },
  { id: "New", label: "New Testament" },
  { id: "Gospels", label: "Gospels" },
  { id: "Epistles", label: "Epistles" },
  { id: "Short", label: "Short" },
  { id: "Long", label: "Long" },
  { id: "Whole", label: "Whole Bible" },
];

export const FEATURED_PLANS: ReadonlyArray<string> = [
  "blended_1_year",
  "chronological_1_year",
  "new_testament_90",
];

export type IsPlanFeaturedParams = {
  plan?: { id?: string; title?: string; isFeatured?: boolean } | null;
  planId?: string | null;
  planTitle?: string | null;
};

export function isPlanFeatured({
  plan,
  planId,
  planTitle,
}: IsPlanFeaturedParams): boolean {
  if (plan?.isFeatured) return true;
  const id = plan?.id ?? planId;
  if (id && FEATURED_PLANS.includes(id)) return true;

  const title = (plan?.title ?? planTitle)?.toLowerCase() ?? "";
  if (
    title.includes("1-year blended") ||
    title.includes("1-year chronological") ||
    title.includes("new testament in 90")
  ) {
    return true;
  }

  return false;
}

export type ToPlanCatalogSummaryParams = {
  plan: ReadingPlanTemplate;
};

export function toPlanCatalogSummary({
  plan,
}: ToPlanCatalogSummaryParams): PlanCatalogSummary {
  const uniqueBookIds = Array.from(new Set(plan.readings.map((r) => r.bookId)));
  return {
    id: plan.id,
    title: plan.title,
    subtitle: plan.subtitle,
    description: plan.description,
    category: plan.category,
    icon: plan.icon,
    accentColor: plan.accentColor,
    totalChapters: plan.totalChapters,
    defaultDailyTarget: plan.defaultDailyTarget,
    recommendedDays: plan.recommendedDays,
    allowCustomPace: plan.allowCustomPace,
    allowSelfPaced: plan.allowSelfPaced,
    canonCompatibility: plan.canonCompatibility,
    isFeatured: plan.isFeatured,
    sections: plan.sections,
    bookIds: uniqueBookIds,
  };
}

function getPlanBookIds({
  plan,
}: {
  plan: PlanCatalogSummary | ReadingPlanTemplate;
}): ReadonlyArray<string> {
  if ("bookIds" in plan) {
    return plan.bookIds;
  }
  return plan.readings.map((r) => r.bookId);
}

export function isPlanMatchingFilter({
  plan,
  filter,
}: {
  plan: PlanCatalogSummary | ReadingPlanTemplate;
  filter: PlanFilterType;
}): boolean {
  if (filter === "All") return true;

  if (filter === "Featured") {
    return isPlanFeatured({ plan });
  }

  if (filter === "Custom") {
    return plan.id.startsWith("custom_") || plan.id.startsWith("imported_");
  }

  if (filter === "Fixed") {
    return plan.allowCustomPace === false;
  }

  if (filter === "Customizable") {
    return plan.allowCustomPace !== false;
  }

  const bookIds = getPlanBookIds({ plan });

  if (filter === "Gospels") {
    if (plan.category === "Gospels") return true;
    return (
      bookIds.length > 0 &&
      bookIds.every((bookId) => {
        const b = BIBLE_BOOK_MAP[bookId];
        return b && b.category === "Gospels";
      })
    );
  }

  if (filter === "Epistles") {
    if (plan.category === "Epistles") return true;
    return (
      bookIds.length > 0 &&
      bookIds.every((bookId) => {
        const b = BIBLE_BOOK_MAP[bookId];
        return (
          b &&
          (b.category === "Pauline Epistles" ||
            b.category === "General Epistles")
        );
      })
    );
  }

  if (filter === "Old") {
    if (
      plan.category === "Old Testament" ||
      plan.category === "Wisdom & Poetry" ||
      plan.category === "Whole Bible"
    ) {
      return true;
    }
    return bookIds.some((bookId) => {
      const b = BIBLE_BOOK_MAP[bookId];
      return b && b.testament === "OT";
    });
  }

  if (filter === "New") {
    if (
      plan.category === "New Testament" ||
      plan.category === "Gospels" ||
      plan.category === "Epistles" ||
      plan.category === "Whole Bible"
    ) {
      return true;
    }
    return bookIds.some((bookId) => {
      const b = BIBLE_BOOK_MAP[bookId];
      return b && b.testament === "NT";
    });
  }

  if (filter === "Short") {
    return plan.recommendedDays <= 30;
  }

  if (filter === "Long") {
    return plan.recommendedDays > 30;
  }

  if (filter === "Whole") {
    return plan.category === "Whole Bible" || plan.totalChapters >= 1000;
  }

  return true;
}

export function isPlanCanonCompatible({
  plan,
  trackerCanon,
}: {
  plan: PlanCatalogSummary | ReadingPlanTemplate;
  trackerCanon?: BibleCanon | null;
}): boolean {
  if (!trackerCanon) return true;

  if (plan.canonCompatibility && plan.canonCompatibility !== trackerCanon) {
    return false;
  }

  const canonBooks = getBibleBooks(trackerCanon);
  const canonBookIds = new Set(canonBooks.map((b) => b.id));
  const bookIds = getPlanBookIds({ plan });
  return !bookIds.some((bookId) => !canonBookIds.has(bookId));
}
