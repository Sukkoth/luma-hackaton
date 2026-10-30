import { PlanCatalog } from "@/components/plans/PlanCatalog";

export default function PlansPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Bible Plans</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Browse curated reading plans or resume your active plans.
        </p>
      </div>

      <PlanCatalog />
    </div>
  );
}
