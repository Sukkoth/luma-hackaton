import { PLAN_FILTERS, type PlanFilterType } from "@/data/readingPlans";

type Props = {
  selectedFilter: PlanFilterType;
  onSelectFilter: (params: { filter: PlanFilterType }) => void;
};

export function PlanFilterPills({ selectedFilter, onSelectFilter }: Props) {
  return (
    <div
      data-testid="plan-filter-pills"
      className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none md:flex-wrap"
    >
      {PLAN_FILTERS.map((f) => {
        const isSelected = selectedFilter === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onSelectFilter({ filter: f.id })}
            className={`shrink-0 rounded-[12px] px-3.5 py-1.5 text-[12px] font-bold transition-all cursor-pointer ${
              isSelected
                ? "border border-primary bg-primary text-primary-foreground shadow-xs"
                : "border border-border bg-surface-elevated text-foreground-secondary hover:border-border-strong hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
