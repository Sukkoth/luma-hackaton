export function CanonCoverageSection() {
  return (
    <section className="glass-panel rounded-[28px] p-6 sm:p-7">
      <div className="flex flex-col gap-1 border-b border-black/[0.04] pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
        <div>
          <h2 className="text-[18px] font-normal tracking-tight text-black dark:text-white">
            Canon Coverage & Reading Velocity
          </h2>
          <p className="text-[13px] text-[#777777] dark:text-[#A1A1AA]">
            Progress broken down by scripture sections for active tracker.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-[6px] bg-black/[0.04] px-2.5 py-0.5 text-[11px] font-normal text-[#555555] dark:bg-white/[0.06] dark:text-[#9CA3AF]">
            Protestant Standard 66
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Law & Pentateuch */}
        <div className="rounded-[20px] border border-black/[0.08] bg-white/75 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-black dark:text-white">
              Law & Pentateuch
            </span>
            <span className="rounded-[4px] bg-[#DDFD2C] px-1.5 py-0.5 text-[11px] font-medium text-black">
              100%
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between text-[11px] text-[#777777] dark:text-[#A1A1AA]">
            <span>Genesis to Deuteronomy</span>
            <span className="font-light text-black dark:text-white">
              187 / 187 ch
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.06]">
            <div
              style={{ width: "100%" }}
              className="h-full rounded-full bg-[#DDFD2C]"
            />
          </div>
        </div>

        {/* The Four Gospels */}
        <div className="rounded-[20px] border border-black/[0.08] bg-white/75 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-black dark:text-white">
              The Four Gospels
            </span>
            <span className="rounded-[4px] bg-[#DDFD2C] px-1.5 py-0.5 text-[11px] font-medium text-black">
              100%
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between text-[11px] text-[#777777] dark:text-[#A1A1AA]">
            <span>Matthew to John</span>
            <span className="font-light text-black dark:text-white">
              89 / 89 ch
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.06]">
            <div
              style={{ width: "100%" }}
              className="h-full rounded-full bg-[#DDFD2C]"
            />
          </div>
        </div>

        {/* Historical Books */}
        <div className="rounded-[20px] border border-black/[0.08] bg-white/75 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-black dark:text-white">
              Historical Books
            </span>
            <span className="rounded-[4px] bg-[#82ADD4]/15 px-1.5 py-0.5 text-[11px] font-medium text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
              50%
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between text-[11px] text-[#777777] dark:text-[#A1A1AA]">
            <span>Joshua to Esther</span>
            <span className="font-light text-black dark:text-white">
              124 / 249 ch
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.06]">
            <div
              style={{ width: "50%" }}
              className="h-full rounded-full bg-gradient-to-r from-[#82ADD4] to-[#6894BC]"
            />
          </div>
        </div>

        {/* Poetry & Wisdom */}
        <div className="rounded-[20px] border border-black/[0.08] bg-white/75 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-black dark:text-white">
              Poetry & Wisdom
            </span>
            <span className="rounded-[4px] bg-[#82ADD4]/15 px-1.5 py-0.5 text-[11px] font-medium text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
              31%
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between text-[11px] text-[#777777] dark:text-[#A1A1AA]">
            <span>Job to Song of Solomon</span>
            <span className="font-light text-black dark:text-white">
              76 / 243 ch
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.06]">
            <div
              style={{ width: "31%" }}
              className="h-full rounded-full bg-gradient-to-r from-[#82ADD4] to-[#6894BC]"
            />
          </div>
        </div>

        {/* Epistles & Letters */}
        <div className="rounded-[20px] border border-black/[0.08] bg-white/75 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-black dark:text-white">
              Epistles & Letters
            </span>
            <span className="rounded-[4px] bg-[#82ADD4]/15 px-1.5 py-0.5 text-[11px] font-medium text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
              44%
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between text-[11px] text-[#777777] dark:text-[#A1A1AA]">
            <span>Romans to Jude</span>
            <span className="font-light text-black dark:text-white">
              54 / 122 ch
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.06]">
            <div
              style={{ width: "44%" }}
              className="h-full rounded-full bg-gradient-to-r from-[#82ADD4] to-[#6894BC]"
            />
          </div>
        </div>

        {/* Prophets & Apocalypse */}
        <div className="rounded-[20px] border border-black/[0.08] bg-white/75 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-black dark:text-white">
              Prophets & Apocalypse
            </span>
            <span className="rounded-[4px] bg-[#82ADD4]/15 px-1.5 py-0.5 text-[11px] font-medium text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
              22%
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between text-[11px] text-[#777777] dark:text-[#A1A1AA]">
            <span>Major/Minor & Revelation</span>
            <span className="font-light text-black dark:text-white">
              68 / 307 ch
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.06]">
            <div
              style={{ width: "22%" }}
              className="h-full rounded-full bg-gradient-to-r from-[#82ADD4] to-[#6894BC]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
