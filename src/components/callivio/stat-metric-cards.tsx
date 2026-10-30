type MetricItem = {
  title: string;
  badge: string;
  value: string;
};

const STAT_METRICS: ReadonlyArray<MetricItem> = [
  {
    title: "Chapters Read",
    badge: "+12%",
    value: "10.8k",
  },
  {
    title: "Avg Reading Time",
    badge: "+23%",
    value: "30m",
  },
  {
    title: "Verses Meditated",
    badge: "+18%",
    value: "10.7k",
  },
  {
    title: "Consistency Rating",
    badge: "+3.7%",
    value: "4.8/5",
  },
];

export function StatMetricCards() {
  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
      {STAT_METRICS.map((item) => (
        <div
          key={item.title}
          className="glass-panel flex flex-col justify-between rounded-[24px] p-5 transition-all hover:bg-white/75"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-[#555555]">
              {item.title}
            </span>
            <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] font-normal text-[#555555]">
              {item.badge}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[40px] leading-none font-light tracking-tight text-black sm:text-[42px]">
              {item.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
