"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import * as v from "valibot";
import {
  BookOpen,
  ExternalLink,
  Loader2,
  StickyNote,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  createNoteAction,
  deleteNoteAction,
  updateNoteAction,
  type NoteDetail,
} from "@/actions/notes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type PassageNoteAnchor = {
  versionId: number;
  versionAbbr: string;
  bookId: string;
  bookName: string;
  chapter: number;
  startVerse: number;
  startOffset: number;
  endVerse: number;
  endOffset: number;
  selectedText: string;
};

export type PassageNoteSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchor: PassageNoteAnchor | null;
  existingNote: NoteDetail | null;
  planInstanceId?: string | null;
  planDayNumber?: number | null;
  onNoteSaved: (params: { note: NoteDetail; isNew: boolean }) => void;
  onNoteDeleted: (params: { noteId: string }) => void;
};

const PassageNoteFormSchema = v.object({
  title: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Please enter a title"),
    v.maxLength(200, "Title cannot exceed 200 characters")
  ),
  body: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Please write a note before saving"),
    v.maxLength(20000, "Note is too long")
  ),
});

function formatVerseRef({
  bookName,
  chapter,
  startVerse,
  endVerse,
}: {
  bookName: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
}): string {
  const versePart =
    startVerse === endVerse ? `${startVerse}` : `${startVerse}–${endVerse}`;
  return `${bookName} ${chapter}:${versePart}`;
}

function escapeHtml({ text }: { text: string }): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function plainTextToHtml({ text }: { text: string }): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => escapeHtml({ text: line }))
        .join("<br />");
      return `<p>${lines}</p>`;
    });

  return paragraphs.length > 0 ? paragraphs.join("") : "<p></p>";
}

function htmlToPlainText({ html }: { html: string }): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .trim();
}

export function PassageNoteSheet({
  open,
  onOpenChange,
  anchor,
  existingNote,
  planInstanceId,
  planDayNumber,
  onNoteSaved,
  onNoteDeleted,
}: PassageNoteSheetProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const verseRef = anchor
    ? formatVerseRef({
        bookName: anchor.bookName,
        chapter: anchor.chapter,
        startVerse: anchor.startVerse,
        endVerse: anchor.endVerse,
      })
    : existingNote?.bookId && existingNote.chapter && existingNote.startVerse
      ? formatVerseRef({
          bookName: existingNote.bookId.toUpperCase(),
          chapter: existingNote.chapter,
          startVerse: existingNote.startVerse,
          endVerse: existingNote.endVerse ?? existingNote.startVerse,
        })
      : "Scripture Note";

  const quotedText = anchor?.selectedText ?? existingNote?.selectedText ?? "";

  const formKey = existingNote
    ? `edit-${existingNote.id}-${existingNote.updatedAt}`
    : anchor
      ? `new-${anchor.bookId}-${anchor.chapter}-${anchor.startVerse}-${anchor.startOffset}-${anchor.endOffset}`
      : "empty";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving || isDeleting) return;

    const formData = new FormData(e.currentTarget);
    const rawTitle = formData.get("title");
    const rawBody = formData.get("body");

    const parsed = v.safeParse(PassageNoteFormSchema, {
      title: typeof rawTitle === "string" ? rawTitle : "",
      body: typeof rawBody === "string" ? rawBody : "",
    });

    if (!parsed.success) {
      setFormError(parsed.issues[0]?.message ?? "Please check your note.");
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      const bodyHtml = plainTextToHtml({ text: parsed.output.body });
      const plainTextSnippet = parsed.output.body
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 150);

      if (existingNote) {
        const result = await updateNoteAction({
          noteId: existingNote.id,
          title: parsed.output.title,
          bodyHtml,
          plainTextSnippet,
        });
        if (!result.success) {
          setFormError(result.error);
          return;
        }
        toast.success("Note updated");
        onNoteSaved({ note: result.note, isNew: false });
        onOpenChange(false);
        return;
      }

      if (!anchor) {
        setFormError("No passage selection found.");
        return;
      }

      const result = await createNoteAction({
        title: parsed.output.title,
        bodyHtml,
        plainTextSnippet,
        planInstanceId: planInstanceId ?? null,
        planDayNumber: planDayNumber ?? null,
        versionId: anchor.versionId,
        bookId: anchor.bookId,
        chapter: anchor.chapter,
        startVerse: anchor.startVerse,
        startOffset: anchor.startOffset,
        endVerse: anchor.endVerse,
        endOffset: anchor.endOffset,
        selectedText: anchor.selectedText,
      });

      if (!result.success) {
        setFormError(result.error);
        return;
      }

      toast.success("Note saved");
      onNoteSaved({ note: result.note, isNew: true });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingNote || isDeleting || isSaving) return;
    setIsDeleting(true);
    setFormError(null);
    try {
      const result = await deleteNoteAction({ noteId: existingNote.id });
      if (!result.success) {
        setFormError(result.error);
        return;
      }
      toast.success("Note deleted");
      onNoteDeleted({ noteId: existingNote.id });
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} closeOnBack={false}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/70">
          <div className="flex items-center gap-2 pr-8">
            <StickyNote className="size-4 text-primary shrink-0" />
            <SheetTitle className="text-base font-semibold truncate">
              {existingNote ? "Edit Passage Note" : "New Passage Note"}
            </SheetTitle>
          </div>
          <SheetDescription className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-semibold text-primary">
              <BookOpen className="size-3 shrink-0" />
              {verseRef}
            </span>
            {anchor?.versionAbbr ? (
              <span className="text-muted-foreground font-medium">
                {anchor.versionAbbr}
              </span>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        <form
          key={formKey}
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-y-auto px-5 py-4 gap-4"
        >
          {quotedText ? (
            <blockquote className="rounded-xl border border-border/70 bg-muted/40 px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground italic line-clamp-4">
              &ldquo;{quotedText}&rdquo;
            </blockquote>
          ) : null}

          <div className="space-y-1.5">
            <label
              htmlFor="passage-note-title"
              className="text-xs font-medium leading-none"
            >
              Title
            </label>
            <Input
              id="passage-note-title"
              name="title"
              defaultValue={existingNote?.title ?? verseRef}
              placeholder={verseRef}
              maxLength={200}
              disabled={isSaving || isDeleting}
              className="focus-visible:ring-0 focus-visible:border-border"
            />
          </div>

          <div className="space-y-1.5 flex-1 flex flex-col">
            <label
              htmlFor="passage-note-body"
              className="text-xs font-medium leading-none"
            >
              Note
            </label>
            <textarea
              id="passage-note-body"
              name="body"
              defaultValue={
                existingNote
                  ? htmlToPlainText({ html: existingNote.bodyHtml })
                  : ""
              }
              placeholder="Write your reflection or study note..."
              className="min-h-[160px] flex-1 resize-none w-full rounded-xl border border-input bg-card px-3 py-2 text-sm shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:border-border disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus={!existingNote}
              disabled={isSaving || isDeleting}
            />
          </div>

          {formError ? (
            <p className="text-xs font-medium text-destructive">{formError}</p>
          ) : null}

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
            <div className="flex items-center gap-2">
              {existingNote ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isSaving || isDeleting}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2.5"
                    aria-label="Delete note"
                  >
                    {isDeleting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                  <Link
                    href="/notes"
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>All Notes</span>
                  </Link>
                </>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              )}
            </div>

            <Button type="submit" size="sm" disabled={isSaving || isDeleting}>
              {isSaving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : existingNote ? (
                "Save Changes"
              ) : (
                "Save Note"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
