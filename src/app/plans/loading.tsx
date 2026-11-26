export default function PlansLoading() {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-3.5 w-44 rounded-md bg-surface-elevated" />
        <div className="h-9 w-72 rounded-lg bg-surface-elevated" />
        <div className="h-4 w-96 max-w-full rounded-md bg-surface-elevated" />
      </div>
      <div className="h-36 w-full rounded-2xl bg-surface-elevated/70" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="h-52 rounded-2xl bg-surface-elevated/70"
          />
        ))}
      </div>
    </div>
  );
}
