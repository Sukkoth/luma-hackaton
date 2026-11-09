import { Award, Sparkles } from "lucide-react";

export function MilestonesSection() {
  return (
    <section className="ui-card p-6 sm:p-7">
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div>
          <h2 className="text-[18px] font-normal tracking-tight text-foreground">
            Reading Milestones & Badges
          </h2>
          <p className="text-[13px] text-foreground-secondary">
            Achievements unlocked through consistent Bible reading.
          </p>
        </div>
        <span className="ui-pill text-[11px] font-medium gap-1">
          <Sparkles className="size-3 text-foreground" />
          <span>Coming Soon</span>
        </span>
      </div>

      <div className="mt-6 flex flex-col items-center justify-center rounded-[22px] border border-dashed border-border bg-surface-elevated py-14 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-surface text-foreground shadow-2xs">
          <Award className="size-7" strokeWidth={1.75} />
        </div>
        <h3 className="mt-4 text-[17px] font-medium text-foreground">
          Achievements & Badges Arriving Soon
        </h3>
        <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-foreground-secondary">
          Milestone tracking, canon achievement badges, and reading streak
          accolades will be dynamically awarded as you complete books and
          chapters.
        </p>
      </div>
    </section>
  );
}
