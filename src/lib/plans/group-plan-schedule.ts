export const GROUP_PLAN_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

export function computeGroupPlanEndDate({
  scheduledStartDate,
  totalChapters,
  dailyChapterTarget,
  activeWeekdaysMask,
}: {
  scheduledStartDate: Date;
  totalChapters: number;
  dailyChapterTarget: number;
  activeWeekdaysMask: string;
}): Date {
  const safeTarget = Math.max(1, dailyChapterTarget);
  const readingDaysNeeded = Math.max(1, Math.ceil(totalChapters / safeTarget));
  const mask =
    activeWeekdaysMask.length === 7 && activeWeekdaysMask.includes("1")
      ? activeWeekdaysMask
      : "1111111";

  const cursor = new Date(scheduledStartDate);
  cursor.setHours(23, 59, 59, 999);

  let counted = 0;
  for (let i = 0; i < 3650; i++) {
    if (mask[cursor.getDay()] === "1") {
      counted++;
      if (counted >= readingDaysNeeded) {
        return cursor;
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return cursor;
}
