import { headers } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/navigation/app-shell";
import { getUserTrackersData } from "@/actions/trackers";
import { syncUserStreak } from "@/lib/streak-service";
import { type NoteDetail } from "@/actions/notes";
import {
  getUserNotesForUser,
  getSingleNoteForUser,
} from "@/lib/notes/queries";
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

  const [trackersData, streak, notesData, targetNote] = await Promise.all([
    getUserTrackersData({ userId: session.user.id }),
    syncUserStreak({ userId: session.user.id }),
    getUserNotesForUser({
      userId: session.user.id,
      planInstanceId: resolvedParams.noteId ? undefined : resolvedParams.planId,
      folderId: resolvedParams.noteId ? undefined : resolvedParams.folderId,
      includeArchived: true,
    }),
    resolvedParams.noteId
      ? getSingleNoteForUser({
          userId: session.user.id,
          noteId: resolvedParams.noteId,
        })
      : Promise.resolve(null),
  ]);

  let initialNotes: NoteDetail[] = [...notesData.notes];
  const initialFolders = notesData.folders;

  if (targetNote && !initialNotes.some((n) => n.id === targetNote.id)) {
    initialNotes = [targetNote, ...initialNotes];
  }

  return (
    <AppShell
      userName={displayName}
      userEmail={session.user.email}
      userImage={session.user.image ?? undefined}
      streak={streak}
      trackers={trackersData.trackers}
      activeTrackerId={trackersData.activeTracker?.id}
    >
      <div className="w-full max-w-[1440px] mx-auto space-y-4 sm:space-y-6 pb-12">
        <NotesManager
          initialNotes={initialNotes}
          initialFolders={initialFolders}
          defaultPlanId={resolvedParams.planId}
          defaultSessionId={
            resolvedParams.session ? Number(resolvedParams.session) : undefined
          }
          defaultFolderId={resolvedParams.folderId}
          defaultNoteId={resolvedParams.noteId}
        />
      </div>
    </AppShell>
  );
}
