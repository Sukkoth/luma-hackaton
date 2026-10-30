import { FolderKanban } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Manage trackers, reading preferences, reminders, and account details.
        </p>
      </div>

      <div className="space-y-6">
        {/* Trackers Section */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold">Reading Trackers</h2>
            </div>
            <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-500">
              New Tracker
            </button>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Default Tracker
                </p>
                <p className="text-xs text-zinc-500">
                  Protestant Canon (66 books) • Active
                </p>
              </div>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
                Current
              </span>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Preferences</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-xs text-zinc-500">
                  System, Light, or Dark mode
                </p>
              </div>
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                System
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <div>
                <p className="font-medium">Default Pacing</p>
                <p className="text-xs text-zinc-500">
                  Scheduled vs Self-paced for new plans
                </p>
              </div>
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Scheduled
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
