"use client";

import { useState, useTransition } from "react";
import {
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
} from "lucide-react";
import type { ReadingPlanTemplate } from "@/data/readingPlans";
import {
  parseCsvText,
  validateAndBuildPlanTemplate,
  getSamplePlanCsvTemplate,
  getSamplePlanJsonTemplate,
  type PlanValidationResult,
} from "@/lib/plans/plan-import-parser";
import { createCustomPlanTemplateAction } from "@/actions/plans";

export type ImportPlanModalProps = {
  isOpen: boolean;
  onCloseAction: () => void;
  onPlanImportedAction: (plan: ReadingPlanTemplate) => void;
  onPlanImportedAndStartAction?: (plan: ReadingPlanTemplate) => void;
};

type ImportSourceTab = "paste" | "upload";

export function ImportPlanModal({
  isOpen,
  onCloseAction,
  onPlanImportedAction,
  onPlanImportedAndStartAction,
}: ImportPlanModalProps) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<ImportSourceTab>("paste");
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  // Overrides
  const [planTitle, setPlanTitle] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const allowCustomPace = true;

  // Validate raw text directly (optimized via React Compiler)
  let validationResult: PlanValidationResult;
  if (!rawText.trim()) {
    validationResult = {
      isValid: false,
      errors: [],
      warnings: [],
      template: null,
      dayReadings: new Map(),
      summary: { totalDays: 0, totalReadings: 0, uniqueBooks: 0, tracks: [] },
    };
  } else {
    const trimmed = rawText.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const jsonData = JSON.parse(trimmed);
        validationResult = validateAndBuildPlanTemplate({
          title: planTitle,
          description: planDescription,
          jsonData,
          allowCustomPace,
          allowSelfPaced: allowCustomPace,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Invalid JSON syntax";
        validationResult = {
          isValid: false,
          errors: [`JSON syntax error: ${msg}`],
          warnings: [],
          template: null,
          dayReadings: new Map(),
          summary: {
            totalDays: 0,
            totalReadings: 0,
            uniqueBooks: 0,
            tracks: [],
          },
        };
      }
    } else {
      const rows = parseCsvText({ csvText: rawText });
      validationResult = validateAndBuildPlanTemplate({
        title: planTitle,
        description: planDescription,
        rows,
        allowCustomPace,
        allowSelfPaced: allowCustomPace,
      });
    }
  }

  // Load sample templates
  const handleLoadSampleCsv = () => {
    setRawText(getSamplePlanCsvTemplate());
    setFileName("sample-multi-track.csv");
    setPlanTitle("3-Day Multi-Track Journey");
    setPlanDescription("Daily readings across Law, Gospels, and Wisdom.");
    setActionError(null);
  };

  const handleLoadSampleJson = () => {
    setRawText(getSamplePlanJsonTemplate());
    setFileName("sample-gospels-wisdom.json");
    setPlanTitle("Gospels & Wisdom 3-Day Journey");
    setPlanDescription("Read the Gospel of John alongside Proverbs each day.");
    setActionError(null);
  };

  const handleClear = () => {
    setRawText("");
    setFileName(null);
    setPlanTitle("");
    setPlanDescription("");
    setActionError(null);
  };

  // Handle file drop or input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setRawText(content);
        setActionError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveImportedPlan = ({
    shouldStart = false,
  }: {
    shouldStart?: boolean;
  }) => {
    if (!validationResult.isValid || !validationResult.template) return;
    setActionError(null);

    const tmpl = validationResult.template;
    const finalDailyTarget = tmpl.defaultDailyTarget;

    startTransition(async () => {
      const res = await createCustomPlanTemplateAction({
        template: {
          id: tmpl.id,
          title: planTitle.trim() || tmpl.title,
          subtitle: tmpl.subtitle,
          description: planDescription.trim() || tmpl.description,
          category: tmpl.category,
          icon: tmpl.icon,
          accentColor: tmpl.accentColor,
          totalChapters: tmpl.totalChapters,
          defaultDailyTarget: finalDailyTarget,
          targetDays: tmpl.recommendedDays,
          canonCompatibility: tmpl.canonCompatibility ?? null,
          allowCustomPace,
          allowSelfPaced: allowCustomPace,
          sections: tmpl.sections.map((s) => ({
            title: s.title,
            subtitle: s.subtitle,
            chaptersCount: s.chaptersCount,
            booksDescription: s.booksDescription,
          })),
          readings: tmpl.readings.map((r, idx) => ({
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
            dayNumber: r.dayNumber,
            order: r.order ?? idx + 1,
          })),
        },
      });

      if (!res.success) {
        setActionError(res.error);
        return;
      }

      onPlanImportedAction(res.template);
      if (shouldStart && onPlanImportedAndStartAction) {
        onPlanImportedAndStartAction(res.template);
      }
      onCloseAction();
    });
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-plan-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={() => {
          if (!isPending) onCloseAction();
        }}
      />

      {/* Modal Dialog Content */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-2xl dark:border-white/12 dark:bg-[#15161A]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-black/6 px-6 py-4.5 dark:border-white/8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#82ADD4]">
                Reading Plan Import
              </span>
              <span className="rounded-md bg-[#DDFD2C] px-2 py-0.5 text-[10.5px] font-medium text-black">
                File / CSV / JSON
              </span>
            </div>
            <h2
              id="import-plan-title"
              className="mt-1 text-[18px] font-medium tracking-tight text-black dark:text-white"
            >
              Import Reading Plan
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

        {/* Source Tabs & Sample Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/6 bg-neutral-50/50 px-6 py-2.5 dark:border-white/6 dark:bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("paste")}
              className={`rounded-xl px-3 py-1 text-[12px] font-medium transition-all cursor-pointer ${
                activeTab === "paste"
                  ? "bg-white text-black shadow-2xs dark:bg-white/15 dark:text-white"
                  : "text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              Paste Text
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`rounded-xl px-3 py-1 text-[12px] font-medium transition-all cursor-pointer ${
                activeTab === "upload"
                  ? "bg-white text-black shadow-2xs dark:bg-white/15 dark:text-white"
                  : "text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              Upload File
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              data-testid="import-load-sample-csv-btn"
              onClick={handleLoadSampleCsv}
              className="rounded-xl border border-black/8 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10 cursor-pointer"
            >
              Load Sample CSV
            </button>
            <button
              type="button"
              data-testid="import-load-sample-json-btn"
              onClick={handleLoadSampleJson}
              className="rounded-xl border border-black/8 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10 cursor-pointer"
            >
              Load Sample JSON
            </button>
            {rawText && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-xl p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                title="Clear input"
              >
                <RotateCcw className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 min-h-0 space-y-4">
          {actionError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[12.5px] text-red-600 dark:text-red-400">
              {actionError}
            </div>
          )}

          {/* Tab 1: Upload File */}
          {activeTab === "upload" && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black/10 p-6 text-center dark:border-white/10">
              <input
                type="file"
                accept=".csv,.tsv,.json,.txt"
                onChange={handleFileUpload}
                id="plan-file-input"
                className="hidden"
              />
              <label
                htmlFor="plan-file-input"
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                <div className="flex size-12 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-300">
                  <Upload className="size-6" />
                </div>
                <span className="text-[13.5px] font-medium text-black dark:text-white">
                  {fileName ? fileName : "Click to select CSV or JSON file"}
                </span>
                <span className="text-[11.5px] text-neutral-400">
                  Supports comma/tab/semicolon delimited CSV, or structured JSON
                </span>
              </label>
            </div>
          )}

          {/* Tab 2: Paste Raw Text */}
          {activeTab === "paste" && (
            <div>
              <label className="block text-[12.5px] font-medium text-black dark:text-white mb-1">
                CSV or JSON Content
              </label>
              <textarea
                rows={6}
                data-testid="import-plan-raw-textarea"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Day,Book,Chapter,Verses,Track&#10;1,Genesis,1,,Law&#10;1,Matthew,1,,Gospels&#10;2,Genesis,2,,Law"
                className="w-full font-mono rounded-xl border border-black/10 bg-white p-3 text-[12px] text-black focus:outline-hidden dark:border-white/12 dark:bg-white/5 dark:text-white"
              />
            </div>
          )}

          {/* Real-time Validation Status Card */}
          {rawText.trim() && (
            <div className="space-y-3">
              {validationResult.isValid ? (
                <div
                  data-testid="import-validation-status-valid"
                  className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 dark:border-emerald-500/25 dark:bg-emerald-500/15"
                >
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 mb-2">
                    <CheckCircle2 className="size-4.5" />
                    <span className="text-[13.5px] font-semibold">
                      Valid Plan Structure Detected
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-center">
                    <div className="rounded-xl bg-white/70 p-2 dark:bg-black/20">
                      <span className="block text-[10.5px] text-neutral-500 dark:text-neutral-400">
                        Total Days
                      </span>
                      <span
                        data-testid="import-summary-total-days"
                        className="text-[14px] font-bold text-black dark:text-white"
                      >
                        {validationResult.summary.totalDays}
                      </span>
                    </div>
                    <div className="rounded-xl bg-white/70 p-2 dark:bg-black/20">
                      <span className="block text-[10.5px] text-neutral-500 dark:text-neutral-400">
                        Total Readings
                      </span>
                      <span
                        data-testid="import-summary-total-readings"
                        className="text-[14px] font-bold text-black dark:text-white"
                      >
                        {validationResult.summary.totalReadings}
                      </span>
                    </div>
                    <div className="rounded-xl bg-white/70 p-2 dark:bg-black/20">
                      <span className="block text-[10.5px] text-neutral-500 dark:text-neutral-400">
                        Unique Books
                      </span>
                      <span
                        data-testid="import-summary-unique-books"
                        className="text-[14px] font-bold text-black dark:text-white"
                      >
                        {validationResult.summary.uniqueBooks}
                      </span>
                    </div>
                    <div className="rounded-xl bg-white/70 p-2 dark:bg-black/20">
                      <span className="block text-[10.5px] text-neutral-500 dark:text-neutral-400">
                        Tracks
                      </span>
                      <span
                        data-testid="import-summary-tracks"
                        className="text-[14px] font-bold text-black dark:text-white"
                      >
                        {validationResult.summary.tracks.length}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  data-testid="import-validation-status-invalid"
                  className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 dark:border-red-500/25 dark:bg-red-500/15"
                >
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300 mb-2">
                    <AlertCircle className="size-4.5" />
                    <span className="text-[13.5px] font-semibold">
                      Validation Errors Found ({validationResult.errors.length})
                    </span>
                  </div>
                  <ul className="max-h-32 overflow-y-auto space-y-1 text-[11.5px] text-red-600 dark:text-red-400 pr-1">
                    {validationResult.errors.map((err, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="font-bold">•</span>
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Title & Description Override Form */}
              {validationResult.isValid && (
                <div className="rounded-2xl border border-black/8 bg-neutral-50/60 p-4 dark:border-white/8 dark:bg-white/[0.02] space-y-3">
                  <div>
                    <label className="block text-[12px] font-medium text-black dark:text-white mb-1">
                      Plan Title
                    </label>
                    <input
                      type="text"
                      value={planTitle}
                      onChange={(e) => setPlanTitle(e.target.value)}
                      placeholder={
                        validationResult.template?.title || "Imported Plan"
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-1.5 text-[12.5px] text-black focus:outline-hidden dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-black dark:text-white mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={planDescription}
                      onChange={(e) => setPlanDescription(e.target.value)}
                      placeholder={
                        validationResult.template?.description || "Description"
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-1.5 text-[12.5px] text-black focus:outline-hidden dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between border-t border-black/6 p-3.5 sm:p-5 dark:border-white/8 shrink-0 gap-3">
          <button
            type="button"
            onClick={onCloseAction}
            disabled={isPending}
            className="rounded-xl border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-medium text-black shadow-2xs hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 cursor-pointer disabled:opacity-50 text-center"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSaveImportedPlan({ shouldStart: false })}
              disabled={isPending || !validationResult.isValid}
              data-testid="save-imported-plan-catalog-btn"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 sm:px-3.5 py-2 text-[12px] sm:text-[12.5px] font-medium text-black shadow-2xs hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              <span className="truncate">Save to Catalog</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveImportedPlan({ shouldStart: true })}
              disabled={isPending || !validationResult.isValid}
              data-testid="save-imported-plan-start-btn"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-black px-3 sm:px-4 py-2 text-[12px] sm:text-[12.5px] font-medium text-white shadow-xs hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              <span className="truncate">Save & Start</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
