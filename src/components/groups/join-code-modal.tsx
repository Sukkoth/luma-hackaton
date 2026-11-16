"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, KeyRound } from "lucide-react";
import { joinGroupAction } from "@/actions/groups";
import { Button } from "@/components/ui/button";

export type JoinCodeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function JoinCodeModal({ isOpen, onClose }: JoinCodeModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const rawCode = String(formData.get("code") || "").trim();

    // Extract code if user pasted a full URL like https://luma.app/groups/join/luma-grace-8a2f
    let code = rawCode;
    if (code.includes("/groups/join/")) {
      const parts = code.split("/groups/join/");
      code = parts[1]?.split("?")[0]?.trim() || rawCode;
    }

    if (!code || code.length < 3) {
      setError("Please enter a valid invite code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await joinGroupAction({ inviteCode: code });
      if (!res.success || !res.groupId) {
        setError(res.error || "Failed to join group.");
        setIsSubmitting(false);
        return;
      }

      onClose();
      router.push(`/groups/${res.groupId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join group.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-[24px] border border-border bg-surface p-6 shadow-2xl transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-group-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-surface-elevated text-foreground border border-border">
              <KeyRound className="size-5" />
            </div>
            <div>
              <h2
                id="join-group-title"
                className="text-lg font-semibold tracking-tight text-foreground"
              >
                Join with Invite Code
              </h2>
              <p className="text-xs text-foreground-dim">
                Paste an invitation link or private code.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl text-foreground-dim hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="invite-code"
              className="block text-xs font-medium text-foreground mb-1.5"
            >
              Invite Code or Link
            </label>
            <input
              id="invite-code"
              name="code"
              type="text"
              required
              autoFocus
              placeholder="e.g. grace-fellowship-9k21"
              className="w-full rounded-xl border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-foreground font-mono placeholder:text-foreground-dim placeholder:font-sans focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
            >
              Join Fellowship
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
