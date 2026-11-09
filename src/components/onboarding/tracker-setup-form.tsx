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
            <BookOpen className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-[#888888] dark:text-[#9CA3AF]" />
            <input
              id="tracker-name"
              name="name"
              type="text"
              required
              defaultValue="Personal Reading"
              placeholder="e.g. Personal Reading"
              className="ui-input ui-input-icon-left w-full"
            />
          </div>
        </div>

        {/* Accent Color Palette */}
        <div>
          <label className="block text-[12px] font-bold text-foreground">
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
                  className="flex size-9 items-center justify-center rounded-full shadow-xs transition-all duration-150 peer-checked:scale-105 hover:scale-105 peer-checked:[&>svg]:opacity-100"
                >
                  <Check className="size-4 stroke-3 text-white opacity-0 drop-shadow-xs transition-opacity duration-150" />
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Icon Badge Selection */}
        <div>
          <label className="block text-[12px] font-bold text-foreground">
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
                  <span className="flex h-11 w-full items-center justify-center rounded-xl border border-border bg-surface-elevated text-foreground-secondary shadow-2xs transition-all peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground">
                    <IconComp className="size-4" />
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
            className="ui-btn-primary w-full gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Initializing Tracker...</span>
              </>
            ) : (
              <>
                <span>Complete Onboarding & Begin</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
