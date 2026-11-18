"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowRightLeft, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter to active members who are not the current owner
  const eligibleMembers = members.filter(
    (m) => m.userId !== currentOwnerId && m.status === "active"
  );

  const selectedMember = eligibleMembers.find((m) => m.userId === selectedUserId);

  async function handleTransfer() {
    if (!selectedUserId) return;
    setIsTransferring(true);
    setErrorMessage(null);

    try {
      const res = await transferGroupOwnershipAction({
        groupId,
        newOwnerUserId: selectedUserId,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to transfer fellowship ownership.");
        return;
      }

      onClose();
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to transfer ownership.";
      setErrorMessage(message);
    } finally {
      setIsTransferring(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-ownership-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="rounded-2xl border border-border bg-surface max-w-md w-full p-6 space-y-5 shadow-2xl">
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
            <p className="text-xs text-foreground-secondary mt-0.5">
              Pass primary leadership of &quot;{groupName}&quot;
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <ShieldAlert className="size-4 shrink-0" />
            <span>Important Ownership Notice</span>
          </div>
          <p className="text-xs text-foreground-secondary leading-relaxed">
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
            <select
              id="new-owner-select"
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setErrorMessage(null);
              }}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            >
              <option value="">-- Choose an active member --</option>
              {eligibleMembers.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name} ({m.email}) • Currently {m.role}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedMember && (
          <div className="rounded-xl border border-border/60 bg-surface-elevated/40 p-3 flex items-center justify-between text-xs">
            <span className="text-foreground-secondary">Designated Owner:</span>
            <span className="font-semibold text-foreground">
              {selectedMember.name}
            </span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isTransferring}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={!selectedUserId || isTransferring || eligibleMembers.length === 0}
            isLoading={isTransferring}
            onClick={handleTransfer}
            leftIcon={<Check className="size-4" />}
          >
            Confirm Transfer
          </Button>
        </div>
      </div>
    </div>
  );
}
