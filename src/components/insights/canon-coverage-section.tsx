export type DivisionProgress = {
  key: string;
  label: string;
  booksLabel: string;
  readChapters: number;
  totalChapters: number;
  percentage: number;
};

type Props = {
  canonName: string;
  divisions: ReadonlyArray<DivisionProgress>;
};

export function CanonCoverageSection({ canonName, divisions }: Props) {
  return (
    <section className="glass-panel rounded-[28px] p-6 sm:p-7">
      <div className="flex flex-col gap-1 border-b border-black/4 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/6">
        <div>
          <h2 className="text-[18px] font-normal tracking-tight text-black dark:text-white">
            Canon Coverage & Reading Velocity
          </h2>
          <p className="text-[13px] text-[#777777] dark:text-[#A1A1AA]">
            Progress broken down by scripture sections for your active tracker.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-black/4 px-2.5 py-0.5 text-[11px] font-normal text-[#555555] dark:bg-white/6 dark:text-[#9CA3AF]">
            {canonName}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {divisions.map((div) => {
          const isComplete =
            div.totalChapters > 0 && div.readChapters >= div.totalChapters;
          const hasStarted = div.readChapters > 0;

          return (
            <div
              key={div.key}
              className="rounded-[20px] border border-black/8 bg-white/75 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md dark:border-white/8 dark:bg-white/4 dark:shadow-none"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-black dark:text-white">
                  {div.label}
                </span>
                <span
                  className={`rounded-sm px-1.5 py-0.5 text-[11px] font-medium ${
                    isComplete
                      ? "bg-[#DDFD2C] text-black"
                      : hasStarted
                        ? "bg-[#82ADD4]/15 text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]"
                        : "bg-black/4 text-[#777777] dark:bg-white/6 dark:text-[#9CA3AF]"
                  }`}
                >
                  {div.percentage}%
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between text-[11px] text-[#777777] dark:text-[#A1A1AA]">
                <span>{div.booksLabel}</span>
                <span className="font-light text-black dark:text-white">
                  {div.readChapters} / {div.totalChapters} ch
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/6">
                <div
                  style={{ width: `${Math.min(100, div.percentage)}%` }}
                  className={`h-full rounded-full transition-all duration-300 ${
                    isComplete
                      ? "bg-[#DDFD2C]"
                      : "bg-linear-to-r from-[#82ADD4] to-[#6894BC]"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
