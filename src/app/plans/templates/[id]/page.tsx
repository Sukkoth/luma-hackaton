import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Sliders } from "lucide-react";

async function PlanTemplateDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/plans"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Plans</span>
      </Link>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase dark:text-blue-400">
          Template Detail
        </span>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Plan Template: {id}
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Detailed blueprint curriculum and customizable multi-step wizard to
          start this plan.
        </p>

        {/* Multi-step wizard placeholder */}
        <div className="mt-8 rounded-lg border border-dashed border-zinc-300 p-6 dark:border-zinc-700">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Sliders className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>Create Plan Wizard</span>
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/60">
              <span className="text-xs font-medium text-zinc-500">Step 1</span>
              <p className="mt-1 font-semibold">Select Tracker</p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/60">
              <span className="text-xs font-medium text-zinc-500">Step 2</span>
              <p className="mt-1 font-semibold">Pacing & Duration</p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/60">
              <span className="text-xs font-medium text-zinc-500">Step 3</span>
              <p className="mt-1 font-semibold">Schedule & Days</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Link
              href={`/plans/instance-demo`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-500"
            >
              Start Plan Instance
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlanTemplateDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl p-8 text-center text-sm text-zinc-500">
          Loading template...
        </div>
      }
    >
      <PlanTemplateDetailContent params={props.params} />
    </Suspense>
  );
}
