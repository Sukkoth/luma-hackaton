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
    <section className="ui-card p-5 sm:p-6">
      <div className="flex flex-col gap-1 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Canon Coverage & Scripture Divisions
          </h2>
          <p className="text-xs text-muted-foreground">
            Progress broken down by traditional theological sections.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
            {canonName}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {divisions.map((div) => {
          const isComplete =
            div.totalChapters > 0 && div.readChapters >= div.totalChapters;

          return (
            <div
              key={div.key}
              className="rounded-xl border border-border/60 bg-muted/40 p-3.5 transition-colors hover:border-border"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  {div.label}
                </span>
                <span
                  className={
                    isComplete
                      ? "rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold px-1.5 py-0.5 text-[11px]"
                      : "text-xs font-semibold text-foreground tabular-nums"
                  }
                >
                  {div.percentage}%
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline justify-between text-[11px] text-muted-foreground">
                <span className="truncate max-w-[170px]">{div.booksLabel}</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {div.readChapters} / {div.totalChapters}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  style={{ width: `${Math.min(100, div.percentage)}%` }}
                  className="h-full rounded-full bg-primary transition-all duration-300"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
