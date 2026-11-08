"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, LogIn, Download } from "lucide-react";
import {
  type ReadingPlanTemplate,
  isPlanCanonCompatible,
} from "@/data/readingPlans";
import type { BibleCanon } from "@/data/bibleData";
import { PlanSetupModal } from "./plan-setup-modal";
import {
  buildPlanSessions,
  exportPlanToPdf,
} from "@/lib/plans/export-plan-pdf";

type StartPlanActionProps = {
  plan: ReadingPlanTemplate;
  activeTrackerId?: string;
  trackerName?: string;
  trackerCanon?: string;
  isAuthenticated: boolean;
};

export function StartPlanAction({
  plan,
  activeTrackerId,
  trackerName,
  trackerCanon,
  isAuthenticated,
}: StartPlanActionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleExportTemplatePdf = () => {
    const sessions = buildPlanSessions({
      readings: plan.readings,
      dailyTarget: plan.defaultDailyTarget,
    });
    exportPlanToPdf({
      planTitle: plan.title,
      subtitle: plan.subtitle,
      category: plan.category,
      canonCompatibility: plan.canonCompatibility,
      totalChapters: plan.totalChapters,
      dailyTarget: plan.defaultDailyTarget,
      sessions,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0">
        <button
          type="button"
          onClick={handleExportTemplatePdf}
          data-testid="template-extract-pdf-btn"
          className="ui-btn-secondary ui-btn-sm gap-1.5 cursor-pointer"
          title="Extract checklist to printable A4 PDF"
        >
          <Download className="size-3.5" />
          <span>Extract to PDF</span>
        </button>
        <Link
          href={`/auth/sign-in?callbackUrl=/plans/templates/${plan.id}`}
          className="ui-btn-primary ui-btn-sm gap-1.5"
        >
          <LogIn className="size-3.5" />
          <span>Sign in to Start Plan</span>
        </Link>
      </div>
    );
  }

  if (!activeTrackerId) {
    return (
      <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0">
        <button
          type="button"
          onClick={handleExportTemplatePdf}
          data-testid="template-extract-pdf-btn"
          className="ui-btn-secondary ui-btn-sm gap-1.5 cursor-pointer"
          title="Extract checklist to printable A4 PDF"
        >
          <Download className="size-3.5" />
          <span>Extract to PDF</span>
        </button>
        <button
          type="button"
          disabled
          className="ui-btn-secondary ui-btn-sm gap-1.5 opacity-50 cursor-not-allowed"
        >
          <span>No Active Tracker</span>
        </button>
      </div>
    );
  }

  const isCanonCompatible = isPlanCanonCompatible({
    plan,
    trackerCanon: (trackerCanon as BibleCanon) || "protestant",
  });

  if (!isCanonCompatible) {
    return (
      <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0">
        <button
          type="button"
          onClick={handleExportTemplatePdf}
          data-testid="template-extract-pdf-btn"
          className="ui-btn-secondary ui-btn-sm gap-1.5 cursor-pointer"
          title="Extract checklist to printable A4 PDF"
        >
          <Download className="size-3.5" />
          <span>Extract to PDF</span>
        </button>
        <button
          type="button"
          disabled
          title="This plan contains books that are outside your active tracker's canon"
          className="ui-btn-secondary ui-btn-sm gap-1.5 opacity-50 cursor-not-allowed"
        >
          <span>Incompatible Canon</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0">
        <button
          type="button"
          onClick={handleExportTemplatePdf}
          data-testid="template-extract-pdf-btn"
          className="ui-btn-secondary ui-btn-sm gap-1.5 cursor-pointer"
          title="Extract checklist to printable A4 PDF"
        >
          <Download className="size-3.5" />
          <span>Extract to PDF</span>
        </button>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="ui-btn-primary ui-btn-sm gap-1.5 cursor-pointer"
        >
          <Calendar className="size-3.5" />
          <span>Configure & Start Plan</span>
        </button>
      </div>

      <PlanSetupModal
        isOpen={isModalOpen}
        onCloseAction={() => setIsModalOpen(false)}
        plan={plan}
        activeTrackerId={activeTrackerId}
        trackerName={trackerName}
      />
    </>
  );
}
