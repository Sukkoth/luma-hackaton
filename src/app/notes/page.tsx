import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Plus, Search, Bookmark, Folder, MoreHorizontal } from "lucide-react";
import { auth } from "@/lib/auth";
import { TopNavbar } from "@/components/luma/top-navbar";

type NoteItem = {
  id: string;
  title: string;
  passage: string;
  excerpt: string;
  planRef?: string;
  folder: string;
  date: string;
};

const SAMPLE_NOTES: ReadonlyArray<NoteItem> = [
  {
    id: "note-1",
    title: "No Condemnation & Life in the Spirit",
    passage: "Romans 8:1–11",
    excerpt:
      "Paul contrasts life according to the flesh with life according to the Spirit. The law of the Spirit of life has set us free from the law of sin and death. Meditated on how our mind set on the Spirit brings life and peace.",
    planRef: "Bible in a Year • Day 212",
    folder: "Plan Reflections",
    date: "Nov 17, 2025",
  },
  {
    id: "note-2",
    title: "The Word Made Flesh & Grace upon Grace",
    passage: "John 1:1–18",
    excerpt:
      "In the beginning was the Word, and the Word was with God, and the Word was God. He came into the world he made, and the darkness has not overcome it. Full of grace and truth.",
    planRef: "The Four Gospels • Day 1",
    folder: "Plan Reflections",
    date: "Nov 12, 2025",
  },
  {
    id: "note-3",
    title: "Jesus the Exact Imprint of God's Nature",
    passage: "Hebrews 1:1–4",
    excerpt:
      "God spoke through prophets in many portions, but in these last days He has spoken to us by His Son, whom He appointed heir of all things, through whom also He made the universe.",
    planRef: "Book of Hebrews • Day 1",
    folder: "Theology",
    date: "Nov 08, 2025",
  },
  {
    id: "note-4",
    title: "The Lord is My Shepherd: Contentment & Provision",
    passage: "Psalm 23:1–6",
    excerpt:
      "I shall not want. He makes me lie down in green pastures, leads me beside still waters. Even through the darkest valley, I will fear no evil for You are with me; Your rod and staff comfort me.",
    folder: "Devotional",
    date: "Oct 29, 2025",
  },
];

export const instant = false;

export default async function NotesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/notes");
  }

  const displayName =
    session.user.name.split(" ")[0] || session.user.name || "Reader";

  return (
    <div className="mx-auto min-h-screen max-w-[1400px] px-4 py-3 sm:px-6 md:px-8 md:py-4">
      {/* Top Navbar */}
      <TopNavbar userName={displayName} />

      <main className="mt-4 space-y-4">
        {/* Top Header & New Note Action Banner */}
        <section className="glass-panel flex flex-col justify-between gap-4 rounded-[28px] p-6 sm:flex-row sm:items-center sm:p-7">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-[6px] bg-[#DDFD2C] px-2 py-0.5 text-[11px] font-medium text-black">
                Personal Journal
              </span>
              <span className="text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                Linked to Active Tracker
              </span>
            </div>
            <h1 className="mt-2 text-[26px] font-normal tracking-tight text-black sm:text-[30px] dark:text-white">
              Notes & Journals
            </h1>
            <p className="mt-1 text-[13px] text-[#666666] dark:text-[#9CA3AF]">
              Keep study reflections, prayer journals, and link thoughts to your
              Bible reading plan sections.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-[12px] bg-black px-4 py-2 text-[13px] font-medium text-white shadow-xs transition-colors hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
            >
              <Plus className="h-4 w-4" />
              <span>New Note</span>
            </button>
          </div>
        </section>

        {/* Notes Explorer Section */}
        <section className="glass-panel rounded-[28px] p-6 sm:p-7">
          {/* Toolbar: Folder tabs and Search */}
          <div className="flex flex-col gap-4 border-b border-black/[0.04] pb-5 md:flex-row md:items-center md:justify-between dark:border-white/[0.06]">
            {/* Folder Filter Tiles */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-[12px] border border-white/90 bg-white px-3.5 py-1.5 text-[12px] font-medium text-black shadow-xs backdrop-blur-md dark:border-white/15 dark:bg-white/10 dark:text-white"
              >
                All Notes (4)
              </button>
              <button
                type="button"
                className="rounded-[12px] border border-white/50 bg-white/35 px-3.5 py-1.5 text-[12px] font-normal text-[#555555] backdrop-blur-md hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-[#A1A1AA] dark:hover:border-white/15 dark:hover:bg-white/[0.08] dark:hover:text-white"
              >
                Plan Reflections (2)
              </button>
              <button
                type="button"
                className="rounded-[12px] border border-white/50 bg-white/35 px-3.5 py-1.5 text-[12px] font-normal text-[#555555] backdrop-blur-md hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-[#A1A1AA] dark:hover:border-white/15 dark:hover:bg-white/[0.08] dark:hover:text-white"
              >
                Theology (1)
              </button>
              <button
                type="button"
                className="rounded-[12px] border border-white/50 bg-white/35 px-3.5 py-1.5 text-[12px] font-normal text-[#555555] backdrop-blur-md hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-[#A1A1AA] dark:hover:border-white/15 dark:hover:bg-white/[0.08] dark:hover:text-white"
              >
                Devotional (1)
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-3.5 w-3.5 -translate-y-1/2 text-[#888888] dark:text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search notes..."
                className="w-full rounded-[12px] border border-white/80 bg-white/50 py-2 pr-3.5 pl-9 text-[13px] text-black backdrop-blur-md transition-all placeholder:text-[#888888] focus:border-white focus:bg-white focus:outline-hidden dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-[#A1A1AA] dark:focus:border-white/20 dark:focus:bg-white/[0.08]"
              />
            </div>
          </div>

          {/* Notes Cards Grid */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {SAMPLE_NOTES.map((note) => (
              <div
                key={note.id}
                className="group isolate flex flex-col justify-between rounded-[20px] border border-black/[0.08] bg-white/75 p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors duration-150 hover:border-black/[0.18] hover:bg-white hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none dark:hover:border-white/[0.18] dark:hover:bg-white/[0.07]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-[6px] bg-[#82ADD4]/15 px-2 py-0.5 text-[11px] font-medium text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
                      {note.passage}
                    </span>
                    <span className="text-[11px] text-[#888888] dark:text-[#A1A1AA]">
                      {note.date}
                    </span>
                  </div>

                  <h3 className="mt-3 text-[17px] font-medium tracking-tight text-black group-hover:text-[#6894BC] dark:text-white dark:group-hover:text-[#82ADD4]">
                    {note.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed font-normal text-[#666666] dark:text-[#9CA3AF]">
                    {note.excerpt}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-black/[0.04] pt-3 text-[11px] text-[#777777] dark:border-white/[0.06] dark:text-[#A1A1AA]">
                  <span className="flex items-center gap-1.5">
                    {note.planRef ? (
                      <>
                        <Bookmark className="h-3 w-3 text-[#82ADD4]" />
                        <span>{note.planRef}</span>
                      </>
                    ) : (
                      <>
                        <Folder className="h-3 w-3 text-[#888888] dark:text-[#9CA3AF]" />
                        <span>{note.folder}</span>
                      </>
                    )}
                  </span>
                  <button
                    type="button"
                    aria-label="Note actions"
                    className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[#888888] hover:bg-black/5 hover:text-black dark:text-[#A1A1AA] dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
