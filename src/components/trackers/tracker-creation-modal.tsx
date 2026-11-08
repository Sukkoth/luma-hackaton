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
  Check,
  Loader2,
} from "lucide-react";
import {
  createTrackerAction,
  type CreateTrackerActionResult,
} from "@/actions/trackers";
import type { BibleCanon } from "@/data/bibleData";

type TrackerCreationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onTrackerCreated?: (result: CreateTrackerActionResult) => void;
};

const CANON_OPTIONS: ReadonlyArray<{
  id: BibleCanon;
  name: string;
  totalBooks: number;
  subtitle: string;
}> = [
  {
    id: "protestant",
    name: "Standard Canon",
    totalBooks: 66,
    subtitle: "Historical 66-book biblical canon (39 OT + 27 NT)",
  },
  {
    id: "catholic",
    name: "Catholic Canon",
    totalBooks: 73,
    subtitle: "Includes Tobit, Judith, Wisdom, Sirach, Baruch, 1-2 Maccabees",
  },
  {
    id: "eastern_orthodox",
    name: "Eastern Orthodox",
    totalBooks: 78,
    subtitle: "Includes 3 Maccabees, 1 Esdras, and Prayer of Manasseh",
  },
  {
    id: "ethiopian_orthodox",
    name: "Ethiopian Orthodox Tewahedo",
    totalBooks: 81,
    subtitle: "Includes Jubilees, 1 Enoch, and 1-3 Meqabyan",
  },
];

const TRACKER_COLORS = [
  { name: "Olive Primary", value: "#DADAD6" },
  { name: "Deep Slate", value: "#1A212D" },
  { name: "Emerald", value: "#10B981" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Sapphire", value: "#3B82F6" },
  { name: "Rose", value: "#EF4444" },
] as const;

const TRACKER_ICONS = [
  { id: "book-open", label: "Open Book", icon: BookOpen },
  { id: "bookmark", label: "Bookmark", icon: Bookmark },
  { id: "sparkles", label: "Sparkles", icon: Sparkles },
  { id: "flame", label: "Flame", icon: Flame },
  { id: "award", label: "Award", icon: Award },
  { id: "layers", label: "Layers", icon: Layers },
] as const;

export function TrackerCreationModal({
  isOpen,
  onClose,
  onTrackerCreated,
}: TrackerCreationModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedCanonId, setSelectedCanonId] =
    useState<BibleCanon>("protestant");
  const [selectedColor, setSelectedColor] = useState<string>(
    TRACKER_COLORS[0].value
  );
  const [selectedIcon, setSelectedIcon] = useState<string>("book-open");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string)?.trim();
    const canon = (formData.get("canon") as BibleCanon) || "protestant";

    if (!formData.get("color")) formData.set("color", selectedColor);
    if (!formData.get("icon")) formData.set("icon", selectedIcon);
    if (!formData.get("canon")) formData.set("canon", canon);

    if (!name || name.length < 2) {
      setErrorMessage("Tracker name must be at least 2 characters.");
      return;
    }

    startTransition(async () => {
      const result = await createTrackerAction({
        formData,
      });

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      onTrackerCreated?.(result);
      onClose();
      router.refresh();
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-tracker-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4"
    >
      <div className="ui-card relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto p-5 shadow-2xl sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3.5">
          <div>
            <h3
              id="create-tracker-dialog-title"
              className="text-[17px] font-semibold tracking-tight text-foreground"
            >
              New Reading Tracker
            </h3>
            <p className="text-[12px] text-foreground-secondary">
              Create an isolated tracker with custom Bible canon and style
            </p>
          </div>

          <button
            type="button"
            aria-label="Close creation dialog"
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
              htmlFor="tracker-create-name"
              className="block text-[12px] font-medium text-foreground"
            >
              Tracker Name
            </label>
            <div className="relative mt-1">
              <input
                id="tracker-create-name"
                name="name"
                type="text"
                required
                placeholder="e.g. Ancient Texts or Personal Devotions"
                className="ui-input h-10 w-full text-[13px]"
              />
            </div>
          </div>

          {/* Description (Optional) */}
          <div>
            <label
              htmlFor="tracker-create-desc"
              className="block text-[12px] font-medium text-foreground"
            >
              Description{" "}
              <span className="text-foreground-dim font-normal">
                (optional)
              </span>
            </label>
            <div className="relative mt-1">
              <input
                id="tracker-create-desc"
                name="description"
                type="text"
                placeholder="e.g. Ethiopian canon historical journey"
                className="ui-input h-10 w-full text-[13px]"
              />
            </div>
          </div>

          {/* Canon Selection */}
          <div>
            <label className="block text-[12px] font-medium text-foreground">
              Bible Canon
            </label>
            <p className="mt-0.5 text-[11px] text-foreground-dim">
              Canon cannot be changed once created to preserve chapter history.
            </p>
            <input type="hidden" name="canon" value={selectedCanonId} />

            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CANON_OPTIONS.map((canon) => {
                const isSelected = canon.id === selectedCanonId;
                return (
                  <button
                    key={canon.id}
                    type="button"
                    onClick={() => setSelectedCanonId(canon.id)}
                    className={`flex flex-col justify-between rounded-[12px] border p-2.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary-muted text-foreground shadow-xs"
                        : "border-border bg-surface-elevated text-foreground-secondary hover:border-border-strong hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-foreground">
                        {canon.name}
                      </span>
                      {isSelected ? (
                        <Check className="size-3.5 text-primary" />
                      ) : (
                        <span className="text-[10px] text-foreground-dim">
                          {canon.totalBooks}B
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[10px] text-foreground-dim">
                      {canon.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Style Customization: Color and Icon */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Color Palette */}
            <div>
              <label className="block text-[12px] font-medium text-foreground">
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
                    className={`size-6 rounded-full transition-transform cursor-pointer ${
                      selectedColor === c.value
                        ? "ring-2 ring-primary ring-offset-2 scale-110"
                        : "opacity-75 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-[12px] font-medium text-foreground">
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
              <span>Create Tracker</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
