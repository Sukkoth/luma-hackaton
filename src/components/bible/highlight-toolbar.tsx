"use client";

import { Trash2, X } from "lucide-react";
import { HIGHLIGHT_COLORS, type HighlightColor } from "@/lib/schemas/highlights";

const SWATCH_STYLES: Record<
  HighlightColor,
  { label: string; dotClass: string }
> = {
  amber: { label: "Amber highlight", dotClass: "bg-amber-400" },
  green: { label: "Green highlight", dotClass: "bg-emerald-400" },
  blue: { label: "Blue highlight", dotClass: "bg-blue-400" },
  rose: { label: "Rose highlight", dotClass: "bg-rose-400" },
  purple: { label: "Purple highlight", dotClass: "bg-purple-400" },
};

export type HighlightToolbarProps = {
  verseLabel: string;
  activeColor?: HighlightColor;
  isEditing: boolean;
  isBusy: boolean;
  position: { top: number; left: number } | null;
  onSelectColor: (params: { color: HighlightColor }) => void;
  onDelete?: () => void;
  onClose: () => void;
};

export function HighlightToolbar({
  verseLabel,
  activeColor,
  isEditing,
  isBusy,
  position,
  onSelectColor,
  onDelete,
  onClose,
}: HighlightToolbarProps) {
  const style = position
    ? {
        top: `${position.top}px`,
        left: `${position.left}px`,
      }
    : undefined;

  return (
    <div
      role="toolbar"
      aria-label="Passage highlight actions"
      style={style}
      onMouseDown={(e) => e.preventDefault()}
      className={
        position
          ? "fixed z-[60] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 py-1.5 shadow-lg backdrop-blur-md"
          : "fixed bottom-20 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 py-1.5 shadow-lg backdrop-blur-md"
      }
    >
      <span className="mr-1 text-xs font-medium text-foreground-dim">
        {verseLabel}
      </span>

      <div className="flex items-center gap-1.5">
        {HIGHLIGHT_COLORS.map((color) => {
          const swatch = SWATCH_STYLES[color];
          const isSelected = activeColor === color;
          return (
            <button
              key={color}
              type="button"
              disabled={isBusy}
              aria-label={swatch.label}
              aria-pressed={isSelected}
              onClick={() => onSelectColor({ color })}
              className={`h-6 w-6 rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 ${swatch.dotClass} ${
                isSelected ? "ring-2 ring-foreground ring-offset-2 ring-offset-card" : ""
              }`}
            />
          );
        })}
      </div>

      {isEditing && onDelete ? (
        <>
          <div className="mx-1 h-4 w-px bg-border" />
          <button
            type="button"
            disabled={isBusy}
            aria-label="Remove highlight"
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-full text-foreground-dim transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </>
      ) : null}

      <button
        type="button"
        aria-label="Close highlight toolbar"
        onClick={onClose}
        className="flex h-7 w-7 items-center justify-center rounded-full text-foreground-dim transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
