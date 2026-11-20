"use client";

import {
  Folder as FolderIcon,
  Trash2,
  ArrowRight,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type FolderCardProps = {
  id: string;
  name: string;
  notesCount: number;
  onOpen: () => void;
  onDelete: () => void;
};

export function FolderCard({
  id,
  name,
  notesCount,
  onOpen,
  onDelete,
}: FolderCardProps) {
  return (
    <div
      data-testid={`folder-card-${id}`}
      className="ui-card group relative flex flex-col justify-between p-5 sm:p-6 transition-all duration-150 hover:border-border-strong hover:shadow-xs min-h-[180px]"
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <FolderIcon className="size-5" />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            data-testid={`delete-folder-button-${id}`}
            className="size-8 rounded-lg text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors cursor-pointer"
            title="Delete collection"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        {/* Collection Name & Details */}
        <div className="mt-4 space-y-1">
          <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {notesCount > 0
              ? `${notesCount} study reflection${notesCount === 1 ? "" : "s"} archived in this collection.`
              : "Empty collection ready for notes and theological reflections."}
          </p>
        </div>
      </div>

      {/* Bottom Footer Row */}
      <div className="pt-4 border-t border-border mt-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <FileText className="size-3.5 text-primary" />
          <span>
            {notesCount} note{notesCount === 1 ? "" : "s"}
          </span>
        </span>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onOpen}
          rightIcon={<ArrowRight className="size-3.5" />}
          className="font-semibold text-xs h-8"
        >
          Open
        </Button>
      </div>
    </div>
  );
}
