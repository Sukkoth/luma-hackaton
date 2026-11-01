type StatMetricCardsProps = {
  chaptersRead?: number;
  currentStreak?: number;
  streakFreezesAvailable?: number;
  longestStreak?: number;
  isFreezeUnlocked?: boolean;
};

export function StatMetricCards({
  chaptersRead = 0,
  currentStreak = 0,
  streakFreezesAvailable = 0,
  longestStreak = 0,
  isFreezeUnlocked = false,
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
      title: "Longest Streak",
      badge: "Record",
      value: `${longestStreak}d`,
    },
    {
      title: "Freeze Shields",
      badge: isFreezeUnlocked ? "Shielded" : "Locked",
      value: isFreezeUnlocked ? `${streakFreezesAvailable}` : "Locked",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
      {metrics.map((item) => (
        <div
          key={item.title}
          className="glass-panel flex flex-col justify-between rounded-3xl p-5 transition-colors duration-150 hover:bg-white/75 dark:hover:bg-white/8"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-[#555555] dark:text-[#9CA3AF]">
              {item.title}
            </span>
            <span className="rounded-full bg-black/4 px-2 py-0.5 text-[11px] font-normal text-[#555555] dark:bg-white/6 dark:text-[#9CA3AF]">
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
