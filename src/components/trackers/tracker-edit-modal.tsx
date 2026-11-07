"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  BookOpen,
  Bookmark,
  Compass,
  Heart,
  Flame,
  Sun,
  Loader2,
  Lock,
} from "lucide-react";
import {
  updateTrackerAction,
  type UserTrackerSummary,
} from "@/actions/trackers";
import { CANON_OPTIONS } from "@/lib/schemas/onboarding";

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
  tracker: UserTrackerSummary;
  isOpen: boolean;
  onClose: () => void;
};

export function TrackerEditModal({ tracker, isOpen, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedColor, setSelectedColor] = useState<string>(tracker.color);
  const [selectedIcon, setSelectedIcon] = useState<string>(tracker.icon);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentCanon =
    CANON_OPTIONS.find((c) => c.id === tracker.canon) ?? CANON_OPTIONS[0]!;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateTrackerAction({ formData });
      if (result.success) {
        onClose();
        router.refresh();
      } else {
        setErrorMessage(result.error);
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-tracker-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4"
    >
      <div className="glass-panel relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-3xl border border-white/90 bg-white p-5 shadow-2xl backdrop-blur-2xl sm:p-6 dark:border-white/10 dark:bg-[#121215]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/6 pb-3.5 dark:border-white/8">
          <div>
            <h3
              id="edit-tracker-dialog-title"
              className="text-[17px] font-medium tracking-tight text-black dark:text-white"
            >
              Edit Reading Tracker
            </h3>
            <p className="text-[12px] text-[#666666] dark:text-[#9CA3AF]">
              Update name and customization for {tracker.name}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close edit dialog"
            onClick={onClose}
            className="flex size-7.5 items-center justify-center rounded-xl bg-black/5 text-[#555555] transition-colors hover:bg-black/10 hover:text-black dark:bg-white/10 dark:text-[#9CA3AF] dark:hover:bg-white/20 dark:hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 text-[12px] text-red-600 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        {/* Uncontrolled Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input type="hidden" name="trackerId" value={tracker.id} />

          {/* Tracker Name */}
          <div>
            <label
              htmlFor="tracker-edit-name"
              className="block text-[12px] font-medium text-black dark:text-white"
            >
              Tracker Name
            </label>
            <div className="relative mt-1">
              <input
                id="tracker-edit-name"
                name="name"
                type="text"
                required
                defaultValue={tracker.name}
                placeholder="e.g. Ancient Texts or Personal Devotions"
                className="w-full rounded-xl border border-black/10 bg-white/70 px-3.5 py-2 text-[13px] text-black backdrop-blur-md transition-all placeholder:text-[#888888] focus:border-black/30 focus:bg-white focus:outline-hidden dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#777777] dark:focus:border-white/25"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="tracker-edit-desc"
              className="block text-[12px] font-medium text-black dark:text-white"
            >
              Description{" "}
              <span className="text-[#888888] font-normal">(optional)</span>
            </label>
            <div className="relative mt-1">
              <input
                id="tracker-edit-desc"
                name="description"
                type="text"
                defaultValue={tracker.description}
                placeholder="e.g. Daily devotional reading rhythm"
                className="w-full rounded-xl border border-black/10 bg-white/70 px-3.5 py-2 text-[13px] text-black backdrop-blur-md transition-all placeholder:text-[#888888] focus:border-black/30 focus:bg-white focus:outline-hidden dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#777777] dark:focus:border-white/25"
              />
            </div>
          </div>

          {/* Canon Status (Locked / Immutable) */}
          <div className="rounded-2xl border border-black/6 bg-black/3 p-3 dark:border-white/8 dark:bg-white/3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock className="size-3.5 text-amber-500" />
                <span className="text-[12px] font-medium text-black dark:text-white">
                  Bible Canon (Locked)
                </span>
              </div>
              <span className="rounded-md bg-black/6 px-2 py-0.5 text-[10px] font-medium text-black/80 dark:bg-white/10 dark:text-white/90">
                {currentCanon.totalBooks} Books
              </span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-black dark:text-white">
              {currentCanon.name}
            </p>
            <p className="mt-0.5 text-[10px] text-[#777777] dark:text-[#9CA3AF]">
              Canon cannot be changed after creation to protect reading history
              and chapter progress.
            </p>
          </div>

          {/* Style Customization: Color and Icon */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Color Palette */}
            <div>
              <label className="block text-[12px] font-medium text-black dark:text-white">
                Accent Color
              </label>
              <input type="hidden" name="color" value={selectedColor} />
              <div className="mt-1.5 flex items-center gap-2">
                {TRACKER_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    onClick={() => setSelectedColor(c.value)}
                    className={`size-6 rounded-full transition-transform ${
                      selectedColor === c.value
                        ? "ring-2 ring-black/40 ring-offset-2 scale-110 dark:ring-white dark:ring-offset-[#121215]"
                        : "opacity-75 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-[12px] font-medium text-black dark:text-white">
                Tracker Icon
              </label>
              <input type="hidden" name="icon" value={selectedIcon} />
              <div className="mt-1.5 flex items-center gap-1.5">
                {TRACKER_ICONS.map((i) => {
                  const IconComp = i.icon;
                  const isSelected = selectedIcon === i.id;
                  return (
                    <button
                      key={i.id}
                      type="button"
                      title={i.label}
                      onClick={() => setSelectedIcon(i.id)}
                      className={`flex size-7 items-center justify-center rounded-lg border transition-all ${
                        isSelected
                          ? "border-black/30 bg-black/5 text-black dark:border-white/30 dark:bg-white/10 dark:text-white"
                          : "border-black/6 bg-white/40 text-[#777777] hover:text-black dark:border-white/6 dark:bg-white/2 dark:text-[#9CA3AF] dark:hover:text-white"
                      }`}
                    >
                      <IconComp className="size-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-black/6 pt-3.5 dark:border-white/8">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl border border-black/8 px-4 py-2 text-[12px] font-medium text-[#666666] hover:bg-black/5 dark:border-white/10 dark:text-[#9CA3AF] dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-black px-4 py-2 text-[12px] font-medium text-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
