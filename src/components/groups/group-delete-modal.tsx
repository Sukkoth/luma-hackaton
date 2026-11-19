"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { deleteGroupAction } from "@/actions/groups";

export type GroupDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
};

export function GroupDeleteModal({
  isOpen,
  onClose,
  groupId,
  groupName,
}: GroupDeleteModalProps) {
  const router = useRouter();
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [typedName, setTypedName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleClose() {
    setTypedName("");
    setErrorMessage(null);
    setIsDeleting(false);
    onClose();
  }

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (!isOpen || !isMounted) return null;

  const isMatch =
    typedName.trim().toLowerCase() === groupName.trim().toLowerCase();

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isMatch || isDeleting) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const res = await deleteGroupAction({
        groupId,
        confirmGroupName: typedName.trim(),
      });

      if (res.success) {
        toast.success("Fellowship deleted successfully.");
        handleClose();
        router.push("/groups");
        router.refresh();
      } else {
        const error = res.error || "Failed to delete fellowship.";
        setErrorMessage(error);
        toast.error(error);
        setIsDeleting(false);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete fellowship.";
      setErrorMessage(message);
      toast.error(message);
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-fellowship-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          handleClose();
        }
      }}
    >
      <div className="rounded-2xl border border-destructive/30 bg-card max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20 shrink-0">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h3
              id="delete-fellowship-title"
              className="text-base font-bold text-foreground"
            >
              Delete Fellowship
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 space-y-1.5 text-xs text-muted-foreground leading-relaxed">
          <p>
            You are about to permanently delete{" "}
            <strong className="text-foreground">
              &ldquo;{groupName}&rdquo;
            </strong>
            . All fellowship reading schedules, discussions, and member records
            will be removed for all members.
          </p>
        </div>

        <form onSubmit={handleDelete} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="confirm-delete-input"
              className="block text-xs font-semibold text-foreground"
            >
              To confirm, type{" "}
              <span className="font-bold text-destructive select-all">
                &ldquo;{groupName}&rdquo;
              </span>{" "}
              below:
            </label>
            <Input
              id="confirm-delete-input"
              type="text"
              required
              autoFocus
              autoComplete="off"
              value={typedName}
              onChange={(e) => {
                setTypedName(e.target.value);
                setErrorMessage(null);
              }}
              placeholder={groupName}
              className={
                isMatch
                  ? "border-emerald-500/50 focus-visible:ring-emerald-500"
                  : ""
              }
            />
            {isMatch ? (
              <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-500">
                <CheckCircle2 className="size-3.5" />
                <span>Fellowship name matches</span>
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Please type the fellowship name to enable deletion
              </p>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="md"
              disabled={!isMatch || isDeleting}
              isLoading={isDeleting}
              leftIcon={<Trash2 className="size-4" />}
            >
              Confirm Delete
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
