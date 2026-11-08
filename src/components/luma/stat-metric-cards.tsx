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
          className="ui-card flex flex-col justify-between p-5 transition-colors duration-150 hover:bg-surface-elevated"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-foreground-secondary">
              {item.title}
            </span>
            <span className="ui-pill font-mono text-[10px]">{item.badge}</span>
          </div>
          <div className="mt-3">
            <span className="font-mono text-[36px] font-light leading-none tracking-tight text-foreground sm:text-[40px]">
              {item.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
