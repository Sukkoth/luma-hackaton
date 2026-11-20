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
} from "lucide-react";
import {
  switchTrackerAction,
  type UserTrackerSummary,
} from "@/actions/trackers";
import { TrackerCreationModal } from "./tracker-creation-modal";
import { TrackerEditModal } from "./tracker-edit-modal";
import { TrackerIcon } from "./tracker-icons";
import { CANON_OPTIONS } from "@/lib/schemas/onboarding";
import { cn } from "@/lib/utils";

type Props = {
  trackers?: ReadonlyArray<UserTrackerSummary>;
  activeTrackerId?: string | null;
  variant?: "default" | "sidebar" | "tenant";
};

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
            className="group flex w-full items-center justify-between gap-2.5 rounded-xl border border-border bg-muted/60 p-2 text-foreground transition-all hover:bg-muted hover:border-border-strong active:scale-[0.98] cursor-pointer text-left focus:outline-none"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card border border-border/80 text-primary shadow-2xs transition-colors group-hover:border-primary/40">
                {isPending ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : (
                  <TrackerIcon icon={activeTracker.icon} className="size-4" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-semibold text-foreground leading-tight">
                  {activeTracker.name}
                </span>
                <span className="truncate text-[11px] text-muted-foreground leading-tight mt-0.5">
                  {activeTracker.canon === "protestant"
                    ? "Protestant (66 books)"
                    : activeTracker.canon === "catholic"
                      ? "Catholic (73 books)"
                      : activeTracker.canon === "eastern_orthodox"
                        ? "Eastern Orthodox (78 books)"
                        : "Ethiopian Orthodox (81 books)"}
                </span>
              </div>
            </div>
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground group-hover:text-foreground">
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
            className="group flex w-full items-center justify-between gap-2.5 rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground transition-all hover:bg-muted hover:border-border-strong active:scale-[0.98] cursor-pointer text-left focus:outline-none"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted border border-border text-primary">
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <TrackerIcon icon={activeTracker.icon} className="size-3.5" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-medium text-foreground">
                  {activeTracker.name}
                </span>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "size-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ml-1 group-hover:text-foreground",
                isOpen && "rotate-180"
              )}
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
            className="group flex items-center justify-between gap-2.5 rounded-xl border border-border/80 bg-card px-2.5 py-1.5 shadow-2xs transition-all hover:border-border hover:bg-muted/70 active:scale-[0.98] cursor-pointer text-left focus:outline-none min-w-[170px] max-w-[240px]"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <TrackerIcon icon={activeTracker.icon} className="size-3.5" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-medium text-muted-foreground leading-none">
                  Tracker
                </span>
                <span className="truncate text-xs font-semibold text-foreground tracking-tight leading-tight mt-0.5">
                  {activeTracker.name}
                </span>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "size-3.5 text-muted-foreground transition-transform duration-200 shrink-0 group-hover:text-foreground",
                isOpen && "rotate-180"
              )}
            />
          </button>
        )}

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            role="menu"
            aria-label="Reading Trackers"
            className={cn(
              "absolute left-0 z-50 mt-2 origin-top-left rounded-2xl border border-border bg-card p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150",
              variant === "tenant"
                ? "w-full"
                : "w-full min-w-[260px] sm:min-w-[280px]"
            )}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between border-b border-border/60 px-2 py-1.5 mb-1">
              <span className="text-xs font-semibold text-foreground">
                Reading Trackers
              </span>
              <span className="text-[11px] text-muted-foreground">
                {trackers.length}{" "}
                {trackers.length === 1 ? "tracker" : "trackers"}
              </span>
            </div>

            {/* Trackers List */}
            <div className="space-y-1 max-h-64 overflow-y-auto overflow-x-hidden">
              {trackers.map((tracker) => {
                const isActive = tracker.id === activeTracker.id;
                const canonInfo =
                  CANON_OPTIONS.find((c) => c.id === tracker.canon) ??
                  CANON_OPTIONS[0]!;

                return (
                  <div
                    key={tracker.id}
                    className={cn(
                      "group flex items-center justify-between rounded-xl p-2 transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleSwitch(tracker.id)}
                      className="flex flex-1 items-center gap-2.5 text-left cursor-pointer min-w-0"
                    >
                      <div
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-lg border",
                          isActive
                            ? "bg-card border-primary/30 text-primary"
                            : "bg-muted border-border text-muted-foreground"
                        )}
                      >
                        <TrackerIcon icon={tracker.icon} className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "truncate text-xs font-semibold",
                              isActive ? "text-primary" : "text-foreground"
                            )}
                          >
                            {tracker.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            ({canonInfo.totalBooks}B)
                          </span>
                        </div>
                        {tracker.description ? (
                          <p className="truncate text-[11px] text-muted-foreground leading-tight mt-0.5">
                            {tracker.description}
                          </p>
                        ) : null}
                      </div>
                      {isActive && (
                        <Check className="size-4 shrink-0 text-primary ml-1" />
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
                      className="ml-1 flex size-6 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted hover:text-foreground cursor-pointer"
                    >
                      <Pencil className="size-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Menu Footer: Add Tracker Button */}
            <div className="mt-1.5 border-t border-border/60 pt-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsCreating(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/10 cursor-pointer"
              >
                <Plus className="size-3.5" />
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
