import Link from "next/link";
import { Sparkles, Calendar, Bookmark } from "lucide-react";

type Props = {
  totalReadChapters: number;
  totalChaptersAcrossCanon: number;
  canonPercentage: number;
};

export function VerseOfTheDayBanner({
  totalReadChapters,
  totalChaptersAcrossCanon,
  canonPercentage,
}: Props) {
  return (
    <section className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Verse of the Day */}
      <div className="glass-panel flex flex-col justify-between rounded-[26px] p-6 sm:col-span-2">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-[#82ADD4]/20 text-[#6894BC]">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span className="text-[12px] font-medium tracking-wide text-[#555555] dark:text-[#9CA3AF]">
                Verse of the Day
              </span>
            </div>
            <span className="rounded-[4px] bg-[#DDFD2C] px-2 py-0.5 text-[11px] font-medium text-black">
              Daily Light
            </span>
          </div>

          <blockquote className="mt-4 text-[20px] leading-relaxed font-light text-black sm:text-[22px] dark:text-white">
            &ldquo;Your word is a lamp to my feet and a light to my path.&rdquo;
          </blockquote>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-black/[0.04] pt-3 text-[13px] text-[#777777] dark:border-white/[0.08] dark:text-[#9CA3AF]">
          <span className="font-medium text-black dark:text-white">
            Psalm 119:105
          </span>
          <span>English Standard Version</span>
        </div>
      </div>

      {/* Today's Active Plan Reading */}
      <div className="glass-panel flex flex-col justify-between rounded-[26px] p-6">
        <div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[12px] font-medium text-[#555555] dark:text-[#9CA3AF]">
              <Calendar className="h-3.5 w-3.5 text-[#82ADD4]" />
              <span>Today&apos;s Reading</span>
            </span>
            <Link
              href="/plans"
              className="text-[12px] font-medium text-[#6894BC] hover:underline"
            >
              View Plans
            </Link>
          </div>

          <div className="mt-4 rounded-[16px] border border-white/90 bg-white/60 p-4 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#82ADD4] text-white">
                  <Bookmark className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-[14px] font-medium text-black dark:text-white">
                    Romans 8:1–39
                  </h4>
                  <p className="text-[11px] text-[#777777] dark:text-[#9CA3AF]">
                    Bible in a Year • Day 212
                  </p>
                </div>
              </div>
              <span className="rounded-[4px] bg-[#DDFD2C] px-2 py-0.5 text-[11px] font-medium text-black">
                94%
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-black/[0.04] pt-3 text-[12px] text-[#777777] dark:border-white/[0.08] dark:text-[#9CA3AF]">
          <span>Bible Tracker Total</span>
          <span className="font-light text-black dark:text-white">
            {totalReadChapters} / {totalChaptersAcrossCanon} ch (
            {canonPercentage}%)
          </span>
        </div>
      </div>
    </section>
  );
}
