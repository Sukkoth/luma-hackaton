import { PLAN_FILTERS, type PlanFilterType } from "@/data/readingPlans";

type Props = {
  selectedFilter: PlanFilterType;
  onSelectFilter: (params: { filter: PlanFilterType }) => void;
};

export function PlanFilterPills({ selectedFilter, onSelectFilter }: Props) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {PLAN_FILTERS.map((f) => {
        const isSelected = selectedFilter === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onSelectFilter({ filter: f.id })}
            className={`rounded-xl px-3.5 py-1.5 text-[12px] backdrop-blur-md transition-all ${
              isSelected
                ? "border border-white/90 bg-white font-medium text-black shadow-xs dark:border-white/15 dark:bg-white/10 dark:text-white"
                : "border border-white/50 bg-white/35 font-normal text-[#555555] hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/6 dark:bg-white/3 dark:text-[#A1A1AA] dark:hover:border-white/15 dark:hover:bg-white/8 dark:hover:text-white"
            }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
