"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ArrowRightLeft,
  Check,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import type { GroupMemberSummary } from "@/actions/groups";
import { transferGroupOwnershipAction } from "@/actions/groups";

export type GroupTransferOwnershipModalProps = {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  members: ReadonlyArray<GroupMemberSummary>;
  currentOwnerId: string;
};

export function GroupTransferOwnershipModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  members,
  currentOwnerId,
}: GroupTransferOwnershipModalProps) {
  const router = useRouter();
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [typedName, setTypedName] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleClose() {
    setSelectedUserId("");
    setTypedName("");
    setErrorMessage(null);
    setIsTransferring(false);
    onClose();
  }

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isTransferring) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (!isOpen || !isMounted) return null;

  // Filter to active members who are not the current owner
  const eligibleMembers = members.filter(
    (m) => m.userId !== currentOwnerId && m.status === "active"
  );

  const selectedMember = eligibleMembers.find(
    (m) => m.userId === selectedUserId
  );

  const isMatch =
    typedName.trim().toLowerCase() === groupName.trim().toLowerCase();

  async function handleTransfer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedUserId || !isMatch || isTransferring) return;

    setIsTransferring(true);
    setErrorMessage(null);

    try {
      const res = await transferGroupOwnershipAction({
        groupId,
        newOwnerUserId: selectedUserId,
        confirmGroupName: typedName.trim(),
      });

      if (!res.success) {
        const err = res.error || "Failed to transfer fellowship ownership.";
        setErrorMessage(err);
        toast.error(err);
        setIsTransferring(false);
        return;
      }

      toast.success("Fellowship ownership transferred successfully.");
      handleClose();
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to transfer ownership.";
      setErrorMessage(message);
      toast.error(message);
      setIsTransferring(false);
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-ownership-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isTransferring) {
          handleClose();
        }
      }}
    >
      <div className="rounded-2xl border border-amber-500/30 bg-card max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
            <ArrowRightLeft className="size-5" />
          </div>
          <div>
            <h3
              id="transfer-ownership-title"
              className="text-base font-bold text-foreground"
            >
              Transfer Fellowship Ownership
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pass primary leadership of &ldquo;{groupName}&rdquo;
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-500">
            <ShieldAlert className="size-4 shrink-0" />
            <span>Important Ownership Notice</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The new owner will have full control, including deleting this
            fellowship, managing all administrators, and scheduling plans. You
            will remain in the fellowship as an <strong>Administrator</strong>.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="new-owner-select"
              className="block text-xs font-semibold text-foreground"
            >
              Select New Owner
            </label>
            {eligibleMembers.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                No other active members available to transfer ownership to.
              </p>
            ) : (
              <Select
                value={selectedUserId}
                onValueChange={(val) => {
                  setSelectedUserId(val);
                  setErrorMessage(null);
                }}
              >
                <SelectTrigger
                  id="new-owner-select"
                  className="w-full h-10 text-xs sm:text-sm"
                >
                  <SelectValue placeholder="-- Choose an active member --" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleMembers.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.name} ({m.email}) • Currently {m.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedMember && (
            <>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Designated Owner:</span>
                <span className="font-semibold text-foreground">
                  {selectedMember.name}
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <label
                  htmlFor="confirm-transfer-group-name"
                  className="block text-xs font-semibold text-foreground"
                >
                  To confirm, type{" "}
                  <span className="font-bold text-amber-500 select-all">
                    &ldquo;{groupName}&rdquo;
                  </span>{" "}
                  below:
                </label>
                <Input
                  id="confirm-transfer-group-name"
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
                    Please type the fellowship name to enable transfer
                  </p>
                )}
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleClose}
              disabled={isTransferring}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={
                !selectedUserId ||
                !isMatch ||
                isTransferring ||
                eligibleMembers.length === 0
              }
              isLoading={isTransferring}
              leftIcon={<Check className="size-4" />}
            >
              Confirm Transfer
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
