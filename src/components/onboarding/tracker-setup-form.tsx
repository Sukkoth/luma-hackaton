import type React from "react";
import {
  BookOpen,
  Bookmark,
  Compass,
  Heart,
  Flame,
  Sun,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { CanonSelector } from "./canon-selector";

const TRACKER_COLORS = [
  { name: "Gold", value: "#F59E0B" },
  { name: "Sapphire", value: "#3B82F6" },
  { name: "Emerald", value: "#10B981" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Rose", value: "#F43F5E" },
  { name: "Slate", value: "#71717A" },
];

const TRACKER_ICONS = [
  { id: "book-open", label: "Open Book", icon: BookOpen },
  { id: "bookmark", label: "Bookmark", icon: Bookmark },
  { id: "compass", label: "Compass", icon: Compass },
  { id: "heart", label: "Heart", icon: Heart },
  { id: "flame", label: "Flame", icon: Flame },
  { id: "sun", label: "Sun", icon: Sun },
];

type Props = {
  selectedCanonId: string;
  onSelectCanon: (params: { canonId: string }) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export function TrackerSetupForm({
  selectedCanonId,
  onSelectCanon,
  isLoading,
  onSubmit,
}: Props) {
  return (
    <div>
      {/* Canon Selection Section */}
      <CanonSelector
        selectedCanonId={selectedCanonId}
        onSelectCanon={onSelectCanon}
      />

      {/* Uncontrolled Tracker Creation Form */}
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {/* Hidden input carrying over selected canon */}
        <input type="hidden" name="canon" value={selectedCanonId} />

        {/* Tracker Name */}
        <div>
          <label
            htmlFor="tracker-name"
            className="block text-[12px] font-medium text-black dark:text-white"
          >
            Tracker Name
          </label>
          <div className="relative mt-1.5">
            <BookOpen className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-[#888888] dark:text-[#9CA3AF]" />
            <input
              id="tracker-name"
              name="name"
              type="text"
              required
              defaultValue="Personal Reading"
              placeholder="e.g. Personal Reading"
              className="w-full rounded-[14px] border border-black/[0.08] bg-white/70 py-2.5 pr-4 pl-10 text-[13px] text-black backdrop-blur-md transition-all placeholder:text-[#888888] focus:border-black/30 focus:bg-white focus:outline-hidden dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-[#A1A1AA] dark:focus:border-white/20 dark:focus:bg-white/[0.08]"
            />
          </div>
        </div>

        {/* Accent Color Palette */}
        <div>
          <label className="block text-[12px] font-medium text-black dark:text-white">
            Accent Color
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            {TRACKER_COLORS.map((c, idx) => (
              <label
                key={c.name}
                className="group relative flex cursor-pointer items-center justify-center"
              >
                <input
                  type="radio"
                  name="color"
                  value={c.value}
                  defaultChecked={idx === 0}
                  className="peer sr-only"
                />
                <span
                  style={{ backgroundColor: c.value }}
                  className="flex h-9 w-9 items-center justify-center rounded-full shadow-xs transition-all duration-150 hover:scale-105 peer-checked:scale-105 peer-checked:[&>svg]:opacity-100"
                >
                  <Check className="h-4 w-4 stroke-[3] text-white opacity-0 drop-shadow-xs transition-opacity duration-150" />
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Icon Badge Selection */}
        <div>
          <label className="block text-[12px] font-medium text-black dark:text-white">
            Icon Badge
          </label>
          <div className="mt-2 grid grid-cols-6 gap-2">
            {TRACKER_ICONS.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <label
                  key={item.id}
                  className="relative flex cursor-pointer items-center justify-center"
                >
                  <input
                    type="radio"
                    name="icon"
                    value={item.id}
                    defaultChecked={idx === 0}
                    className="peer sr-only"
                  />
                  <span className="flex h-11 w-full items-center justify-center rounded-[12px] border border-black/[0.08] bg-white/70 text-[#666666] shadow-2xs transition-all peer-checked:border-black peer-checked:bg-black peer-checked:text-white dark:border-white/10 dark:bg-white/[0.05] dark:text-[#9CA3AF] dark:peer-checked:border-[#DDFD2C] dark:peer-checked:bg-[#DDFD2C] dark:peer-checked:text-black">
                    <IconComp className="h-4 w-4" />
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-black py-3 text-[13px] font-medium text-white shadow-xs transition-all hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Initializing Tracker...</span>
              </>
            ) : (
              <>
                <span>Complete Onboarding & Begin</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
