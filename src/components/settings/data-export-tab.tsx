"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Upload,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  Database,
  Layers,
  BookOpen,
  FolderGit2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  exportUserDataAction,
  importUserDataAction,
} from "@/actions/data-export";

export function DataExportTab() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImportPending, startImportTransition] = useTransition();

  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(
    null
  );

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const res = await exportUserDataAction();
      if (!res.success) {
        toast.error(res.error);
        return;
      }

      const jsonStr = JSON.stringify(res.data);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().split("T")[0] ?? "backup";
      const filename = `scripture-tracker-backup-${today}.json`;

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Backup downloaded successfully", {
        description: `${res.data.trackers.length} trackers, ${res.data.notes?.length ?? 0} notes, and ${res.data.logs?.length ?? 0} reading logs saved.`,
      });
    } catch {
      toast.error("Failed to download data backup.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Please select a valid .json backup file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSelectedFileName(file.name);
      setSelectedFileContent(content);
    };
    reader.onerror = () => {
      toast.error("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const handleClearSelectedFile = () => {
    setSelectedFileName(null);
    setSelectedFileContent(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImport = () => {
    if (!selectedFileContent) {
      toast.error("Please choose a backup file first.");
      return;
    }

    startImportTransition(async () => {
      const res = await importUserDataAction({
        jsonString: selectedFileContent,
      });

      if (!res.success) {
        toast.error("Import failed", {
          description: res.error,
        });
        return;
      }

      toast.success("Data merged successfully!", {
        description: `Imported ${res.counts.chapters} chapters, ${res.counts.notes} notes, and ${res.counts.logs} reading logs. Streaks recalibrated.`,
      });

      handleClearSelectedFile();
      router.refresh();
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* ── Section 1: Export Data ── */}
      <section className="ui-card p-4 sm:p-6 lg:p-7 space-y-5">
        <div className="flex flex-col gap-2 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Download className="size-4 text-primary" />
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Export Your Study Data
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Download an offline JSON archive of your reading progress, notes,
              study plans, and reading history.
            </p>
          </div>

          <Button
            type="button"
            variant="default"
            size="sm"
            isLoading={isExporting}
            leftIcon={<Download className="size-3.5" />}
            onClick={handleDownload}
          >
            Download JSON Backup
          </Button>
        </div>

        {/* Content details cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-border/70 bg-surface-elevated space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <BookOpen className="size-3.5 text-primary" />
              <span>Trackers & Canon Progress</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              All personal reading trackers, custom canons, and complete
              chapter/verse checkboxes.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-border/70 bg-surface-elevated space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <FolderGit2 className="size-3.5 text-primary" />
              <span>Notes & Organized Folders</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Full formatted note bodies, folder hierarchy, pinned markers, and
              plan session references.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-border/70 bg-surface-elevated space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Layers className="size-3.5 text-primary" />
              <span>Plans, Logs & Milestones</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Active plan schedules, historical reading log timestamps, and
              unlocked achievements.
            </p>
          </div>
        </div>

        {/* Security and Anonymization Guarantee */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border/70 bg-muted/30 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold text-foreground">
              Privacy Protection:
            </span>{" "}
            Authentication credentials, email addresses, passwords, and internal
            database identifiers are strictly stripped from the backup file,
            ensuring your export remains portable and safe to move across
            accounts.
          </p>
        </div>
      </section>

      {/* ── Section 2: Restore & Merge Backup ── */}
      <section className="ui-card p-4 sm:p-6 lg:p-7 space-y-5">
        <div className="border-b border-border/60 pb-4 space-y-1">
          <div className="flex items-center gap-2">
            <Upload className="size-4 text-primary" />
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Restore & Merge Backup
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Upload a Scripture Tracker JSON backup to restore or merge your
            data. Existing trackers and notes with identical names are preserved
            without duplication.
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          {!selectedFileName ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group border-2 border-dashed border-border/80 hover:border-primary/60 rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-surface-elevated/40 hover:bg-surface-elevated/70"
            >
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Database className="size-5" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                Click to browse backup file
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Select a valid .json file generated from Scripture Tracker
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-border bg-surface-elevated space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <FileCheck2 className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground line-clamp-1">
                      {selectedFileName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Ready to validate and merge
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isImportPending}
                  onClick={handleClearSelectedFile}
                  className="text-xs h-7.5 px-2 text-muted-foreground hover:text-destructive"
                >
                  Remove
                </Button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <AlertCircle className="size-3.5 text-primary" />
                  <span>
                    Merging will retain existing data and recalibrate streaks.
                  </span>
                </div>

                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  isLoading={isImportPending}
                  leftIcon={<CheckCircle2 className="size-3.5" />}
                  onClick={handleImport}
                >
                  Confirm & Merge Backup
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
