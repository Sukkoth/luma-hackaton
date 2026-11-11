"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronsUpDown,
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
  variant?: "default" | "sidebar" | "tenant";
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
  variant = "default",
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
      <div className="relative inline-block w-full" ref={dropdownRef}>
        {/* Main Switcher Button */}
        {variant === "tenant" ? (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-label={`Current tracker: ${activeTracker.name}. Click to switch.`}
            data-testid="tracker-switcher-tenant-button"
            className="group flex w-full items-center justify-between gap-2.5 rounded-[16px] border border-border bg-surface-elevated/70 p-2 text-foreground transition-all hover:bg-surface-elevated hover:border-border-strong active:scale-[0.98] cursor-pointer text-left focus:outline-hidden"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="flex size-8.5 shrink-0 items-center justify-center rounded-[11px] bg-surface border border-border text-foreground shadow-2xs transition-colors group-hover:border-border-strong">
                {isPending ? (
                  <Loader2 className="size-4 animate-spin text-foreground" />
                ) : (
                  <ActiveIconComp className="size-4" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-[13px] font-semibold text-foreground leading-tight">
                  {activeTracker.name}
                </span>
                <span className="truncate text-[10.5px] font-medium text-foreground-dim leading-tight mt-0.5">
                  {activeTracker.canon === "protestant"
                    ? "Standard 66 Books"
                    : activeTracker.canon === "catholic"
                      ? "Catholic Canon"
                      : activeTracker.canon === "eastern_orthodox"
                        ? "Eastern Orthodox"
                        : "Ethiopian Orthodox"}
                </span>
              </div>
            </div>
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md text-foreground-dim group-hover:text-foreground">
              <ChevronsUpDown className="size-3.5" />
            </div>
          </button>
        ) : variant === "sidebar" ? (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-label={`Current tracker: ${activeTracker.name}. Click to switch.`}
            data-testid="tracker-switcher-sidebar-button"
            className="group flex w-full items-center justify-between gap-2.5 rounded-[14px] border border-border bg-surface px-3 py-2 text-[13px] text-foreground transition-all hover:bg-surface-elevated hover:border-border-strong active:scale-[0.98] cursor-pointer text-left focus:outline-hidden"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-[10px] bg-surface-elevated border border-border text-foreground">
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ActiveIconComp className="size-3.5" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-[13px] font-medium text-foreground">
                  {activeTracker.name}
                </span>
              </div>
            </div>
            <ChevronDown
              className={`size-3.5 text-foreground-dim transition-transform duration-200 shrink-0 ml-1 group-hover:text-foreground ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-label={`Current tracker: ${activeTracker.name}. Click to switch.`}
            data-testid="tracker-switcher-button"
            className="group flex w-full items-center justify-between gap-3 rounded-[18px] lg:rounded-[20px] border border-border bg-surface px-3 py-1.5 lg:px-4 lg:py-2 min-w-[210px] sm:min-w-[230px] shadow-xs transition-all hover:border-border-strong hover:bg-surface-elevated/70 active:scale-[0.98] cursor-pointer text-left focus:outline-hidden"
          >
            <div className="flex items-center gap-2.5 lg:gap-3 min-w-0 flex-1">
              <div className="flex size-9 lg:size-10 shrink-0 items-center justify-center rounded-[12px] lg:rounded-[14px] bg-surface-elevated border border-border text-foreground transition-all">
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ActiveIconComp className="size-4 lg:size-4.5" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] lg:text-[10.5px] font-bold tracking-[0.05em] text-foreground-dim uppercase">
                  ACTIVE TRACKER
                </span>
                <span className="truncate text-[14px] lg:text-[14.5px] font-semibold text-foreground tracking-tight">
                  {activeTracker.name}
                </span>
              </div>
            </div>
            <ChevronDown
              className={`size-3.5 lg:size-4 text-foreground-dim transition-transform duration-200 shrink-0 ml-1.5 group-hover:text-foreground ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        )}

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            role="menu"
            aria-label="Reading Trackers"
            className={`absolute left-0 z-50 mt-2 origin-top-left rounded-[18px] border border-border bg-surface p-2.5 shadow-2xl ${
              variant === "tenant"
                ? "w-full"
                : "w-full min-w-[260px] sm:min-w-[280px]"
            }`}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between border-b border-border-subtle px-1 pb-2 mb-1.5">
              <span className="text-[11px] font-medium tracking-wider text-foreground-dim uppercase">
                Reading Trackers
              </span>
              <span className="text-[10.5px] text-foreground-dim">
                {trackers.length}{" "}
                {trackers.length === 1 ? "tracker" : "trackers"}
              </span>
            </div>

            {/* Trackers List */}
            <div className="space-y-1 max-h-64 overflow-y-auto overflow-x-hidden">
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
                    className={`group flex items-center justify-between rounded-[12px] p-2 transition-colors ${
                      isActive
                        ? "bg-surface-elevated font-medium text-foreground"
                        : "text-foreground-secondary hover:bg-surface-elevated hover:text-foreground"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSwitch(tracker.id)}
                      className="flex flex-1 items-center gap-2.5 text-left cursor-pointer min-w-0"
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-[10px] bg-surface border border-border text-foreground">
                        <IconComp className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[13px] font-medium text-foreground">
                            {tracker.name}
                          </span>
                          <span className="text-[10px] text-foreground-dim shrink-0">
                            ({canonInfo.totalBooks}B)
                          </span>
                        </div>
                        {tracker.description ? (
                          <p className="truncate text-[11px] text-foreground-dim leading-tight mt-0.5">
                            {tracker.description}
                          </p>
                        ) : null}
                      </div>
                      {isActive && (
                        <Check className="size-4 shrink-0 text-foreground ml-1" />
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
                      className="ml-1 flex size-6 shrink-0 items-center justify-center rounded-md text-foreground-dim opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface hover:text-foreground cursor-pointer"
                    >
                      <Pencil className="size-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Menu Footer: Add Tracker Button */}
            <div className="mt-1.5 border-t border-border-subtle pt-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsCreating(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-[12px] py-1.5 text-[12.5px] font-medium text-foreground transition-all hover:bg-surface-elevated cursor-pointer"
              >
                <Plus className="size-3.5 text-foreground-dim" />
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
