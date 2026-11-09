"use client";

import { useCallback } from "react";
import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { closeHistory, isHistoryTransaction } from "@tiptap/pm/history";
import type { Step } from "@tiptap/pm/transform";
import {
  Heading1,
  Heading2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Undo2,
  Redo2,
} from "lucide-react";

type StepWithSliceOrStructure = Step & {
  slice?: {
    content?: {
      size: number;
      textBetween: (from: number, to: number) => string;
    };
  };
  structure?: boolean;
};

// Extension that creates discrete undo/redo checkpoints at word/sentence/paragraph boundaries
const GranularHistory = Extension.create({
  name: "granularHistory",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("granularHistoryCloser"),
        appendTransaction(transactions, _oldState, newState) {
          const lastTr = transactions[transactions.length - 1];
          if (!lastTr || !lastTr.docChanged) return null;
          if (isHistoryTransaction(lastTr)) return null;

          const hasBoundary = lastTr.steps.some((rawStep) => {
            const step = rawStep as StepWithSliceOrStructure;
            if (step.structure) {
              return true;
            }
            if (step.slice?.content) {
              const text = step.slice.content.textBetween(
                0,
                step.slice.content.size
              );
              return /[\s.!?\n\r,;:]/.test(text);
            }
            return false;
          });

          if (hasBoundary) {
            return closeHistory(newState.tr);
          }

          return null;
        },
      }),
    ];
  },
});

export type TiptapEditorProps = {
  content: string;
  onChangeAction: (content: { html: string; plainText: string }) => void;
  placeholder?: string;
  editable?: boolean;
  titleSlot?:
    | React.ReactNode
    | ((params: { focusEditor: () => void }) => React.ReactNode);
  minHeightClass?: string;
};

export function TiptapEditor({
  content,
  onChangeAction,
  placeholder = "Write your reflections, verses, or study notes here...",
  editable = true,
  titleSlot,
  minHeightClass = "min-h-[300px]",
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
        bold: {},
        italic: {},
        bulletList: {},
        orderedList: {},
        undoRedo: {
          depth: 300,
          newGroupDelay: 250,
        },
        // Other formatting disabled
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        dropcursor: false,
        gapcursor: false,
      }),
      Underline,
      GranularHistory,
    ],
    content,
    editorProps: {
      attributes: {
        class: `tiptap-notes-editor ${minHeightClass} w-full focus:outline-hidden text-[14.5px] sm:text-[15px] leading-relaxed text-black dark:text-white px-1 py-2 font-normal`,
        "data-placeholder": placeholder,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChangeAction({
        html: currentEditor.getHTML(),
        plainText: currentEditor.getText(),
      });
    },
  });

  const editorState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor) {
        return {
          canUndo: false,
          canRedo: false,
          isH1: false,
          isH2: false,
          isBold: false,
          isItalic: false,
          isUnderline: false,
          isBullet: false,
          isOrdered: false,
        };
      }
      return {
        canUndo: currentEditor.can().undo(),
        canRedo: currentEditor.can().redo(),
        isH1: currentEditor.isActive("heading", { level: 1 }),
        isH2: currentEditor.isActive("heading", { level: 2 }),
        isBold: currentEditor.isActive("bold"),
        isItalic: currentEditor.isActive("italic"),
        isUnderline: currentEditor.isActive("underline"),
        isBullet: currentEditor.isActive("bulletList"),
        isOrdered: currentEditor.isActive("orderedList"),
      };
    },
  });

  const focusEditor = useCallback(() => {
    if (editor) {
      editor.commands.focus("start");
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex min-h-[340px] items-center justify-center text-[13px] text-foreground-dim">
        Loading editor...
      </div>
    );
  }

  const canUndo = editorState?.canUndo ?? false;
  const canRedo = editorState?.canRedo ?? false;
  const isH1 = editorState?.isH1 ?? false;
  const isH2 = editorState?.isH2 ?? false;
  const isBold = editorState?.isBold ?? false;
  const isItalic = editorState?.isItalic ?? false;
  const isUnderline = editorState?.isUnderline ?? false;
  const isBullet = editorState?.isBullet ?? false;
  const isOrdered = editorState?.isOrdered ?? false;

  return (
    <div className="flex flex-col">
      {/* Tiptap Toolbar: Undo, Redo, H1, H2, Bold, Italics, Underline, Lists */}
      <div
        data-testid="tiptap-toolbar"
        className="sticky top-0 z-10 flex items-center gap-1 overflow-x-auto scrollbar-none rounded-[14px] bg-surface-elevated border border-border p-1.5 backdrop-blur-md shadow-2xs"
      >
        {/* History: Undo */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!canUndo}
          className="flex size-9 items-center justify-center rounded-[12px] text-foreground-secondary hover:bg-surface hover:text-foreground hover:shadow-2xs disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
          title="Undo"
          aria-label="Undo"
        >
          <Undo2 className="size-4" />
        </button>

        {/* History: Redo */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!canRedo}
          className="flex size-9 items-center justify-center rounded-[12px] text-foreground-secondary hover:bg-surface hover:text-foreground hover:shadow-2xs disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
          title="Redo"
          aria-label="Redo"
        >
          <Redo2 className="size-4" />
        </button>

        <div className="mx-1 h-4.5 w-px bg-border shrink-0" />

        {/* Heading 1 */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={`flex size-9 items-center justify-center rounded-[12px] text-[13px] font-medium transition-all cursor-pointer shrink-0 ${
            isH1
              ? "bg-primary/15 text-primary border border-primary/30 shadow-2xs"
              : "text-foreground-secondary hover:bg-surface hover:text-foreground hover:shadow-2xs"
          }`}
          title="Heading 1"
          aria-label="Heading 1"
          aria-pressed={isH1}
        >
          <Heading1 className="size-4" />
        </button>

        {/* Heading 2 */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`flex size-9 items-center justify-center rounded-[12px] text-[13px] font-medium transition-all cursor-pointer shrink-0 ${
            isH2
              ? "bg-primary/15 text-primary border border-primary/30 shadow-2xs"
              : "text-foreground-secondary hover:bg-surface hover:text-foreground hover:shadow-2xs"
          }`}
          title="Heading 2"
          aria-label="Heading 2"
          aria-pressed={isH2}
        >
          <Heading2 className="size-4" />
        </button>

        <div className="mx-1 h-4.5 w-px bg-border shrink-0" />

        {/* Bold */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`flex size-9 items-center justify-center rounded-[12px] text-[13px] font-medium transition-all cursor-pointer shrink-0 ${
            isBold
              ? "bg-primary/15 text-primary border border-primary/30 shadow-2xs"
              : "text-foreground-secondary hover:bg-surface hover:text-foreground hover:shadow-2xs"
          }`}
          title="Bold"
          aria-label="Bold"
          aria-pressed={isBold}
        >
          <Bold className="size-4" />
        </button>

        {/* Italics */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`flex size-9 items-center justify-center rounded-[12px] text-[13px] font-medium transition-all cursor-pointer shrink-0 ${
            isItalic
              ? "bg-primary/15 text-primary border border-primary/30 shadow-2xs"
              : "text-foreground-secondary hover:bg-surface hover:text-foreground hover:shadow-2xs"
          }`}
          title="Italics"
          aria-label="Italics"
          aria-pressed={isItalic}
        >
          <Italic className="size-4" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`flex size-9 items-center justify-center rounded-[12px] text-[13px] font-medium transition-all cursor-pointer shrink-0 ${
            isUnderline
              ? "bg-primary/15 text-primary border border-primary/30 shadow-2xs"
              : "text-foreground-secondary hover:bg-surface hover:text-foreground hover:shadow-2xs"
          }`}
          title="Underline"
          aria-label="Underline"
          aria-pressed={isUnderline}
        >
          <UnderlineIcon className="size-4" />
        </button>

        <div className="mx-1 h-4.5 w-px bg-border shrink-0" />

        {/* Bullet List */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`flex size-9 items-center justify-center rounded-[12px] text-[13px] font-medium transition-all cursor-pointer shrink-0 ${
            isBullet
              ? "bg-primary/15 text-primary border border-primary/30 shadow-2xs"
              : "text-foreground-secondary hover:bg-surface hover:text-foreground hover:shadow-2xs"
          }`}
          title="Bullet List"
          aria-label="Bullet List"
          aria-pressed={isBullet}
        >
          <List className="size-4" />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`flex size-9 items-center justify-center rounded-[12px] text-[13px] font-medium transition-all cursor-pointer shrink-0 ${
            isOrdered
              ? "bg-primary/15 text-primary border border-primary/30 shadow-2xs"
              : "text-foreground-secondary hover:bg-surface hover:text-foreground hover:shadow-2xs"
          }`}
          title="Numbered List"
          aria-label="Numbered List"
          aria-pressed={isOrdered}
        >
          <ListOrdered className="size-4" />
        </button>
      </div>

      {/* Note Title & Content Body Section */}
      <div className="mt-3 space-y-1">
        {titleSlot && (
          <div>
            {typeof titleSlot === "function"
              ? titleSlot({ focusEditor })
              : titleSlot}
          </div>
        )}

        {/* Editor Content Area */}
        <div>
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Scoped CSS for Tiptap rendering */}
      <style jsx global>{`
        .tiptap-notes-editor {
          word-break: break-word;
          overflow-wrap: break-word;
        }
        .tiptap-notes-editor h1 {
          font-size: 1.55rem;
          font-weight: 700;
          line-height: 1.25;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }
        .tiptap-notes-editor h2 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.35;
          margin-top: 0.85rem;
          margin-bottom: 0.35rem;
          letter-spacing: -0.015em;
        }
        .tiptap-notes-editor strong {
          font-weight: 700;
        }
        .tiptap-notes-editor em {
          font-style: italic;
        }
        .tiptap-notes-editor u {
          text-decoration: underline;
        }
        .tiptap-notes-editor ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .tiptap-notes-editor ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .tiptap-notes-editor li {
          margin-top: 0.2rem;
          margin-bottom: 0.2rem;
          padding-left: 0.25rem;
        }
        .tiptap-notes-editor p {
          margin-top: 0.35rem;
          margin-bottom: 0.35rem;
          line-height: 1.6;
        }
        .tiptap-notes-editor p:first-child {
          margin-top: 0.1rem;
        }
        .tiptap-notes-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--color-foreground-dim);
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}
