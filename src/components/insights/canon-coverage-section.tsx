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
    <section className="ui-card p-6 sm:p-7">
      <div className="flex flex-col gap-1 border-b border-border-subtle pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[18px] font-normal tracking-tight text-foreground">
            Canon Coverage & Reading Velocity
          </h2>
          <p className="text-[13px] text-foreground-secondary">
            Progress broken down by scripture sections for your active tracker.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="ui-pill text-[11px] font-normal">{canonName}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {divisions.map((div) => {
          const isComplete =
            div.totalChapters > 0 && div.readChapters >= div.totalChapters;

          return (
            <div key={div.key} className="ui-card-elevated p-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-foreground">
                  {div.label}
                </span>
                <span
                  className={
                    isComplete
                      ? "ui-pill-primary text-[10px]"
                      : "ui-pill text-[10px]"
                  }
                >
                  {div.percentage}%
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between text-[11px] text-foreground-dim">
                <span>{div.booksLabel}</span>
                <span className="font-light text-foreground">
                  {div.readChapters} / {div.totalChapters} ch
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
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
