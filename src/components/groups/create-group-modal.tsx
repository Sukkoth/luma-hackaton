"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Users, Globe, Lock, ShieldCheck } from "lucide-react";
import * as v from "valibot";
import { CreateGroupSchema } from "@/lib/schemas/groups";
import { createGroupAction } from "@/actions/groups";
import { Button } from "@/components/ui/button";

export type CreateGroupModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const avatarUrl = String(formData.get("avatarUrl") || "").trim();
    const requiresApproval = formData.get("requiresApproval") === "on";

    const parsed = v.safeParse(CreateGroupSchema, {
      name,
      description,
      avatarUrl: avatarUrl || undefined,
      isPrivate,
      requiresApproval,
    });

    if (!parsed.success) {
      setError(
        parsed.issues[0]?.message ||
          "Please fill all required fields correctly."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createGroupAction({
        name: parsed.output.name,
        description: parsed.output.description,
        avatarUrl: parsed.output.avatarUrl,
        isPrivate: parsed.output.isPrivate,
        requiresApproval: parsed.output.requiresApproval,
      });

      if (!res.success || !res.groupId) {
        setError(res.error || "Failed to create group.");
        setIsSubmitting(false);
        return;
      }

      onClose();
      router.push(`/groups/${res.groupId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-group-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Users className="size-5" />
            </div>
            <div>
              <h2
                id="create-group-title"
                className="text-base sm:text-lg font-bold tracking-tight text-foreground"
              >
                Create Fellowship
              </h2>
              <p className="text-xs text-muted-foreground">
                Start a reading circle for your church, family, or friends.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive font-medium">
            {error}
          </div>
        )}

        {/* Uncontrolled Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="group-name"
              className="block text-xs font-semibold text-foreground mb-1.5"
            >
              Group Name <span className="text-destructive">*</span>
            </label>
            <input
              id="group-name"
              name="name"
              type="text"
              required
              placeholder="e.g. Grace Fellowship Small Group"
              className="w-full h-10 rounded-xl border border-border bg-background px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="group-desc"
              className="block text-xs font-semibold text-foreground mb-1.5"
            >
              Description (Optional)
            </label>
            <textarea
              id="group-desc"
              name="description"
              rows={3}
              placeholder="What is the focus or rhythm of this group?"
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all resize-none"
            />
          </div>

          <div>
            <label
              htmlFor="group-avatar"
              className="block text-xs font-semibold text-foreground mb-1.5"
            >
              Avatar Image URL (Optional)
            </label>
            <input
              id="group-avatar"
              name="avatarUrl"
              type="url"
              placeholder="https://..."
              className="w-full h-10 rounded-xl border border-border bg-background px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Privacy Selector */}
          <div>
            <span className="block text-xs font-semibold text-foreground mb-1.5">
              Privacy Setting
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isPrivate
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/40 shadow-xs"
                    : "border-border bg-background text-muted-foreground hover:border-border-strong"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 font-semibold text-xs text-foreground">
                  <Lock className="size-3.5 text-primary" />
                  <span>Private</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Requires direct link or invite code to view &amp; join.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  !isPrivate
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/40 shadow-xs"
                    : "border-border bg-background text-muted-foreground hover:border-border-strong"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 font-semibold text-xs text-foreground">
                  <Globe className="size-3.5 text-primary" />
                  <span>Open Public</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Discoverable on public fellowships directory.
                </p>
              </button>
            </div>
          </div>

          {/* Admin Approval Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Require Leader Approval
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  New members must be approved before viewing cohort progress.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              name="requiresApproval"
              id="requiresApproval"
              className="size-4.5 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              isLoading={isSubmitting}
            >
              Create Fellowship
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
