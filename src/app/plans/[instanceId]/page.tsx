import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  FileText,
  CheckCircle2,
  Bookmark,
} from "lucide-react";
import { TopNavbar } from "@/components/callivio/top-navbar";

type PlanInstanceContentParams = {
  params: Promise<{ instanceId: string }>;
};

async function PlanInstanceContent({ params }: PlanInstanceContentParams) {
  const { instanceId } = await params;

  return (
    <div className="mx-auto min-h-screen max-w-[1400px] px-4 py-3 sm:px-6 md:px-8 md:py-4">
      {/* Top Navbar */}
      <TopNavbar userName="James" />

      <main className="mt-4 space-y-4">
        {/* Back navigation */}
        <div>
          <Link
            href="/plans"
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-white/60 bg-white/40 px-3.5 py-1.5 text-[12px] font-normal text-black/75 shadow-2xs backdrop-blur-md transition-all hover:border-white/90 hover:bg-white hover:text-black"
          >
            <ArrowLeft className="h-3.5 w-3.5 stroke-[1.75]" />
            <span>Back to Plans</span>
          </Link>
        </div>

        {/* Plan Header Card */}
        <div className="glass-panel rounded-[28px] p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-[6px] bg-[#DDFD2C] px-2 py-0.5 text-[11px] font-medium text-black">
                  Active Plan Instance
                </span>
                <span className="text-[12px] text-[#777777]">
                  Tracker: Standard 66
                </span>
              </div>
              <h1 className="mt-2 text-[26px] font-normal tracking-tight text-black sm:text-[30px]">
                Plan Progress: {instanceId.replace(/-/g, " ")}
              </h1>
            </div>

            <div className="flex items-center gap-2 rounded-[12px] border border-white/80 bg-white/70 px-3.5 py-1.5 text-[12px] font-medium text-black shadow-2xs">
              <Clock className="h-3.5 w-3.5 text-[#82ADD4]" />
              <span>Pace: On Track (Day 1 of 30)</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6 border-t border-black/[0.04] pt-5">
            <div className="flex justify-between text-[12px] text-[#777777]">
              <span>Completion Rate</span>
              <strong className="font-medium text-black">25%</strong>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05]">
              <div
                style={{ width: "25%" }}
                className="h-full rounded-full bg-gradient-to-r from-[#82ADD4] to-[#DDFD2C]"
              />
            </div>
          </div>
        </div>

        {/* Section Reading Items Checklist & Notes */}
        <div className="glass-panel rounded-[28px] p-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-black/[0.04] pb-4">
            <div>
              <h2 className="text-[18px] font-normal tracking-tight text-black">
                Today&apos;s Reading Checklist
              </h2>
              <p className="mt-0.5 text-[12px] text-[#777777]">
                Check off assignments as you read to log chapters in your Bible
                Tracker.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-[18px] border border-black/[0.08] bg-white/75 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md transition-all hover:bg-white">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#82ADD4]/15 text-[#507ea6]">
                  <Bookmark className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-black">
                    Hebrews 1–2
                  </h3>
                  <p className="text-[12px] text-[#777777]">
                    Day 1 • Jesus Superior to Angels
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/notes"
                  className="flex items-center gap-1 rounded-[12px] border border-white/60 bg-white/40 px-3.5 py-1.5 text-[12px] text-[#555555] transition-all hover:bg-white hover:text-black"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Notes</span>
                </Link>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-[12px] bg-black px-3.5 py-1.5 text-[12px] font-medium text-white shadow-xs transition-colors hover:bg-black/85"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Mark Read</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-[18px] border border-black/[0.08] bg-white/75 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md transition-all hover:bg-white">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#82ADD4]/15 text-[#507ea6]">
                  <Bookmark className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-black">
                    Hebrews 3–4
                  </h3>
                  <p className="text-[12px] text-[#777777]">
                    Day 2 • Rest for the People of God
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/notes"
                  className="flex items-center gap-1 rounded-[12px] border border-white/60 bg-white/40 px-3.5 py-1.5 text-[12px] text-[#555555] transition-all hover:bg-white hover:text-black"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Notes</span>
                </Link>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-[12px] border border-white/90 bg-white px-3.5 py-1.5 text-[12px] font-medium text-black shadow-xs transition-all hover:bg-black hover:text-white"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Mark Read</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

type PlanInstancePageProps = {
  params: Promise<{ instanceId: string }>;
};

export default function PlanInstancePage({ params }: PlanInstancePageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1400px] p-8 text-center text-[13px] text-[#777777]">
          Loading plan instance...
        </div>
      }
    >
      <PlanInstanceContent params={params} />
    </Suspense>
  );
}
