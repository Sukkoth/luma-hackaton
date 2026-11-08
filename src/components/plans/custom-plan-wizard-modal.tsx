"use client";

import { useState, useMemo, useTransition, useRef, useEffect } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  MoveUp,
  MoveDown,
  RotateCcw,
  Loader2,
  Layers,
  ListOrdered,
  Lock,
  Unlock,
  Split,
  Calendar,
  Plus,
  AlertTriangle,
  Eye,
  BookOpen,
} from "lucide-react";
import {
  BIBLE_CANONS_CONFIG,
  BIBLE_BOOK_MAP,
  type BibleCanon,
  type BibleBook,
  getBibleBooks,
} from "@/data/bibleData";
import {
  type ReadingPlanTemplate,
  buildCustomReadingPlanTemplate,
} from "@/data/readingPlans";
import { createCustomPlanTemplateAction } from "@/actions/plans";

type CustomWizardStep = "scope" | "order" | "review";

const WIZARD_STEPS: ReadonlyArray<{
  id: CustomWizardStep;
  num: string;
  label: string;
}> = [
  { id: "scope", num: "01", label: "Scope" },
  { id: "order", num: "02", label: "Sequence & Sessions" },
  { id: "review", num: "03", label: "Review & Pacing" },
];

type BookGroupSectionDef = {
  id: string;
  title: string;
  category: BibleBook["category"];
};

const BOOK_GROUP_SECTIONS: BookGroupSectionDef[] = [
  { id: "law", title: "The Law (Torah)", category: "Law" },
  { id: "history", title: "Historical Books", category: "History" },
  { id: "wisdom", title: "Poetry & Wisdom", category: "Poetry & Wisdom" },
  { id: "major_prophets", title: "Major Prophets", category: "Major Prophets" },
  { id: "minor_prophets", title: "Minor Prophets", category: "Minor Prophets" },
  { id: "deuterocanon", title: "Deuterocanon", category: "Deuterocanon" },
  { id: "gospels", title: "The Gospels", category: "Gospels" },
  {
    id: "church_history",
    title: "Church History & Acts",
    category: "Church History",
  },
  { id: "pauline", title: "Pauline Epistles", category: "Pauline Epistles" },
  { id: "general", title: "General Epistles", category: "General Epistles" },
  { id: "apocalyptic", title: "Apocalyptic", category: "Apocalyptic" },
  { id: "orthodox", title: "Orthodox Canon", category: "Orthodox Canon" },
];

export type CustomPlanWizardModalProps = {
  isOpen: boolean;
  onCloseAction: () => void;
  activeTrackerCanon?: BibleCanon;
  onPlanCreatedAction: (plan: ReadingPlanTemplate) => void;
  onPlanCreatedAndStartAction?: (plan: ReadingPlanTemplate) => void;
};

export type WizardCuratedSession = {
  id: string;
  chapters: Array<{ bookId: string; chapter: number }>;
};

export function CustomPlanWizardModal({
  isOpen,
  onCloseAction,
  activeTrackerCanon = "protestant",
  onPlanCreatedAction,
  onPlanCreatedAndStartAction,
}: CustomPlanWizardModalProps) {
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState<CustomWizardStep>("scope");
  const [selectedCanon, setSelectedCanon] =
    useState<BibleCanon>(activeTrackerCanon);

  // Step 1: Selected Book IDs & Search
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Step 2: Sequence Mode, Books Sequence & Sessions
  const [sequenceMode, setSequenceMode] = useState<"book" | "chapter">("book");
  const [mobileChapterTab, setMobileChapterTab] = useState<
    "books" | "chapters" | "order"
  >("books");
  const [orderedBookIds, setOrderedBookIds] = useState<string[]>([]);
  const [selectedBookForChapters, setSelectedBookForChapters] =
    useState<string>("");

  // Sessions structure with empty items supported for immediate visual feedback
  const [wizardSessions, setWizardSessions] = useState<WizardCuratedSession[]>([
    { id: "session_1", chapters: [] },
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>("session_1");

  // Step 3: Details & Pacing
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [dailyTarget, setDailyTarget] = useState(3);
  const [pacingStyle, setPacingStyle] = useState<"locked_curated" | "flexible">(
    "locked_curated"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Auto-scroll ref for Column 3 session container
  const sessionsScrollRef = useRef<HTMLDivElement>(null);
  const prevChapterCountRef = useRef(0);
  const prevSessionCountRef = useRef(1);

  // Canon Books list based on selection
  const canonBooks = useMemo(() => {
    return getBibleBooks(selectedCanon);
  }, [selectedCanon]);

  const selectedBookIdSet = useMemo(() => {
    return new Set(selectedBookIds);
  }, [selectedBookIds]);

  // Flattened chapter sequence derived from all sessions
  const chapterSequence = useMemo(() => {
    return wizardSessions.flatMap((s) => s.chapters);
  }, [wizardSessions]);

  // Total chapters across selected books in Step 1
  const totalSelectedChapters = useMemo(() => {
    return selectedBookIds.reduce((sum, id) => {
      const b = BIBLE_BOOK_MAP[id];
      return sum + (b ? b.chapters : 0);
    }, 0);
  }, [selectedBookIds]);

  // Filtered books for Step 1
  const filteredGroupSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const canonBookMap = new Map(canonBooks.map((b) => [b.id, b]));

    return BOOK_GROUP_SECTIONS.map((sec) => {
      const booksInSec = canonBooks.filter((b) => b.category === sec.category);
      const filteredBooks = q
        ? booksInSec.filter(
            (b) =>
              b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)
          )
        : booksInSec;

      return {
        ...sec,
        books: filteredBooks.filter((b) => canonBookMap.has(b.id)),
      };
    }).filter((sec) => sec.books.length > 0);
  }, [canonBooks, searchQuery]);

  // Handle Canon Change
  const handleCanonChange = (newCanon: BibleCanon) => {
    setSelectedCanon(newCanon);
    const newCanonIds = new Set(getBibleBooks(newCanon).map((b) => b.id));
    setSelectedBookIds((prev) => prev.filter((id) => newCanonIds.has(id)));
    setOrderedBookIds((prev) => prev.filter((id) => newCanonIds.has(id)));
    setWizardSessions((prev) =>
      prev.map((s) => ({
        ...s,
        chapters: s.chapters.filter((c) => newCanonIds.has(c.bookId)),
      }))
    );
  };

  const toggleBook = (id: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSection = (books: BibleBook[]) => {
    const ids = books.map((b) => b.id);
    const allSelected = ids.every((id) => selectedBookIdSet.has(id));
    if (allSelected) {
      setSelectedBookIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedBookIds, ...ids]));
      setSelectedBookIds(merged);
    }
  };

  const selectAll = () => {
    setSelectedBookIds(canonBooks.map((b) => b.id));
  };

  const clearAll = () => {
    setSelectedBookIds([]);
  };

  type MoveBookParams = {
    index: number;
    direction: "up" | "down";
  };

  type AddChapterToSequenceParams = {
    bookId: string;
    chapter: number;
  };

  type AddAllChaptersOfBookParams = {
    bookId: string;
  };

  type RemoveChapterFromSequenceParams = {
    sessionId: string;
    chapterIndex: number;
  };

  type MoveChapterInSequenceParams = {
    globalIndex: number;
    direction: "up" | "down";
  };

  // Active book selected in Column 1 for chapter inspection
  const activeBookForChapters = useMemo(() => {
    return BIBLE_BOOK_MAP[selectedBookForChapters] || null;
  }, [selectedBookForChapters]);

  // Target unique books based on current mode
  const targetBookIds = useMemo(() => {
    if (sequenceMode === "chapter") {
      const ids = Array.from(new Set(chapterSequence.map((c) => c.bookId)));
      return ids.length > 0 ? ids : orderedBookIds;
    }
    return orderedBookIds;
  }, [sequenceMode, chapterSequence, orderedBookIds]);

  // Total scheduled chapters based on current mode
  const totalPlanChapters = useMemo(() => {
    if (sequenceMode === "chapter") {
      return chapterSequence.length;
    }
    return orderedBookIds.reduce((sum, id) => {
      const b = BIBLE_BOOK_MAP[id];
      return sum + (b ? b.chapters : 0);
    }, 0);
  }, [sequenceMode, chapterSequence, orderedBookIds]);

  // Curated Sessions with 1-based display numbering and global chapter indices
  type CuratedSessionView = {
    id: string;
    sessionIndex: number;
    chapters: Array<{
      bookId: string;
      chapter: number;
      globalIndex: number;
    }>;
  };

  const curatedSessionsView = useMemo<CuratedSessionView[]>(() => {
    let currentGlobalIdx = 0;
    return wizardSessions.map((s, sIdx) => {
      const indexedChapters = s.chapters.map((ch) => ({
        bookId: ch.bookId,
        chapter: ch.chapter,
        globalIndex: currentGlobalIdx++,
      }));
      return {
        id: s.id,
        sessionIndex: sIdx + 1,
        chapters: indexedChapters,
      };
    });
  }, [wizardSessions]);

  // Non-empty sessions count for pacing calculations
  const populatedSessions = useMemo(() => {
    return wizardSessions.filter((s) => s.chapters.length > 0);
  }, [wizardSessions]);

  // Auto-scroll to bottom of Column 3 whenever a chapter or session is added
  useEffect(() => {
    const hasMoreChapters =
      chapterSequence.length > prevChapterCountRef.current;
    const hasMoreSessions = wizardSessions.length > prevSessionCountRef.current;

    if (sequenceMode === "chapter" && (hasMoreChapters || hasMoreSessions)) {
      requestAnimationFrame(() => {
        if (sessionsScrollRef.current) {
          sessionsScrollRef.current.scrollTo({
            top: sessionsScrollRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      });
    }

    prevChapterCountRef.current = chapterSequence.length;
    prevSessionCountRef.current = wizardSessions.length;
  }, [chapterSequence.length, wizardSessions.length, sequenceMode]);

  // Uneditable Curriculum & Reading Schedule Preview Sessions
  type PreviewPlanSession = {
    title: string;
    sessionNumber: number;
    chapters: Array<{ bookId: string; chapter: number }>;
  };

  const previewPlanSessions = useMemo<PreviewPlanSession[]>(() => {
    if (sequenceMode === "chapter") {
      return curatedSessionsView
        .filter((s) => s.chapters.length > 0)
        .map((s, idx) => ({
          title: `Session ${idx + 1}`,
          sessionNumber: idx + 1,
          chapters: s.chapters.map((c) => ({
            bookId: c.bookId,
            chapter: c.chapter,
          })),
        }));
    }

    // SequenceMode === "book": chunk all ordered book chapters by dailyTarget
    const allBookChapters: Array<{ bookId: string; chapter: number }> = [];
    for (const bId of orderedBookIds) {
      const book = BIBLE_BOOK_MAP[bId];
      if (!book) continue;
      for (let c = 1; c <= book.chapters; c++) {
        allBookChapters.push({ bookId: bId, chapter: c });
      }
    }

    const pace = Math.max(1, dailyTarget);
    const sessions: PreviewPlanSession[] = [];
    for (let i = 0; i < allBookChapters.length; i += pace) {
      const chunk = allBookChapters.slice(i, i + pace);
      const dayNum = Math.floor(i / pace) + 1;
      sessions.push({
        title: `Day ${dayNum}`,
        sessionNumber: dayNum,
        chapters: chunk,
      });
    }

    return sessions;
  }, [sequenceMode, curatedSessionsView, orderedBookIds, dailyTarget]);

  // Advance to Order step
  const goToOrderStep = () => {
    if (selectedBookIds.length === 0) return;
    setOrderedBookIds((prev) => {
      const existing = prev.filter((id) => selectedBookIds.includes(id));
      const newlyAdded = selectedBookIds.filter((id) => !prev.includes(id));
      return [...existing, ...newlyAdded];
    });
    setSelectedBookForChapters((prev) => {
      if (prev && selectedBookIds.includes(prev)) return prev;
      return selectedBookIds[0] || "";
    });
    setCurrentStep("order");
  };

  // Chapter sequence manipulation handlers: adds to active session
  const addChapterToSequence = ({
    bookId,
    chapter,
  }: AddChapterToSequenceParams) => {
    setWizardSessions((prev) => {
      const targetId =
        activeSessionId || prev[prev.length - 1]?.id || "session_1";
      const sessionExists = prev.some((s) => s.id === targetId);

      if (!sessionExists) {
        return [...prev, { id: targetId, chapters: [{ bookId, chapter }] }];
      }

      return prev.map((s) =>
        s.id === targetId
          ? { ...s, chapters: [...s.chapters, { bookId, chapter }] }
          : s
      );
    });
  };

  const addAllChaptersOfBook = ({ bookId }: AddAllChaptersOfBookParams) => {
    const book = BIBLE_BOOK_MAP[bookId];
    if (!book) return;
    const newItems: Array<{ bookId: string; chapter: number }> = [];
    for (let c = 1; c <= book.chapters; c++) {
      newItems.push({ bookId, chapter: c });
    }
    setWizardSessions((prev) => {
      const targetId =
        activeSessionId || prev[prev.length - 1]?.id || "session_1";
      return prev.map((s) =>
        s.id === targetId ? { ...s, chapters: [...s.chapters, ...newItems] } : s
      );
    });
  };

  const addAllChaptersOfAllSelectedBooks = () => {
    const newItems: Array<{ bookId: string; chapter: number }> = [];
    for (const bId of orderedBookIds) {
      const book = BIBLE_BOOK_MAP[bId];
      if (!book) continue;
      for (let c = 1; c <= book.chapters; c++) {
        newItems.push({ bookId: bId, chapter: c });
      }
    }
    setWizardSessions([{ id: "session_1", chapters: newItems }]);
    setActiveSessionId("session_1");
  };

  const removeChapterFromSequence = ({
    sessionId,
    chapterIndex,
  }: RemoveChapterFromSequenceParams) => {
    setWizardSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              chapters: s.chapters.filter((_, idx) => idx !== chapterIndex),
            }
          : s
      )
    );
  };

  const moveChapterInSequence = ({
    globalIndex,
    direction,
  }: MoveChapterInSequenceParams) => {
    // Reorder across global chapter list while preserving session counts
    const flat = wizardSessions.flatMap((s) => s.chapters);
    const targetIdx = direction === "up" ? globalIndex - 1 : globalIndex + 1;
    if (targetIdx < 0 || targetIdx >= flat.length) return;

    const itemA = flat[globalIndex];
    const itemB = flat[targetIdx];
    if (!itemA || !itemB) return;

    flat[globalIndex] = itemB;
    flat[targetIdx] = itemA;

    // Distribute back according to each session's capacity
    let cursor = 0;
    setWizardSessions((prev) =>
      prev.map((s) => {
        const count = s.chapters.length;
        const newChapters = flat.slice(cursor, cursor + count);
        cursor += count;
        return { ...s, chapters: newChapters };
      })
    );
  };

  const clearChapterSequence = () => {
    setWizardSessions([{ id: "session_1", chapters: [] }]);
    setActiveSessionId("session_1");
  };

  // Immediate New Session Creation: Appends an empty session card for direct visual feedback
  const startNewSession = () => {
    const newSessionId = `session_${Date.now()}`;
    setWizardSessions((prev) => [...prev, { id: newSessionId, chapters: [] }]);
    setActiveSessionId(newSessionId);
  };

  // Split an existing session at a specific chapter boundary
  const splitSessionAtChapter = (
    sessionId: string,
    chapterIndexInSession: number
  ) => {
    setWizardSessions((prev) => {
      const sessionIdx = prev.findIndex((s) => s.id === sessionId);
      if (sessionIdx === -1) return prev;

      const currentSession = prev[sessionIdx];
      if (!currentSession) return prev;

      const firstHalf = currentSession.chapters.slice(
        0,
        chapterIndexInSession + 1
      );
      const secondHalf = currentSession.chapters.slice(
        chapterIndexInSession + 1
      );

      if (secondHalf.length === 0) return prev;

      const newSessionId = `session_${Date.now()}`;
      const updatedCurrent = { ...currentSession, chapters: firstHalf };
      const newSession = { id: newSessionId, chapters: secondHalf };

      const next = [...prev];
      next.splice(sessionIdx, 1, updatedCurrent, newSession);
      setActiveSessionId(newSessionId);
      return next;
    });
  };

  // Merge session with previous session
  const mergeSessionWithPrevious = (sessionIndex: number) => {
    if (sessionIndex <= 1) return;
    setWizardSessions((prev) => {
      const targetIdx = sessionIndex - 1; // 0-based
      const prevIdx = targetIdx - 1;
      const targetSession = prev[targetIdx];
      const prevSession = prev[prevIdx];

      if (!targetSession || !prevSession) return prev;

      const mergedPrev = {
        ...prevSession,
        chapters: [...prevSession.chapters, ...targetSession.chapters],
      };

      const next = prev.filter((_, idx) => idx !== targetIdx);
      next[prevIdx] = mergedPrev;
      setActiveSessionId(mergedPrev.id);
      return next;
    });
  };

  // Move book up/down in custom order
  const moveBook = ({ index, direction }: MoveBookParams) => {
    setOrderedBookIds((prev) => {
      const copy = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      const targetItem = copy[targetIndex];
      if (temp !== undefined && targetItem !== undefined) {
        copy[index] = targetItem;
        copy[targetIndex] = temp;
      }
      return copy;
    });
  };

  // Advance to Review step
  const goToReviewStep = () => {
    if (sequenceMode === "chapter" && chapterSequence.length === 0) return;
    if (sequenceMode === "book" && orderedBookIds.length === 0) return;

    // Generate smart default title if not set
    let defaultTitle = "Custom Reading Plan";
    if (targetBookIds.length === canonBooks.length) {
      defaultTitle = "Whole Bible Plan";
    } else if (
      targetBookIds.every((id) => BIBLE_BOOK_MAP[id]?.category === "Gospels")
    ) {
      defaultTitle = "The Four Gospels Journey";
    } else if (
      targetBookIds.every(
        (id) =>
          BIBLE_BOOK_MAP[id]?.category === "Pauline Epistles" ||
          BIBLE_BOOK_MAP[id]?.category === "General Epistles"
      )
    ) {
      defaultTitle = "New Testament Epistles";
    } else if (
      targetBookIds.every((id) => BIBLE_BOOK_MAP[id]?.testament === "OT")
    ) {
      defaultTitle = "Old Testament Walk";
    } else if (
      targetBookIds.every((id) => BIBLE_BOOK_MAP[id]?.testament === "NT")
    ) {
      defaultTitle = "New Testament Journey";
    }

    if (!customTitle.trim()) {
      setCustomTitle(defaultTitle);
    }

    setCurrentStep("review");
  };

  type HandleSavePlanParams = {
    shouldStart: boolean;
  };

  const handleSavePlan = ({ shouldStart }: HandleSavePlanParams) => {
    setErrorMessage(null);
    startTransition(async () => {
      let finalSequence: Array<{ bookId: string; chapter: number }> = [];

      if (sequenceMode === "chapter") {
        finalSequence = [...chapterSequence];
      } else {
        for (const bookId of orderedBookIds) {
          const book = BIBLE_BOOK_MAP[bookId];
          if (!book) continue;
          for (let c = 1; c <= book.chapters; c++) {
            finalSequence.push({ bookId, chapter: c });
          }
        }
      }

      if (finalSequence.length === 0) {
        setErrorMessage("Please select at least one chapter for this plan.");
        return;
      }

      const isLocked = pacingStyle === "locked_curated";
      const indexToDayMap = new Map<number, number>();

      if (sequenceMode === "chapter" && populatedSessions.length > 0) {
        let currentDay = 1;
        let globalCursor = 0;
        for (const s of wizardSessions) {
          if (s.chapters.length === 0) continue;
          for (let i = 0; i < s.chapters.length; i++) {
            indexToDayMap.set(globalCursor++, currentDay);
          }
          currentDay++;
        }
      }

      const totalSessionsCount =
        sequenceMode === "chapter" && populatedSessions.length > 0
          ? populatedSessions.length
          : Math.max(
              1,
              Math.ceil(finalSequence.length / Math.max(1, dailyTarget))
            );

      const generatedTemplate = buildCustomReadingPlanTemplate({
        title: customTitle.trim() || "My Custom Plan",
        description: customDescription.trim(),
        bookIds: targetBookIds,
        customChapters: finalSequence,
        orderType: "custom",
        canonCompatibility: selectedCanon,
        defaultDailyTarget: isLocked
          ? Math.max(1, Math.round(finalSequence.length / totalSessionsCount))
          : dailyTarget,
      });

      const res = await createCustomPlanTemplateAction({
        template: {
          title: generatedTemplate.title,
          subtitle: generatedTemplate.subtitle,
          description: generatedTemplate.description,
          category: generatedTemplate.category,
          icon: generatedTemplate.icon,
          accentColor: generatedTemplate.accentColor,
          totalChapters: generatedTemplate.totalChapters,
          defaultDailyTarget: isLocked
            ? Math.max(1, Math.round(finalSequence.length / totalSessionsCount))
            : dailyTarget,
          targetDays: totalSessionsCount,
          canonCompatibility: generatedTemplate.canonCompatibility ?? null,
          allowCustomPace: !isLocked,
          allowSelfPaced: !isLocked,
          sections: generatedTemplate.sections.map((s) => ({
            title: s.title,
            subtitle: s.subtitle,
            chaptersCount: s.chaptersCount,
            booksDescription: s.booksDescription,
          })),
          readings: generatedTemplate.readings.map((r, idx) => ({
            id: r.id,
            bookId: r.bookId,
            bookName: r.bookName,
            chapter: r.chapter,
            startVerse: r.startVerse,
            endVerse: r.endVerse,
            verseRange: r.verseRange,
            versesLabel: r.versesLabel,
            track: r.track,
            displayText: r.displayText,
            dayNumber: isLocked
              ? (indexToDayMap.get(idx) ??
                Math.floor(idx / Math.max(1, dailyTarget)) + 1)
              : undefined,
            order: r.order ?? idx + 1,
          })),
        },
      });

      if (!res.success) {
        setErrorMessage(res.error);
        return;
      }

      onPlanCreatedAction(res.template);
      if (shouldStart && onPlanCreatedAndStartAction) {
        onPlanCreatedAndStartAction(res.template);
      }
      onCloseAction();
    });
  };

  const currentStepIdx = WIZARD_STEPS.findIndex((s) => s.id === currentStep);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-plan-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
    >
      {/* Backdrop matching main app modal style */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={() => {
          if (!isPending) onCloseAction();
        }}
      />

      {/* Expanded Modal Dialog Content for generous breathing room */}
      <div className="relative z-10 flex h-[90vh] max-h-[92vh] w-full max-w-5xl xl:max-w-6xl flex-col overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-2xl dark:border-white/12 dark:bg-[#15161A]">
        {/* Header matching main app taste */}
        <div className="shrink-0 flex items-center justify-between border-b border-black/6 px-6 py-4 dark:border-white/8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Custom Reading Plan
              </span>
              <span className="rounded-md bg-black px-2 py-0.5 text-[10.5px] font-semibold text-white dark:bg-white dark:text-black">
                Builder
              </span>
            </div>
            <h2
              id="custom-plan-title"
              className="mt-1 text-[18px] font-medium tracking-tight text-black dark:text-white"
            >
              Step{" "}
              {currentStep === "scope"
                ? "1"
                : currentStep === "order"
                  ? "2"
                  : "3"}{" "}
              of 3:{" "}
              {currentStep === "scope"
                ? "Select Books & Scope"
                : currentStep === "order"
                  ? "Reading Sequence"
                  : "Plan Details & Pacing"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCloseAction}
            disabled={isPending}
            className="flex size-9 items-center justify-center rounded-full border border-black/8 bg-white/80 text-[#666666] transition-colors hover:bg-black/5 hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-[#A1A1AA] dark:hover:bg-white/10 dark:hover:text-white cursor-pointer"
            aria-label="Close modal"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Step Progress Bar matching PlanSetupModal */}
        <div className="shrink-0 border-b border-black/4 bg-black/1.5 px-6 py-2.5 dark:border-white/6 dark:bg-white/1.5">
          <div className="mb-2 grid grid-cols-3 gap-1.5">
            {WIZARD_STEPS.map((s, idx) => (
              <div
                key={s.id}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx <= currentStepIdx
                    ? "bg-black dark:bg-white"
                    : "bg-black/8 dark:bg-white/8"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-1.5">
            {WIZARD_STEPS.map((s, idx) => {
              const isActive = currentStep === s.id;
              const isPassed = idx < currentStepIdx;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (isPassed) setCurrentStep(s.id);
                  }}
                  disabled={!isPassed && !isActive}
                  className={`group relative flex items-center gap-2 rounded-xl px-3 py-1.5 text-left transition-all ${
                    isActive
                      ? "bg-black text-white shadow-xs dark:bg-white dark:text-black"
                      : isPassed
                        ? "cursor-pointer bg-black/4 text-black hover:bg-black/8 dark:bg-white/6 dark:text-white dark:hover:bg-white/10"
                        : "cursor-not-allowed opacity-40 text-[#888888] dark:text-[#71717A]"
                  }`}
                >
                  <span
                    className={`font-mono text-[11px] font-semibold tracking-wider ${
                      isActive
                        ? "text-zinc-900 dark:text-zinc-100"
                        : "text-black/60 dark:text-white/60"
                    }`}
                  >
                    {s.num}
                  </span>
                  <span
                    className={`text-[12px] font-medium ${
                      isActive ? "inline font-semibold" : "hidden sm:inline"
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body: In Step 2 (Order & Sessions), modal does NOT scroll; only inner column lists scroll */}
        <div
          className={`flex-1 min-h-0 p-4 sm:p-6 ${
            currentStep === "order"
              ? "flex flex-col overflow-hidden"
              : "overflow-y-auto space-y-4"
          }`}
        >
          {errorMessage && (
            <div className="shrink-0 mb-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[12.5px] text-red-600 dark:text-red-400">
              {errorMessage}
            </div>
          )}

          {/* STEP 1: SCOPE */}
          {currentStep === "scope" && (
            <div className="space-y-4">
              {/* Canon Selection and Search */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] font-medium text-black dark:text-white">
                    Canon:
                  </span>
                  <select
                    value={selectedCanon}
                    onChange={(e) =>
                      handleSelectCanonChange(e.target.value as BibleCanon)
                    }
                    className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-[12.5px] text-black shadow-2xs focus:outline-hidden dark:border-white/12 dark:bg-[#1C1D22] dark:text-white"
                  >
                    {Object.entries(BIBLE_CANONS_CONFIG).map(
                      ([key, config]) => (
                        <option key={key} value={key}>
                          {config.name} ({config.totalBooks} books)
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 size-4 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search books..."
                    className="w-full rounded-xl border border-black/10 bg-white pl-9 pr-3 py-1.5 text-[12.5px] text-black placeholder-neutral-400 focus:outline-hidden dark:border-white/12 dark:bg-[#1C1D22] dark:text-white"
                  />
                </div>
              </div>

              {/* Bulk Select Actions */}
              <div className="flex items-center justify-between border-y border-black/6 py-2.5 dark:border-white/8">
                <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
                  {selectedBookIds.length} of {canonBooks.length} books selected
                  ({totalSelectedChapters} chapters)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-[11.5px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-neutral-300 dark:text-neutral-700">
                    •
                  </span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-[11.5px] font-medium text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Grouped Book Sections */}
              <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-1">
                {filteredGroupSections.map((sec) => {
                  const allSectionSelected = sec.books.every((b) =>
                    selectedBookIdSet.has(b.id)
                  );
                  return (
                    <div
                      key={sec.id}
                      className="rounded-2xl border border-black/6 bg-white/60 p-3.5 dark:border-white/8 dark:bg-white/3"
                    >
                      <div className="mb-2.5 flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-black dark:text-white">
                          {sec.title} ({sec.books.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSection(sec.books)}
                          className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white cursor-pointer"
                        >
                          {allSectionSelected
                            ? "Deselect section"
                            : "Select section"}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {sec.books.map((b) => {
                          const isSelected = selectedBookIdSet.has(b.id);
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => toggleBook(b.id)}
                              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11.5px] font-medium transition-all cursor-pointer ${
                                isSelected
                                  ? "border border-black/30 bg-black text-white shadow-2xs dark:border-white/30 dark:bg-white dark:text-black"
                                  : "border border-black/6 bg-white text-neutral-600 hover:border-black/15 hover:bg-neutral-100 dark:border-white/8 dark:bg-white/5 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
                              }`}
                            >
                              <span>{b.name}</span>
                              <span className="text-[10px] opacity-70">
                                {b.chapters}
                              </span>
                              {isSelected && <Check className="size-3" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: ORDER & SESSIONS */}
          {currentStep === "order" && (
            <div className="flex-1 min-h-0 flex flex-col space-y-3">
              {/* Mode Switcher */}
              <div className="shrink-0 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-black/6 pb-2.5 dark:border-white/8">
                <div>
                  <span className="text-[13px] font-semibold text-black dark:text-white">
                    Choose Sequencing Mode
                  </span>
                  <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400">
                    Order entire books sequentially or hand-build custom reading
                    sessions.
                  </p>
                </div>

                <div className="flex items-center rounded-xl bg-black/4 p-1 dark:bg-white/6 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSequenceMode("book")}
                    data-testid="order-mode-book-btn"
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all cursor-pointer ${
                      sequenceMode === "book"
                        ? "bg-white text-black shadow-2xs dark:bg-black/40 dark:text-white font-semibold"
                        : "text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white"
                    }`}
                  >
                    <Layers className="size-3.5" />
                    <span>Order by Book</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSequenceMode("chapter");
                      if (!selectedBookForChapters && orderedBookIds[0]) {
                        setSelectedBookForChapters(orderedBookIds[0]);
                      }
                    }}
                    data-testid="order-mode-chapter-btn"
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all cursor-pointer ${
                      sequenceMode === "chapter"
                        ? "bg-white text-black shadow-2xs dark:bg-black/40 dark:text-white font-semibold"
                        : "text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white"
                    }`}
                  >
                    <ListOrdered className="size-3.5" />
                    <span>Build Sessions</span>
                  </button>
                </div>
              </div>

              {/* MODE A: ORDER BY BOOK */}
              {sequenceMode === "book" && (
                <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-3.5">
                  {/* Left Column: Book Sequence (7 cols) */}
                  <div className="md:col-span-7 flex flex-col h-full min-h-0 rounded-2xl border border-black/8 bg-white/60 p-4 dark:border-white/8 dark:bg-white/3">
                    <div className="shrink-0 mb-2.5 flex items-center justify-between">
                      <div>
                        <span className="text-[12.5px] font-semibold text-black dark:text-white">
                          1. Book Sequence ({orderedBookIds.length} Books)
                        </span>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Reorder books to customize reading flow.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOrderedBookIds([...selectedBookIds])}
                        className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white cursor-pointer"
                      >
                        <RotateCcw className="size-3" />
                        <span>Reset Order</span>
                      </button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
                      {orderedBookIds.map((id, index) => {
                        const b = BIBLE_BOOK_MAP[id];
                        return (
                          <div
                            key={id}
                            className="flex items-center justify-between rounded-xl border border-black/6 bg-white px-3 py-2 text-[12px] shadow-2xs dark:border-white/8 dark:bg-white/5"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <span className="size-5 rounded-full bg-black/5 text-center text-[10px] font-semibold leading-5 text-neutral-600 dark:bg-white/10 dark:text-neutral-300 shrink-0">
                                {index + 1}
                              </span>
                              <span className="font-medium text-black dark:text-white truncate">
                                {b?.name || id}
                              </span>
                              <span className="text-[11px] text-neutral-400 shrink-0">
                                ({b?.chapters || 0} ch)
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  moveBook({ index, direction: "up" })
                                }
                                disabled={index === 0}
                                className="rounded-lg p-1.5 text-neutral-400 hover:bg-black/5 hover:text-black disabled:opacity-30 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer disabled:cursor-not-allowed"
                                title="Move up"
                              >
                                <MoveUp className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  moveBook({ index, direction: "down" })
                                }
                                disabled={index === orderedBookIds.length - 1}
                                className="rounded-lg p-1.5 text-neutral-400 hover:bg-black/5 hover:text-black disabled:opacity-30 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer disabled:cursor-not-allowed"
                                title="Move down"
                              >
                                <MoveDown className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Daily Target & Pacing Settings (5 cols) */}
                  <div className="md:col-span-5 flex flex-col h-full min-h-0 rounded-2xl border border-black/8 bg-white/60 p-4 dark:border-white/8 dark:bg-white/3 overflow-y-auto space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[12.5px] font-semibold text-black dark:text-white">
                          2. Daily Reading Target
                        </span>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          How many chapters should be read per day?
                        </p>
                      </div>
                      {orderedBookIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsPreviewOpen(true)}
                          data-testid="preview-book-schedule-btn"
                          className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-[11px] font-medium text-black shadow-2xs hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 cursor-pointer"
                          title="Preview uneditable curriculum list"
                        >
                          <Eye className="size-3 text-zinc-500 dark:text-zinc-400" />
                          <span>Preview</span>
                        </button>
                      )}
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-5 gap-1.5">
                        {[1, 2, 3, 4, 5].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setDailyTarget(amt)}
                            data-testid={`daily-target-preset-${amt}`}
                            className={`flex flex-col items-center justify-center rounded-xl py-2 px-1 text-center transition-all cursor-pointer ${
                              dailyTarget === amt
                                ? "border border-black/30 bg-black text-white shadow-2xs dark:border-white/30 dark:bg-white dark:text-black font-semibold"
                                : "border border-black/6 bg-white text-neutral-700 hover:border-black/15 hover:bg-neutral-50 dark:border-white/8 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10"
                            }`}
                          >
                            <span className="text-[13px] font-bold">{amt}</span>
                            <span className="text-[9.5px] opacity-70">
                              ch / day
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Custom Input */}
                      <div className="flex items-center justify-between rounded-xl border border-black/6 bg-white p-2.5 dark:border-white/8 dark:bg-white/5">
                        <span className="text-[11.5px] text-neutral-600 dark:text-neutral-400">
                          Or custom chapters / day:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={dailyTarget}
                            data-testid="daily-target-input"
                            onChange={(e) =>
                              setDailyTarget(
                                Math.max(1, parseInt(e.target.value || "1", 10))
                              )
                            }
                            className="w-14 rounded-lg border border-black/10 bg-neutral-50 px-2 py-1 text-center text-[12.5px] font-bold text-black focus:outline-hidden dark:border-white/12 dark:bg-[#1C1D22] dark:text-white"
                          />
                          <span className="text-[11px] text-neutral-500">
                            ch
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Projected Duration Banner */}
                    <div className="rounded-xl bg-black/3 p-3 dark:bg-white/4 border border-black/5 dark:border-white/6 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-zinc-500 dark:text-zinc-400" />
                        <div>
                          <span className="block text-[11px] font-medium text-black dark:text-white">
                            Estimated Duration
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            {totalPlanChapters} chapters total
                          </span>
                        </div>
                      </div>
                      <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">
                        ~
                        {Math.max(
                          1,
                          Math.ceil(
                            totalPlanChapters / Math.max(1, dailyTarget)
                          )
                        )}{" "}
                        Days
                      </span>
                    </div>

                    {/* Schedule Enforcement Mode */}
                    <div className="space-y-2 pt-2 border-t border-black/6 dark:border-white/8">
                      <div>
                        <span className="text-[12.5px] font-semibold text-black dark:text-white">
                          3. Schedule Enforcement
                        </span>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Lock daily pace or allow subscribers to customize
                          speed.
                        </p>
                      </div>

                      <div className="space-y-2">
                        {/* Option: Locked */}
                        <button
                          type="button"
                          onClick={() => setPacingStyle("locked_curated")}
                          data-testid="pacing-style-locked-btn"
                          className={`flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                            pacingStyle === "locked_curated"
                              ? "border-black/30 bg-black/4 shadow-2xs dark:border-white/30 dark:bg-white/8"
                              : "border-black/6 bg-white hover:bg-neutral-50 dark:border-white/8 dark:bg-white/4 dark:hover:bg-white/6"
                          }`}
                        >
                          <Lock className="size-4 shrink-0 mt-0.5 text-zinc-700 dark:text-zinc-300" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] font-semibold text-black dark:text-white">
                                Fixed Daily Pace (Locked)
                              </span>
                              <span className="rounded bg-black/5 px-1.5 py-0.2 text-[9.5px] font-medium text-neutral-600 dark:bg-white/8 dark:text-neutral-300">
                                Recommended
                              </span>
                            </div>
                            <p className="mt-0.5 text-[10.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                              Subscribers read exactly {dailyTarget} chapters
                              each day. Pacing is locked.
                            </p>
                          </div>
                        </button>

                        {/* Option: Flexible */}
                        <button
                          type="button"
                          onClick={() => setPacingStyle("flexible")}
                          data-testid="pacing-style-flexible-btn"
                          className={`flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                            pacingStyle === "flexible"
                              ? "border-black/30 bg-black/4 shadow-2xs dark:border-white/30 dark:bg-white/8"
                              : "border-black/6 bg-white hover:bg-neutral-50 dark:border-white/8 dark:bg-white/4 dark:hover:bg-white/6"
                          }`}
                        >
                          <Unlock className="size-4 shrink-0 mt-0.5 text-zinc-700 dark:text-zinc-300" />
                          <div className="flex-1 min-w-0">
                            <span className="text-[12px] font-semibold text-black dark:text-white">
                              Flexible Pace
                            </span>
                            <p className="mt-0.5 text-[10.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                              Subscribers can adjust their daily chapter speed
                              or switch to self-paced mode.
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODE B: ORDER BY CHAPTER & EXPANDED 3-COLUMN SESSIONS BUILDER */}
              {sequenceMode === "chapter" && (
                <div className="flex-1 min-h-0 flex flex-col space-y-2.5">
                  {/* Mobile Column Switcher (only on screens < md) */}
                  <div className="shrink-0 flex md:hidden items-center rounded-xl bg-black/4 p-1 dark:bg-white/6 gap-1">
                    <button
                      type="button"
                      onClick={() => setMobileChapterTab("books")}
                      data-testid="mobile-tab-books"
                      className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-all cursor-pointer ${
                        mobileChapterTab === "books"
                          ? "bg-white text-black shadow-2xs dark:bg-black/40 dark:text-white font-semibold"
                          : "text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
                      }`}
                    >
                      <span>1. Books ({orderedBookIds.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileChapterTab("chapters")}
                      data-testid="mobile-tab-chapters"
                      className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-all cursor-pointer ${
                        mobileChapterTab === "chapters"
                          ? "bg-white text-black shadow-2xs dark:bg-black/40 dark:text-white font-semibold"
                          : "text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
                      }`}
                    >
                      <span className="truncate">
                        2. {activeBookForChapters?.name || "Chapters"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileChapterTab("order")}
                      data-testid="mobile-tab-order"
                      className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-all cursor-pointer ${
                        mobileChapterTab === "order"
                          ? "bg-white text-black shadow-2xs dark:bg-black/40 dark:text-white font-semibold"
                          : "text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
                      }`}
                    >
                      <span>3. Sessions ({curatedSessionsView.length})</span>
                    </button>
                  </div>

                  {/* Expanded 3-Column Layout: Fills remaining height, each column scrolls independently */}
                  <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-3.5">
                    {/* COLUMN 1: BOOK (3 cols) */}
                    <div
                      className={`${
                        mobileChapterTab === "books" ? "flex" : "hidden"
                      } md:flex md:col-span-3 flex-col h-full min-h-0 rounded-2xl border border-black/8 bg-white/60 p-3.5 dark:border-white/8 dark:bg-white/3`}
                    >
                      <div className="shrink-0 mb-2 flex items-center justify-between border-b border-black/5 pb-2 dark:border-white/6">
                        <span className="text-[12px] font-semibold text-black dark:text-white">
                          1. Books ({orderedBookIds.length})
                        </span>
                      </div>

                      <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1">
                        {orderedBookIds.map((id) => {
                          const b = BIBLE_BOOK_MAP[id];
                          const isSelected = selectedBookForChapters === id;
                          const scheduledCount = chapterSequence.filter(
                            (c) => c.bookId === id
                          ).length;
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => {
                                setSelectedBookForChapters(id);
                                setMobileChapterTab("chapters");
                              }}
                              data-testid={`select-book-for-chapters-${id}`}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[12.5px] transition-all cursor-pointer ${
                                isSelected
                                  ? "border border-black/30 bg-black text-white font-semibold shadow-2xs dark:border-white/30 dark:bg-white dark:text-black"
                                  : "border border-transparent bg-white hover:border-black/10 dark:bg-white/5 dark:hover:border-white/10 text-neutral-700 dark:text-neutral-300"
                              }`}
                            >
                              <span className="truncate">{b?.name || id}</span>
                              <div className="flex items-center gap-1.5 shrink-0 text-[10.5px]">
                                <span
                                  className={
                                    isSelected
                                      ? "text-white/70 dark:text-black/70"
                                      : "text-neutral-400"
                                  }
                                >
                                  {b?.chapters} ch
                                </span>
                                {scheduledCount > 0 && (
                                  <span
                                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-semibold ${
                                      isSelected
                                        ? "bg-white/20 text-white dark:bg-black/20 dark:text-black"
                                        : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                                    }`}
                                  >
                                    {scheduledCount}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* COLUMN 2: CHAPTERS (4 cols with room for spacious 5-column grid) */}
                    <div
                      className={`${
                        mobileChapterTab === "chapters" ? "flex" : "hidden"
                      } md:flex md:col-span-4 flex-col h-full min-h-0 rounded-2xl border border-black/8 bg-white/60 p-3.5 dark:border-white/8 dark:bg-white/3`}
                    >
                      <div className="shrink-0 mb-2 flex items-center justify-between border-b border-black/5 pb-2 dark:border-white/6">
                        <span className="text-[12px] font-semibold text-black dark:text-white truncate">
                          2. {activeBookForChapters?.name || "Chapters"} (
                          {activeBookForChapters?.chapters || 0})
                        </span>
                        {activeBookForChapters && (
                          <button
                            type="button"
                            onClick={() =>
                              addAllChaptersOfBook({
                                bookId: activeBookForChapters.id,
                              })
                            }
                            className="text-[10.5px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white cursor-pointer shrink-0"
                          >
                            + Add All
                          </button>
                        )}
                      </div>

                      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                        {activeBookForChapters ? (
                          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                            {Array.from(
                              { length: activeBookForChapters.chapters },
                              (_, i) => i + 1
                            ).map((ch) => {
                              const occurrences = chapterSequence.filter(
                                (c) =>
                                  c.bookId === activeBookForChapters.id &&
                                  c.chapter === ch
                              ).length;
                              return (
                                <button
                                  key={ch}
                                  type="button"
                                  onClick={() =>
                                    addChapterToSequence({
                                      bookId: activeBookForChapters.id,
                                      chapter: ch,
                                    })
                                  }
                                  data-testid={`add-chapter-${activeBookForChapters.id}-${ch}`}
                                  className={`relative flex h-11 flex-col items-center justify-center rounded-xl p-1 text-[11.5px] font-medium transition-all cursor-pointer ${
                                    occurrences > 0
                                      ? "border border-black/30 bg-black/6 text-black dark:border-white/30 dark:bg-white/10 dark:text-white"
                                      : "border border-black/6 bg-white text-neutral-700 hover:border-black/15 hover:bg-neutral-100 dark:border-white/8 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10"
                                  }`}
                                  title={`Click to add ${activeBookForChapters.name} ${ch} to active session`}
                                >
                                  <span className="leading-tight">{ch}</span>
                                  <span
                                    className={`text-[9px] font-mono leading-tight ${
                                      occurrences > 0
                                        ? "text-zinc-900 dark:text-zinc-100 font-semibold"
                                        : "invisible select-none"
                                    }`}
                                  >
                                    {occurrences > 0 ? `x${occurrences}` : "x0"}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="py-8 text-center text-[11.5px] text-neutral-400">
                            Select a book in Column 1
                          </p>
                        )}
                      </div>
                    </div>

                    {/* COLUMN 3: SESSIONS & ORDER (5 cols) - ONLY THIS LIST SCROLLS AS SESSIONS GROW */}
                    <div
                      className={`${
                        mobileChapterTab === "order" ? "flex" : "hidden"
                      } md:flex md:col-span-5 flex-col h-full min-h-0 rounded-2xl border border-black/8 bg-white/60 p-3.5 dark:border-white/8 dark:bg-white/3`}
                    >
                      <div className="shrink-0 mb-2.5 flex items-center justify-between gap-2 border-b border-black/5 pb-2 dark:border-white/6 min-h-[34px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[12px] font-semibold text-black dark:text-white whitespace-nowrap">
                            3. Sessions
                          </span>
                          <span className="rounded-md bg-black/5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-neutral-500 dark:bg-white/8 dark:text-neutral-400 whitespace-nowrap">
                            {curatedSessionsView.length}s ·{" "}
                            {chapterSequence.length}ch
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {chapterSequence.length === 0 &&
                            orderedBookIds.length > 0 && (
                              <button
                                type="button"
                                onClick={addAllChaptersOfAllSelectedBooks}
                                className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white cursor-pointer whitespace-nowrap"
                                title="Populate all chapters from selected books into Session 1"
                              >
                                Load All
                              </button>
                            )}

                          {/* Preview Uneditable List Button */}
                          {chapterSequence.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setIsPreviewOpen(true)}
                              data-testid="preview-sessions-btn"
                              className="inline-flex h-7 items-center gap-1 rounded-lg border border-black/10 bg-white px-2 text-[11px] font-medium text-black shadow-2xs hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 cursor-pointer whitespace-nowrap"
                              title="Preview uneditable curriculum list"
                            >
                              <Eye className="size-3 text-zinc-500 dark:text-zinc-400" />
                              <span>Preview</span>
                            </button>
                          )}

                          {/* Immediate New Session Creation Button */}
                          <button
                            type="button"
                            onClick={startNewSession}
                            className="inline-flex h-7 items-center gap-1 rounded-lg bg-black px-2.5 text-[11px] font-medium text-white shadow-2xs hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90 cursor-pointer whitespace-nowrap"
                            title="Create a new empty session"
                          >
                            <Plus className="size-3" />
                            <span>New Session</span>
                          </button>

                          {chapterSequence.length > 0 && (
                            <button
                              type="button"
                              onClick={clearChapterSequence}
                              className="text-[11px] font-medium text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 cursor-pointer whitespace-nowrap px-1 py-1"
                              title="Clear all sessions"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* INDEPENDENT VERTICAL SCROLLBAR FOR SESSIONS (AUTO-SCROLLS ON NEW ITEMS) */}
                      <div
                        ref={sessionsScrollRef}
                        className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 scroll-smooth"
                      >
                        {curatedSessionsView.map((session, sIdx) => {
                          const isActiveTarget = session.id === activeSessionId;
                          return (
                            <div
                              key={session.id}
                              onClick={() => setActiveSessionId(session.id)}
                              className={`rounded-2xl border transition-all p-3 space-y-2 cursor-pointer ${
                                isActiveTarget
                                  ? "border-black/30 bg-white shadow-2xs dark:border-white/30 dark:bg-white/8"
                                  : "border-black/6 bg-white/70 hover:bg-white dark:border-white/8 dark:bg-white/4 dark:hover:bg-white/6"
                              }`}
                            >
                              {/* Session Header */}
                              <div className="flex items-center justify-between border-b border-black/4 pb-1.5 text-[11.5px] dark:border-white/6">
                                <div className="flex items-center gap-2">
                                  <Calendar className="size-3.5 text-zinc-500 dark:text-zinc-400" />
                                  <span className="font-semibold text-black dark:text-white">
                                    Session {session.sessionIndex}
                                  </span>
                                  <span className="text-[10.5px] text-neutral-400 font-mono">
                                    ({session.chapters.length} ch)
                                  </span>
                                  {isActiveTarget && (
                                    <span className="rounded bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.2 text-[9.5px] font-semibold text-zinc-800 dark:text-zinc-200">
                                      Active
                                    </span>
                                  )}
                                </div>
                                {sIdx > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      mergeSessionWithPrevious(
                                        session.sessionIndex
                                      );
                                    }}
                                    className="text-[10.5px] text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer px-1 py-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10"
                                    title="Merge chapters into previous session"
                                  >
                                    Merge ↑
                                  </button>
                                )}
                              </div>

                              {/* Chapters in this Session OR Empty State Placeholder */}
                              {session.chapters.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-black/10 py-3.5 px-2 text-center text-neutral-400 space-y-1 dark:border-white/10">
                                  <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                                    Empty Session
                                  </p>
                                  <p className="text-[10.5px] text-neutral-400">
                                    Click chapters in Column 2 to populate
                                    Session {session.sessionIndex}.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {session.chapters.map(
                                    (item, idxInSession) => {
                                      const b = BIBLE_BOOK_MAP[item.bookId];
                                      const gIdx = item.globalIndex;
                                      return (
                                        <div
                                          key={`${item.bookId}_${item.chapter}_${gIdx}`}
                                        >
                                          <div
                                            data-testid={`scheduled-chapter-item-${gIdx}`}
                                            className="flex items-center justify-between rounded-xl border border-black/5 bg-white px-2.5 py-1.5 text-[11.5px] dark:border-white/6 dark:bg-white/5"
                                          >
                                            <div className="flex items-center gap-2 truncate mr-1">
                                              <span className="size-4.5 rounded-full bg-black/5 text-center text-[10px] font-semibold leading-4.5 text-neutral-600 dark:bg-white/10 dark:text-neutral-300 shrink-0">
                                                {gIdx + 1}
                                              </span>
                                              <span className="font-medium text-black dark:text-white truncate">
                                                {b?.name || item.bookId}{" "}
                                                {item.chapter}
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-0.5 shrink-0">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  moveChapterInSequence({
                                                    globalIndex: gIdx,
                                                    direction: "up",
                                                  });
                                                }}
                                                disabled={gIdx === 0}
                                                className="rounded p-1 text-neutral-400 hover:text-black disabled:opacity-20 dark:hover:text-white cursor-pointer disabled:cursor-not-allowed"
                                                title="Move up"
                                              >
                                                <MoveUp className="size-3" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  moveChapterInSequence({
                                                    globalIndex: gIdx,
                                                    direction: "down",
                                                  });
                                                }}
                                                disabled={
                                                  gIdx ===
                                                  chapterSequence.length - 1
                                                }
                                                className="rounded p-1 text-neutral-400 hover:text-black disabled:opacity-20 dark:hover:text-white cursor-pointer disabled:cursor-not-allowed"
                                                title="Move down"
                                              >
                                                <MoveDown className="size-3" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  removeChapterFromSequence({
                                                    sessionId: session.id,
                                                    chapterIndex: idxInSession,
                                                  });
                                                }}
                                                className="rounded p-1 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 cursor-pointer"
                                                title="Remove chapter"
                                              >
                                                <X className="size-3" />
                                              </button>
                                            </div>
                                          </div>

                                          {/* Inline Split Button between chapters */}
                                          {idxInSession <
                                            session.chapters.length - 1 && (
                                            <div className="flex justify-center my-0.5">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  splitSessionAtChapter(
                                                    session.id,
                                                    idxInSession
                                                  );
                                                }}
                                                className="group flex items-center gap-1 rounded px-2 py-0.5 text-[9.5px] text-neutral-400 hover:bg-black/5 hover:text-black dark:hover:text-white dark:hover:bg-white/8 cursor-pointer transition-all"
                                                title="Split into new session starting next chapter"
                                              >
                                                <Split className="size-2.5 opacity-60 group-hover:opacity-100" />
                                                <span>
                                                  + Split session here
                                                </span>
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: REVIEW & PACING */}
          {currentStep === "review" && (
            <div className="space-y-4">
              {/* Title & Description */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[12.5px] font-medium text-black dark:text-white mb-1">
                    Plan Title *
                  </label>
                  <input
                    type="text"
                    data-testid="custom-plan-title-input"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. My Gospels & Epistles Journey"
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[13px] text-black focus:outline-hidden dark:border-white/12 dark:bg-[#1C1D22] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-medium text-black dark:text-white mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    data-testid="custom-plan-desc-input"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Short description of this reading journey..."
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[13px] text-black focus:outline-hidden dark:border-white/12 dark:bg-[#1C1D22] dark:text-white"
                  />
                </div>
              </div>

              {/* For Book Mode: Read-Only Pacing Summary (Chosen in Step 2) */}
              {sequenceMode === "book" && (
                <div className="rounded-2xl border border-black/8 bg-white/60 p-5 dark:border-white/8 dark:bg-white/3 space-y-4">
                  <div className="flex items-center justify-between border-b border-black/6 pb-3 dark:border-white/8">
                    <div>
                      <h4 className="text-[13.5px] font-semibold text-black dark:text-white">
                        Plan Pacing Summary
                      </h4>
                      <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400">
                        Configured in Step 2 for Book Sequence
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep("order")}
                      className="text-[11.5px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white cursor-pointer"
                    >
                      Edit Pacing in Step 2
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                    <div className="rounded-xl bg-white p-3 dark:bg-white/5 border border-black/5 dark:border-white/6">
                      <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">
                        Total Scope
                      </span>
                      <span className="text-[14px] font-bold text-black dark:text-white">
                        {orderedBookIds.length} Books ({totalPlanChapters} ch)
                      </span>
                    </div>

                    <div className="rounded-xl bg-white p-3 dark:bg-white/5 border border-black/5 dark:border-white/6">
                      <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">
                        Daily Reading Target
                      </span>
                      <span className="text-[14px] font-bold text-black dark:text-white">
                        {dailyTarget} ch / day
                      </span>
                    </div>

                    <div className="rounded-xl bg-white p-3 dark:bg-white/5 border border-black/5 dark:border-white/6">
                      <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">
                        Schedule Mode
                      </span>
                      <span className="text-[12.5px] font-semibold text-black dark:text-white">
                        {pacingStyle === "locked_curated"
                          ? `Fixed Daily Pace (${dailyTarget} ch/day)`
                          : "Flexible Pace"}
                      </span>
                    </div>

                    <div className="rounded-xl bg-white p-3 dark:bg-white/5 border border-black/5 dark:border-white/6">
                      <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">
                        Projected Duration
                      </span>
                      <span className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100">
                        ~
                        {Math.max(
                          1,
                          Math.ceil(
                            totalPlanChapters / Math.max(1, dailyTarget)
                          )
                        )}{" "}
                        Days
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* For Build Sessions Mode: Choose Fixed vs Flexible */}
              {sequenceMode === "chapter" && (
                <div className="rounded-2xl border border-black/8 bg-white/60 p-5 dark:border-white/8 dark:bg-white/3 space-y-4">
                  <div>
                    <h4 className="text-[14px] font-semibold text-black dark:text-white">
                      Session Schedule Enforcement
                    </h4>
                    <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
                      Choose whether subscribers follow your exact curated
                      sessions or can configure their own pace.
                    </p>
                  </div>

                  {/* Option 1: Fixed Curated Sessions */}
                  <button
                    type="button"
                    onClick={() => setPacingStyle("locked_curated")}
                    data-testid="review-pacing-locked-btn"
                    className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer ${
                      pacingStyle === "locked_curated"
                        ? "border-black/30 bg-black/4 shadow-2xs dark:border-white/30 dark:bg-white/8"
                        : "border-black/8 bg-white hover:bg-neutral-50 dark:border-white/8 dark:bg-white/4 dark:hover:bg-white/6"
                    }`}
                  >
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                        pacingStyle === "locked_curated"
                          ? "bg-black text-white dark:bg-white dark:text-black"
                          : "bg-black/5 text-neutral-500 dark:bg-white/8 dark:text-neutral-300"
                      }`}
                    >
                      <Lock className="size-4.5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[13.5px] font-semibold text-black dark:text-white">
                          Fixed Sessions ({populatedSessions.length} Sessions
                          Built)
                        </span>
                        <span className="rounded bg-black/5 px-2 py-0.5 text-[10.5px] font-medium text-neutral-600 dark:bg-white/8 dark:text-neutral-300">
                          Recommended
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                        The {populatedSessions.length} sessions are already
                        built. Each session represents one locked reading day
                        that subscribers strictly follow.
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Flexible Pace */}
                  <button
                    type="button"
                    onClick={() => setPacingStyle("flexible")}
                    data-testid="review-pacing-flexible-btn"
                    className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer ${
                      pacingStyle === "flexible"
                        ? "border-black/30 bg-black/4 shadow-2xs dark:border-white/30 dark:bg-white/8"
                        : "border-black/8 bg-white hover:bg-neutral-50 dark:border-white/8 dark:bg-white/4 dark:hover:bg-white/6"
                    }`}
                  >
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                        pacingStyle === "flexible"
                          ? "bg-black text-white dark:bg-white dark:text-black"
                          : "bg-black/5 text-neutral-500 dark:bg-white/8 dark:text-neutral-300"
                      }`}
                    >
                      <Unlock className="size-4.5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[13.5px] font-semibold text-black dark:text-white">
                          Flexible Pace
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                        Subscribers can choose their own daily speed or read
                        self-paced.
                      </p>
                    </div>
                  </button>

                  {/* WARNING ALERT: When Flexible is selected in Build Sessions mode */}
                  {pacingStyle === "flexible" && (
                    <div
                      data-testid="flexible-session-warning"
                      className="rounded-xl border border-zinc-300 bg-zinc-100 p-3.5 text-[12px] text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 flex items-start gap-2.5"
                    >
                      <AlertTriangle className="size-4 shrink-0 mt-0.5 text-zinc-600 dark:text-zinc-400" />
                      <div className="space-y-1">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                          Session Distribution Warning
                        </p>
                        <p className="leading-relaxed opacity-95">
                          In Flexible mode, readings are distributed evenly
                          according to the reader&apos;s preferred daily speed
                          and will{" "}
                          <strong>
                            not respect the {populatedSessions.length} custom
                            session boundaries
                          </strong>{" "}
                          you created.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Flexible Pacing Inputs for Chapter Mode */}
                  {pacingStyle === "flexible" && (
                    <div className="flex items-center justify-between border-t border-black/6 pt-3 dark:border-white/6">
                      <div>
                        <span className="text-[12.5px] font-medium text-black dark:text-white">
                          Suggested Daily Target
                        </span>
                        <p className="text-[11px] text-neutral-500">
                          Default speed suggestion for flexible subscribers
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={dailyTarget}
                          onChange={(e) =>
                            setDailyTarget(
                              Math.max(1, parseInt(e.target.value || "1", 10))
                            )
                          }
                          className="w-16 rounded-xl border border-black/10 bg-white px-2 py-1 text-center text-[13px] font-bold text-black dark:border-white/12 dark:bg-[#1C1D22] dark:text-white"
                        />
                        <span className="text-[12px] text-neutral-500">
                          Ch / day
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Session Breakdown Tags for Fixed Curated Sessions */}
                  {pacingStyle === "locked_curated" &&
                    populatedSessions.length > 0 && (
                      <div className="rounded-xl bg-black/2.5 p-3.5 dark:bg-white/3">
                        <span className="block text-[11.5px] font-medium text-neutral-600 dark:text-neutral-300 mb-2">
                          Curated Schedule Breakdown:
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                          {populatedSessions.map((s, idx) => (
                            <span
                              key={s.id}
                              className="rounded-lg border border-black/6 bg-white px-2.5 py-1 text-[10.5px] text-neutral-700 dark:border-white/8 dark:bg-white/8 dark:text-neutral-300"
                            >
                              S{idx + 1}:{" "}
                              <strong>{s.chapters.length} ch</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Stats Overview */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 border-t border-black/6 pt-3.5 dark:border-white/6 text-center">
                    <div className="rounded-xl bg-white p-3 dark:bg-white/5 border border-black/5 dark:border-white/6">
                      <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">
                        Total Chapters
                      </span>
                      <span className="text-[16px] font-bold text-black dark:text-white">
                        {totalPlanChapters}
                      </span>
                    </div>
                    <div className="rounded-xl bg-white p-3 dark:bg-white/5 border border-black/5 dark:border-white/6">
                      <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">
                        {pacingStyle === "locked_curated"
                          ? "Curated Sessions"
                          : "Projected Duration"}
                      </span>
                      <span className="text-[16px] font-bold text-zinc-900 dark:text-zinc-100">
                        {pacingStyle === "locked_curated"
                          ? `${populatedSessions.length} Sessions`
                          : `~${Math.max(1, Math.ceil(totalPlanChapters / Math.max(1, dailyTarget)))} Days`}
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1 rounded-xl bg-white p-3 dark:bg-white/5 border border-black/5 dark:border-white/6">
                      <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">
                        Pacing Mode
                      </span>
                      <span className="text-[13px] font-semibold text-black dark:text-white">
                        {pacingStyle === "locked_curated"
                          ? "🔒 Locked Curated"
                          : "⚡ Flexible"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Curriculum & Reading Breakdown Preview (Uneditable) */}
              <div className="rounded-2xl border border-black/8 bg-white/60 p-5 dark:border-white/8 dark:bg-white/3 space-y-3">
                <div className="flex items-center justify-between border-b border-black/6 pb-2.5 dark:border-white/8">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4 text-zinc-500 dark:text-zinc-400" />
                    <div>
                      <h4 className="text-[13.5px] font-semibold text-black dark:text-white">
                        Curriculum & Reading Schedule Preview
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {previewPlanSessions.length}{" "}
                        {sequenceMode === "chapter"
                          ? "sessions"
                          : "daily assignments"}{" "}
                        · {totalPlanChapters} chapters total
                      </p>
                    </div>
                  </div>
                  <span className="rounded-md bg-black/4 px-2 py-0.5 text-[10.5px] font-medium text-neutral-600 dark:bg-white/8 dark:text-neutral-300">
                    Read-Only
                  </span>
                </div>

                {/* Scrollable uneditable session cards */}
                <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
                  {previewPlanSessions.length === 0 ? (
                    <p className="py-6 text-center text-[12px] text-neutral-400">
                      No chapters scheduled.
                    </p>
                  ) : (
                    previewPlanSessions.map((session) => (
                      <div
                        key={session.title}
                        className="rounded-xl border border-black/5 bg-white p-3 shadow-2xs dark:border-white/6 dark:bg-white/5 space-y-2"
                      >
                        <div className="flex items-center justify-between border-b border-black/4 pb-1.5 dark:border-white/6 text-[11.5px]">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3 text-zinc-500 dark:text-zinc-400" />
                            <span className="font-semibold text-black dark:text-white">
                              {session.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {session.chapters.length}{" "}
                            {session.chapters.length === 1
                              ? "chapter"
                              : "chapters"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {session.chapters.map((ch, idx) => (
                            <div
                              key={`${ch.bookId}_${ch.chapter}_${idx}`}
                              className="flex items-center gap-1.5 rounded-lg border border-black/6 bg-neutral-50/80 px-2.5 py-1 text-[11px] dark:border-white/8 dark:bg-white/6"
                            >
                              <span className="flex size-4 items-center justify-center rounded-full bg-black/5 text-[9px] font-mono text-neutral-500 dark:bg-white/10 dark:text-neutral-400">
                                {idx + 1}
                              </span>
                              <span className="font-medium text-black dark:text-white">
                                {BIBLE_BOOK_MAP[ch.bookId]?.name || ch.bookId}{" "}
                                {ch.chapter}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between border-t border-black/6 p-4 sm:p-5 dark:border-white/8 shrink-0 gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2.5">
            {currentStep !== "scope" && (
              <button
                type="button"
                onClick={() =>
                  setCurrentStep((prev) =>
                    prev === "review" ? "order" : "scope"
                  )
                }
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white/80 px-3.5 py-2 text-[12.5px] font-medium text-black shadow-2xs hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back</span>
              </button>
            )}

            <span className="text-[11.5px] sm:text-[12px] text-neutral-500 dark:text-neutral-400 truncate">
              {currentStep === "scope"
                ? `${selectedBookIds.length} books selected (${totalSelectedChapters} ch)`
                : currentStep === "order"
                  ? sequenceMode === "chapter"
                    ? `${chapterSequence.length} chapters scheduled (${populatedSessions.length} sessions)`
                    : `${orderedBookIds.length} books (${totalPlanChapters} ch) · ${dailyTarget} ch/day (~${Math.max(1, Math.ceil(totalPlanChapters / Math.max(1, dailyTarget)))} days)`
                  : `${totalPlanChapters} chapters planned (${pacingStyle === "locked_curated" ? (sequenceMode === "chapter" ? `${populatedSessions.length} sessions locked` : `${dailyTarget} ch/day locked`) : "flexible pace"})`}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            {currentStep === "scope" && (
              <button
                type="button"
                data-testid="wizard-next-step-order-btn"
                onClick={goToOrderStep}
                disabled={selectedBookIds.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-black px-4 py-2 text-[12.5px] font-medium text-white shadow-xs hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Next: Set Order</span>
                <ArrowRight className="size-3.5" />
              </button>
            )}

            {currentStep === "order" && (
              <button
                type="button"
                data-testid="wizard-next-step-review-btn"
                onClick={goToReviewStep}
                disabled={
                  sequenceMode === "chapter"
                    ? chapterSequence.length === 0
                    : orderedBookIds.length === 0
                }
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-black px-4 py-2 text-[12.5px] font-medium text-white shadow-xs hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Next: Review & Pacing</span>
                <ArrowRight className="size-3.5" />
              </button>
            )}

            {currentStep === "review" && (
              <div className="flex w-full sm:w-auto items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSavePlan({ shouldStart: false })}
                  disabled={isPending}
                  data-testid="save-custom-plan-catalog-btn"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-white/80 px-3.5 py-2 text-[12px] sm:text-[12.5px] font-medium text-black shadow-2xs hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Loader2 className="size-3.5 animate-spin" />}
                  <span className="truncate">Save to Catalog</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSavePlan({ shouldStart: true })}
                  disabled={isPending}
                  data-testid="save-custom-plan-start-btn"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-black px-4 py-2 text-[12px] sm:text-[12.5px] font-medium text-white shadow-xs hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90 disabled:opacity-50 cursor-pointer"
                >
                  {isPending && <Loader2 className="size-3.5 animate-spin" />}
                  <span className="truncate">Save & Start</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Read-Only Plan Curriculum Preview Dialog */}
      {isPreviewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-curriculum-title"
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsPreviewOpen(false)}
          />
          <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-2xl dark:border-white/12 dark:bg-[#18191E]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/6 px-5 py-3.5 dark:border-white/8 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-zinc-500 dark:text-zinc-400" />
                <div>
                  <h3
                    id="preview-curriculum-title"
                    className="text-[15px] font-semibold text-black dark:text-white"
                  >
                    Curriculum & Schedule Preview
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {previewPlanSessions.length}{" "}
                    {sequenceMode === "chapter"
                      ? "sessions"
                      : "daily assignments"}{" "}
                    · {totalPlanChapters} chapters total
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="flex size-8 items-center justify-center rounded-full border border-black/8 bg-white text-neutral-500 hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-neutral-400 dark:hover:text-white cursor-pointer"
                aria-label="Close preview"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-3">
              {previewPlanSessions.length === 0 ? (
                <p className="py-12 text-center text-[12.5px] text-neutral-400">
                  No chapters scheduled yet. Add chapters in Step 2 to preview.
                </p>
              ) : (
                previewPlanSessions.map((session) => (
                  <div
                    key={session.title}
                    className="rounded-2xl border border-black/6 bg-white/70 p-4 shadow-2xs backdrop-blur-md dark:border-white/8 dark:bg-white/3 space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-black/4 pb-2 dark:border-white/6 text-[12px]">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3.5 text-zinc-500 dark:text-zinc-400" />
                        <span className="font-semibold text-black dark:text-white">
                          {session.title}
                        </span>
                      </div>
                      <span className="rounded-md bg-black/4 px-2 py-0.5 text-[10.5px] font-medium text-neutral-600 dark:bg-white/8 dark:text-neutral-300">
                        {session.chapters.length}{" "}
                        {session.chapters.length === 1 ? "chapter" : "chapters"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {session.chapters.map((ch, idx) => (
                        <div
                          key={`${ch.bookId}_${ch.chapter}_${idx}`}
                          className="flex items-center gap-1.5 rounded-xl border border-black/6 bg-neutral-50/80 px-2.5 py-1 text-[11.5px] dark:border-white/8 dark:bg-white/6"
                        >
                          <span className="flex size-4.5 items-center justify-center rounded-full bg-black/5 text-[9.5px] font-mono text-neutral-500 dark:bg-white/10 dark:text-neutral-400">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-black dark:text-white">
                            {BIBLE_BOOK_MAP[ch.bookId]?.name || ch.bookId}{" "}
                            {ch.chapter}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-black/6 px-5 py-3 dark:border-white/8 shrink-0">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="rounded-xl border border-black/10 bg-white px-4 py-1.5 text-[12px] font-medium text-black shadow-2xs hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function handleSelectCanonChange(newCanon: BibleCanon) {
    handleCanonChange(newCanon);
  }
}
