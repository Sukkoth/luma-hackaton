"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Copy,
  Check,
  QrCode,
  RefreshCw,
  Share2,
  Download,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import QRCode from "qrcode";
import { regenerateInviteCodeAction } from "@/actions/groups";
import { Button } from "@/components/ui/button";

export type GroupInviteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  initialInviteCode: string;
  isAdmin?: boolean;
};

export function GroupInviteModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  initialInviteCode,
  isAdmin = false,
}: GroupInviteModalProps) {
  const router = useRouter();
  const [regeneratedCode, setRegeneratedCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isConfirmingRegenerate, setIsConfirmingRegenerate] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const inviteCode = regeneratedCode || initialInviteCode;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteUrl = `${origin}/groups/join/${inviteCode}`;
  const inviteMessage = `Join our Scripture reading fellowship "${groupName}" on Luma Bible: ${inviteUrl}`;

  // Render QR code to canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current || !inviteUrl) return;

    QRCode.toCanvas(
      canvasRef.current,
      inviteUrl,
      {
        width: 192,
        margin: 1.5,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      },
      (error) => {
        if (error) {
          // Fallback or ignore render errors
        }
      }
    );
  }, [isOpen, inviteUrl]);

  if (!isOpen) return null;

  function handleCopyLink() {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function handleCopyMessage() {
    navigator.clipboard.writeText(inviteMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  }

  function handleDownloadQr() {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `${groupName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-qr.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  async function handleExecuteRegenerate() {
    setIsRegenerating(true);
    setRegenerateError(null);

    try {
      const res = await regenerateInviteCodeAction({ groupId });
      if (res.success && res.newInviteCode) {
        setRegeneratedCode(res.newInviteCode);
        setIsConfirmingRegenerate(false);
        router.refresh();
      } else {
        setRegenerateError(res.error || "Failed to regenerate invite link.");
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to regenerate invite link.";
      setRegenerateError(message);
    } finally {
      setIsRegenerating(false);
    }
  }

  if (!isOpen || !inviteCode) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="ui-card relative w-full max-w-md p-5 sm:p-6 shadow-2xl transition-all border border-border bg-card max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-modal-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <Share2 className="size-5" />
          </div>
          <div>
            <h3
              id="invite-modal-title"
              className="text-base font-bold text-foreground"
            >
              Invite to Fellowship
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {groupName}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* ── QR Code Section (In-Person Scanning & Bulletin Display) ── */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-muted/20">
            <div className="p-3 bg-white rounded-xl shadow-xs border border-border/80">
              <canvas
                ref={canvasRef}
                className="size-44 sm:size-48 rounded-lg block"
              />
            </div>

            <div className="flex items-center justify-between w-full mt-3 px-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <QrCode className="size-3.5 text-primary" />
                <span>Scan with phone to join immediately</span>
              </span>

              <button
                type="button"
                onClick={handleDownloadQr}
                className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <Download className="size-3" />
                <span>Download QR</span>
              </button>
            </div>
          </div>

          {/* ── Random Character Link Field ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Direct Invitation Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-mono text-foreground truncate select-all">
                {inviteUrl}
              </div>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleCopyLink}
                leftIcon={
                  copiedLink ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )
                }
              >
                {copiedLink ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          {/* ── Pre-formatted Message Copy ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground block">
                Shareable Message
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline cursor-pointer"
              >
                {copiedMessage ? (
                  <>
                    <Check className="size-3" />
                    <span>Message Copied</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="size-3 text-muted-foreground" />
                    <span>Copy Message</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-3 rounded-xl border border-border bg-muted/20 text-xs text-muted-foreground leading-relaxed">
              &ldquo;Join our Scripture reading fellowship &ldquo;{groupName}
              &rdquo; on Luma Bible: {inviteUrl}&rdquo;
            </div>
          </div>

          {/* ── Admin Link Regeneration (Cycle Random Code) ── */}
          {isAdmin && (
            <div className="pt-2 border-t border-border/60 space-y-3">
              {isConfirmingRegenerate ? (
                <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="size-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        Regenerate Invitation Link?
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                        The current link and any previously printed or shared QR
                        codes will stop working immediately.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsConfirmingRegenerate(false)}
                      disabled={isRegenerating}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleExecuteRegenerate}
                      isLoading={isRegenerating}
                    >
                      Confirm &amp; Regenerate
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    <span>Need to revoke old links?</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsConfirmingRegenerate(true)}
                    leftIcon={
                      <RefreshCw className="size-3 text-muted-foreground" />
                    }
                    className="text-xs"
                  >
                    Regenerate Code
                  </Button>
                </div>
              )}
            </div>
          )}

          {regenerateError && (
            <div className="rounded-xl border border-border bg-muted/30 p-2.5 text-xs text-foreground">
              {regenerateError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
