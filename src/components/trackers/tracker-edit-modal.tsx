"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  BookOpen,
  Bookmark,
  Sparkles,
  Flame,
  Award,
  Layers,
  Lock,
  Loader2,
} from "lucide-react";
import {
  updateTrackerAction,
  type UserTrackerSummary,
} from "@/actions/trackers";
import type { BibleCanon } from "@/data/bibleData";

type TrackerEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tracker: UserTrackerSummary;
  onTrackerUpdated?: (tracker: UserTrackerSummary) => void;
};

const CANON_NAMES: Record<BibleCanon, { name: string; totalBooks: number }> = {
  protestant: { name: "Standard 66-Book Canon", totalBooks: 66 },
  catholic: { name: "Catholic Canon (73 Books)", totalBooks: 73 },
  eastern_orthodox: { name: "Eastern Orthodox (78 Books)", totalBooks: 78 },
  ethiopian_orthodox: { name: "Ethiopian Orthodox (81 Books)", totalBooks: 81 },
};

const TRACKER_ICONS = [
  { id: "book-open", label: "Open Book", icon: BookOpen },
  { id: "bookmark", label: "Bookmark", icon: Bookmark },
  { id: "sparkles", label: "Sparkles", icon: Sparkles },
  { id: "flame", label: "Flame", icon: Flame },
  { id: "award", label: "Award", icon: Award },
  { id: "layers", label: "Layers", icon: Layers },
] as const;

export function TrackerEditModal({
  isOpen,
  onClose,
  tracker,
  onTrackerUpdated,
}: TrackerEditModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedIcon, setSelectedIcon] = useState<string>(
    tracker.icon || "book-open"
  );

  if (!isOpen) return null;

  const currentCanon =
    CANON_NAMES[tracker.canon as BibleCanon] || CANON_NAMES.protestant;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || "";
    const icon = (formData.get("icon") as string) || selectedIcon;

    formData.set("trackerId", tracker.id);
    if (!formData.get("icon")) formData.set("icon", icon);

    if (!name || name.length < 2) {
      setErrorMessage("Tracker name must be at least 2 characters.");
      return;
    }

    startTransition(async () => {
      const result = await updateTrackerAction({
        formData,
      });

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      onTrackerUpdated?.({
        ...tracker,
        name,
        description,
        icon,
      });
      onClose();
      router.refresh();
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-tracker-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4"
    >
      <div className="ui-card relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto p-5 shadow-2xl sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3.5">
          <div>
            <h3
              id="edit-tracker-dialog-title"
              className="text-[17px] font-semibold tracking-tight text-foreground"
            >
              Edit Reading Tracker
            </h3>
            <p className="text-[12px] text-foreground-secondary">
              Update name and customization for {tracker.name}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close edit dialog"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-surface-elevated text-foreground-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 rounded-[12px] border border-destructive/20 bg-destructive/10 p-2.5 text-[12px] text-destructive">
            {errorMessage}
          </div>
        )}

        {/* Uncontrolled Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Tracker Name */}
          <div>
            <label
              htmlFor="tracker-edit-name"
              className="block text-[12px] font-medium text-foreground"
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
                placeholder="e.g. Personal Reading"
                className="ui-input h-10 w-full text-[13px]"
              />
            </div>
          </div>

          {/* Description (Optional) */}
          <div>
            <label
              htmlFor="tracker-edit-desc"
              className="block text-[12px] font-medium text-foreground"
            >
              Description{" "}
              <span className="text-foreground-dim font-normal">
                (optional)
              </span>
            </label>
            <div className="relative mt-1">
              <input
                id="tracker-edit-desc"
                name="description"
                type="text"
                defaultValue={tracker.description || ""}
                placeholder="e.g. Daily devotional reading rhythm"
                className="ui-input h-10 w-full text-[13px]"
              />
            </div>
          </div>

          {/* Canon Status (Locked / Immutable) */}
          <div className="rounded-[12px] border border-border-subtle bg-surface-elevated p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock className="size-3.5 text-warning" />
                <span className="text-[12px] font-medium text-foreground">
                  Bible Canon (Locked)
                </span>
              </div>
              <span className="ui-pill text-[10px] font-medium">
                {currentCanon.totalBooks} Books
              </span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-foreground">
              {currentCanon.name}
            </p>
            <p className="mt-0.5 text-[10px] text-foreground-dim">
              Canon cannot be changed after creation to protect reading history
              and chapter progress.
            </p>
          </div>

          {/* Style Customization: Icon Picker */}
          <div>
            <label className="block text-[12px] font-medium text-foreground">
              Tracker Icon
            </label>
            <input type="hidden" name="icon" value={selectedIcon} />
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {TRACKER_ICONS.map((i) => {
                const IconComp = i.icon;
                const isSelected = selectedIcon === i.id;
                return (
                  <button
                    key={i.id}
                    type="button"
                    title={i.label}
                    onClick={() => setSelectedIcon(i.id)}
                    className={`flex size-8 items-center justify-center rounded-[10px] border transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                        : "border-border bg-surface-elevated text-foreground-secondary hover:border-border-strong hover:text-foreground"
                    }`}
                  >
                    <IconComp className="size-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-border-subtle pt-3.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="ui-btn-secondary ui-btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="ui-btn-primary ui-btn-sm gap-1.5"
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
