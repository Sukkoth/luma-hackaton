import { FileText, Folder, Plus, Search } from "lucide-react";

export default function NotesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Notes & Journals
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Keep study notes, reflections, and link them to plan sections.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-500">
          <Plus className="h-4 w-4" />
          <span>New Note</span>
        </button>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-4">
        {/* Folders sidebar */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 uppercase">
            <span>Folders</span>
            <button className="text-blue-600 hover:underline dark:text-blue-400">
              + Add
            </button>
          </div>
          <div className="mt-3 space-y-1">
            <button className="flex w-full items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Folder className="h-4 w-4" />
              <span>All Notes</span>
            </button>
          </div>
        </div>

        {/* Notes list placeholder */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs md:col-span-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Search className="h-4 w-4" />
              <span>Search notes...</span>
            </div>
          </div>
          <div className="py-12 text-center text-sm text-zinc-500">
            <FileText className="mx-auto h-8 w-8 text-zinc-400" />
            <p className="mt-2 font-medium text-zinc-800 dark:text-zinc-200">
              No notes yet
            </p>
            <p className="text-xs">
              Create your first note or link reflections from plan readings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
