import { headers } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TopNavbar } from "@/components/luma/top-navbar";
import { getUserTrackersData } from "@/actions/trackers";
import { syncUserStreak } from "@/lib/streak-service";
import {
  getUserNotesAction,
  getSingleNoteAction,
  type NoteDetail,
} from "@/actions/notes";
import { NotesManager } from "@/components/notes/notes-manager";

export const instant = false;

type NotesPageProps = {
  searchParams: Promise<{
    planId?: string;
    session?: string;
    folderId?: string;
    noteId?: string;
  }>;
};

export default async function NotesPage({ searchParams }: NotesPageProps) {
  await connection();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/notes");
  }

  const resolvedParams = await searchParams;

  const displayName =
    session.user.name?.split(" ")[0] || session.user.name || "Reader";

  const [trackersData, streak, notesData, singleNoteRes] = await Promise.all([
    getUserTrackersData({ userId: session.user.id }),
    syncUserStreak({ userId: session.user.id }),
    getUserNotesAction({
      planInstanceId: resolvedParams.noteId ? undefined : resolvedParams.planId,
      folderId: resolvedParams.noteId ? undefined : resolvedParams.folderId,
      includeArchived: true,
    }),
    resolvedParams.noteId
      ? getSingleNoteAction({ noteId: resolvedParams.noteId })
      : Promise.resolve(null),
  ]);

  const targetNote: NoteDetail | null =
    singleNoteRes && singleNoteRes.success ? singleNoteRes.note : null;

  let initialNotes = notesData.success ? [...notesData.notes] : [];
  const initialFolders = notesData.success ? notesData.folders : [];

  if (targetNote && !initialNotes.some((n) => n.id === targetNote.id)) {
    initialNotes = [targetNote, ...initialNotes];
  }

  return (
    <div className="mx-auto min-h-screen max-w-350 px-4 py-3 sm:px-6 md:px-8 md:py-4">
      {/* Top Navbar */}
      <TopNavbar
        userName={displayName}
        streak={streak}
        trackers={trackersData.trackers}
        activeTrackerId={trackersData.activeTracker?.id}
      />

      <main className="mt-4">
        <NotesManager
          key={resolvedParams.noteId ?? "default"}
          initialNotes={initialNotes}
          initialFolders={initialFolders}
          defaultPlanId={resolvedParams.planId}
          defaultSessionId={
            resolvedParams.session ? Number(resolvedParams.session) : undefined
          }
          defaultNoteId={resolvedParams.noteId}
        />
      </main>
    </div>
  );
}
