"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Check,
  Plus,
  Pencil,
  Loader2,
  BookOpen,
  Bookmark,
  Compass,
  Heart,
  Flame,
  Sun,
} from "lucide-react";
import {
  switchTrackerAction,
  type UserTrackerSummary,
} from "@/actions/trackers";
import { TrackerCreationModal } from "./tracker-creation-modal";
import { TrackerEditModal } from "./tracker-edit-modal";
import { CANON_OPTIONS } from "@/lib/schemas/onboarding";

type Props = {
  trackers?: ReadonlyArray<UserTrackerSummary>;
  activeTrackerId?: string | null;
};

const ICON_MAP = {
  "book-open": BookOpen,
  bookmark: Bookmark,
  compass: Compass,
  heart: Heart,
  flame: Flame,
  sun: Sun,
} as const;

export function TrackerSwitcher({
  trackers = [],
  activeTrackerId = null,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTracker, setEditingTracker] =
    useState<UserTrackerSummary | null>(null);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!trackers || trackers.length === 0) {
    return null;
  }

  const activeTracker =
    trackers.find((t) => t.id === activeTrackerId) ?? trackers[0]!;

  const ActiveIconComp =
    ICON_MAP[activeTracker.icon as keyof typeof ICON_MAP] ?? BookOpen;

  const activeCanon =
    CANON_OPTIONS.find((c) => c.id === activeTracker.canon) ??
    CANON_OPTIONS[0]!;

  const handleSwitch = (trackerId: string) => {
    if (trackerId === activeTracker.id || isPending) {
      setIsOpen(false);
      return;
    }

    startTransition(async () => {
      const result = await switchTrackerAction({ trackerId });
      if (result.success) {
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <div className="relative inline-block" ref={dropdownRef}>
        {/* Main Switcher Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label={`Current tracker: ${activeTracker.name}. Click to switch.`}
          data-testid="tracker-switcher-button"
          className="flex items-center gap-2 rounded-xl border border-white/60 bg-white/40 px-3 py-1.5 text-[12px] font-medium text-black/85 shadow-2xs backdrop-blur-md transition-all hover:border-white/80 hover:bg-white hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-white/85 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
        >
          {/* Accent dot / icon */}
          <span
            className="size-2 rounded-full ring-1 ring-black/15 dark:ring-white/20"
            style={{ backgroundColor: activeTracker.color }}
          />
          <ActiveIconComp className="size-3.5 opacity-80" />
          <span className="max-w-32 truncate sm:max-w-44 font-semibold">
            {activeTracker.name}
          </span>
          <span className="hidden rounded bg-black/6 px-1.5 py-0.5 text-[10px] text-[#666666] md:inline-block dark:bg-white/10 dark:text-[#A1A1AA]">
            {activeCanon.totalBooks}B
          </span>
          {isPending ? (
            <Loader2 className="size-3 animate-spin text-[#82ADD4]" />
          ) : (
            <ChevronDown
              className={`size-3.5 opacity-60 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            role="menu"
            aria-label="Reading Trackers"
            className="glass-panel absolute left-0 z-50 mt-2 w-72 origin-top-left rounded-2xl border border-white/90 bg-white/95 p-1.5 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-[#141417]/95"
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between border-b border-black/6 px-2.5 py-2 dark:border-white/8">
              <span className="text-[11px] font-medium tracking-wider text-[#888888] uppercase dark:text-[#9CA3AF]">
                Reading Trackers
              </span>
              <span className="text-[10px] text-[#888888] dark:text-[#777777]">
                {trackers.length}{" "}
                {trackers.length === 1 ? "tracker" : "trackers"}
              </span>
            </div>

            {/* Trackers List */}
            <div className="mt-1 space-y-0.5 max-h-60 overflow-y-auto">
              {trackers.map((tracker) => {
                const isActive = tracker.id === activeTracker.id;
                const IconComp =
                  ICON_MAP[tracker.icon as keyof typeof ICON_MAP] ?? BookOpen;
                const canonInfo =
                  CANON_OPTIONS.find((c) => c.id === tracker.canon) ??
                  CANON_OPTIONS[0]!;

                return (
                  <div
                    key={tracker.id}
                    className={`group flex items-center justify-between rounded-xl px-2.5 py-2 transition-colors ${
                      isActive
                        ? "bg-black/5 dark:bg-white/8 font-medium"
                        : "hover:bg-black/3 dark:hover:bg-white/4"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSwitch(tracker.id)}
                      className="flex flex-1 items-center gap-2 text-left"
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: tracker.color }}
                      />
                      <IconComp className="size-3.5 shrink-0 text-[#777777] dark:text-[#9CA3AF]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[12px] text-black dark:text-white">
                            {tracker.name}
                          </span>
                          <span className="text-[9px] text-[#888888] dark:text-[#777777]">
                            ({canonInfo.totalBooks}B)
                          </span>
                        </div>
                        {tracker.description ? (
                          <p className="truncate text-[10px] text-[#777777] dark:text-[#9CA3AF]">
                            {tracker.description}
                          </p>
                        ) : null}
                      </div>
                      {isActive && (
                        <Check className="size-3.5 shrink-0 text-[#82ADD4]" />
                      )}
                    </button>

                    {/* Edit Tracker Button */}
                    <button
                      type="button"
                      aria-label={`Edit ${tracker.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                        setEditingTracker(tracker);
                      }}
                      className="ml-1.5 flex size-6 items-center justify-center rounded-lg text-[#888888] opacity-60 transition-opacity hover:bg-black/6 hover:text-black hover:opacity-100 group-hover:opacity-100 dark:text-[#9CA3AF] dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <Pencil className="size-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Menu Footer: Add Tracker Button */}
            <div className="mt-1 border-t border-black/6 pt-1 dark:border-white/8">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsCreating(true);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-[12px] font-medium text-black transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/8"
              >
                <div className="flex size-5 items-center justify-center rounded-md bg-black/6 dark:bg-white/10">
                  <Plus className="size-3" />
                </div>
                <span>Create New Tracker</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      <TrackerCreationModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
      />

      {/* Edit Modal */}
      {editingTracker && (
        <TrackerEditModal
          tracker={editingTracker}
          isOpen={true}
          onClose={() => setEditingTracker(null)}
        />
      )}
    </>
  );
}
