"use client";

import { PLAN_FILTERS, type PlanFilterType } from "@/data/readingPlans";
import { FilterPills, type FilterPillItem } from "@/components/ui/filter-pills";

type Props = {
  selectedFilter: PlanFilterType;
  onSelectFilter: (params: { filter: PlanFilterType }) => void;
};

export function PlanFilterPills({ selectedFilter, onSelectFilter }: Props) {
  const items: ReadonlyArray<FilterPillItem<PlanFilterType>> = PLAN_FILTERS.map((f) => ({
    id: f.id,
    label: f.label,
  }));

  return (
    <FilterPills
      containerTestId="plan-filter-pills"
      className="mt-4"
      items={items}
      activeFilter={selectedFilter}
      onFilterChange={onSelectFilter}
    />
  );
}
