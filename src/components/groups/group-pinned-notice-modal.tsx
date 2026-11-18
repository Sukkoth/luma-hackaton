"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Pin, Clock, Trash2, Calendar, AlertCircle } from "lucide-react";
import * as v from "valibot";
import { SetGroupPinnedNoticeSchema } from "@/lib/schemas/groups";
import {
  setGroupPinnedNoticeAction,
  clearGroupPinnedNoticeAction,
  type GroupPinnedNotice,
} from "@/actions/groups";
import { Button } from "@/components/ui/button";

export type GroupPinnedNoticeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  initialNotice?: GroupPinnedNotice | null;
  onNoticeUpdated?: () => void;
};

type DurationOption = "24h" | "3d" | "7d" | "14d" | "custom";

export function GroupPinnedNoticeModal({
  isOpen,
  onClose,
  groupId,
  initialNotice,
  onNoticeUpdated,
}: GroupPinnedNoticeModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>("3d");
  const [minDateTime] = useState(() =>
    new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)
  );

  if (!isOpen) return null;

  function calculateExpirationDate(option: DurationOption, customValue?: string): Date {
    const now = new Date();
    if (option === "24h") {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
    if (option === "3d") {
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    }
    if (option === "7d") {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    if (option === "14d") {
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    }
    if (customValue) {
      const parsed = new Date(customValue);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = String(formData.get("title") || "").trim();
    const content = String(formData.get("content") || "").trim();
    const customExpiresAt = String(formData.get("customExpiresAt") || "").trim();

    const expDate = calculateExpirationDate(selectedDuration, customExpiresAt);

    if (expDate.getTime() <= Date.now()) {
      setError("Expiration time must be set in the future.");
      return;
    }

    const parsed = v.safeParse(SetGroupPinnedNoticeSchema, {
      groupId,
      title: title || undefined,
      content,
      expiresAt: expDate.toISOString(),
    });

    if (!parsed.success) {
      setError(parsed.issues[0]?.message || "Please check your inputs.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await setGroupPinnedNoticeAction({
        groupId,
        title: parsed.output.title,
        content: parsed.output.content,
        expiresAt: parsed.output.expiresAt,
      });

      if (!res.success) {
        setError(res.error || "Failed to update notice.");
        setIsSubmitting(false);
        return;
      }

      onNoticeUpdated?.();
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update notice.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleClearNotice() {
    setIsDeleting(true);
    try {
      const res = await clearGroupPinnedNoticeAction({ groupId });
      if (!res.success) {
        setError(res.error || "Failed to remove notice.");
        setIsDeleting(false);
        return;
      }
      onNoticeUpdated?.();
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove notice.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl transition-all max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Pin className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {initialNotice ? "Edit Pinned Bulletin" : "Pin Bulletin Announcement"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Visible to all members until the automatic expiration time.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2.5 text-xs text-destructive font-medium">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label
              htmlFor="notice-title"
              className="text-xs font-semibold text-foreground flex items-center justify-between"
            >
              <span>Title (Optional)</span>
              <span className="text-xs text-muted-foreground">e.g. Next Meetup, Prayer Request</span>
            </label>
            <input
              id="notice-title"
              name="title"
              type="text"
              maxLength={150}
              defaultValue={initialNotice?.title || ""}
              placeholder="e.g. Thursday Fellowship Discussion & Meeting Link"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label
              htmlFor="notice-content"
              className="text-xs font-semibold text-foreground flex items-center justify-between"
            >
              <span>Announcement Message *</span>
              <span className="text-xs text-muted-foreground">Up to 2,000 chars</span>
            </label>
            <textarea
              id="notice-content"
              name="content"
              required
              rows={4}
              maxLength={2000}
              defaultValue={initialNotice?.content || ""}
              placeholder="Write your announcement or notes here. Include details, Zoom or Google Meet links, reading goals, or prayer points..."
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all resize-none"
            />
          </div>

          {/* Expiration Duration Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="size-3.5 text-primary" />
              <span>Automatic Expiration</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {(
                [
                  { id: "24h", label: "24h" },
                  { id: "3d", label: "3 Days" },
                  { id: "7d", label: "7 Days" },
                  { id: "14d", label: "14 Days" },
                  { id: "custom", label: "Custom" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedDuration(opt.id)}
                  className={`py-1.5 px-1 sm:px-2 text-xs font-medium rounded-lg border transition-all cursor-pointer whitespace-nowrap text-center ${
                    selectedDuration === opt.id
                      ? "border-primary bg-primary text-primary-foreground shadow-2xs font-semibold"
                      : "border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {selectedDuration === "custom" && (
              <div className="pt-2 animate-in fade-in duration-100">
                <label
                  htmlFor="custom-expires-at"
                  className="text-xs text-muted-foreground flex items-center gap-1 mb-1 font-medium"
                >
                  <Calendar className="size-3" />
                  <span>Select custom expiration date &amp; time</span>
                </label>
                <input
                  id="custom-expires-at"
                  name="customExpiresAt"
                  type="datetime-local"
                  required={selectedDuration === "custom"}
                  min={minDateTime}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              The announcement is automatically removed once the expiration timestamp passes.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between border-t border-border/60 pt-4 gap-2.5">
            {initialNotice ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting || isDeleting}
                onClick={handleClearNotice}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 w-full sm:w-auto justify-center"
                leftIcon={<Trash2 className="size-3.5" />}
              >
                {isDeleting ? "Unpinning..." : "Unpin Notice"}
              </Button>
            ) : (
              <div />
            )}

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting || isDeleting}
                onClick={onClose}
                className="w-full sm:w-auto justify-center"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={isSubmitting || isDeleting}
                leftIcon={<Pin className="size-3.5" />}
                className="w-full sm:w-auto justify-center font-semibold"
              >
                {isSubmitting
                  ? "Saving..."
                  : initialNotice
                  ? "Update Notice"
                  : "Post Bulletin"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
