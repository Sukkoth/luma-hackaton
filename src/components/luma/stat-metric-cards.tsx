type StatMetricCardsProps = {
  chaptersRead?: number;
  currentStreak?: number;
  streakFreezesAvailable?: number;
  longestStreak?: number;
};

export function StatMetricCards({
  chaptersRead = 0,
  currentStreak = 0,
  streakFreezesAvailable = 3,
  longestStreak = 0,
}: StatMetricCardsProps) {
  const metrics = [
    {
      title: "Chapters Read",
      badge: chaptersRead > 0 ? "Active" : "New",
      value: chaptersRead.toLocaleString(),
    },
    {
      title: "Current Streak",
      badge: currentStreak > 0 ? "🔥 Streak" : "Day 0",
      value: `${currentStreak}d`,
    },
    {
      title: "Freeze Shields",
      badge: "Shielded",
      value: `${streakFreezesAvailable}`,
    },
    {
      title: "Longest Streak",
      badge: "Record",
      value: `${longestStreak}d`,
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
      {metrics.map((item) => (
        <div
          key={item.title}
          className="glass-panel flex flex-col justify-between rounded-[24px] p-5 transition-colors duration-150 hover:bg-white/75 dark:hover:bg-white/[0.08]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-[#555555] dark:text-[#9CA3AF]">
              {item.title}
            </span>
            <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] font-normal text-[#555555] dark:bg-white/[0.06] dark:text-[#9CA3AF]">
              {item.badge}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[40px] leading-none font-light tracking-tight text-black sm:text-[42px] dark:text-white">
              {item.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
