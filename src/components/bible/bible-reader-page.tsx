"use client";

import { BibleReaderCore, type BibleReaderCoreProps } from "./bible-reader-core";

export type BibleReaderPageProps = {
  bookId: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
  versionId?: number;
  planContext?: BibleReaderCoreProps["planContext"];
  onToggleReading?: (readingId: string) => void;
};

export function BibleReaderPage({
  bookId,
  chapter,
  startVerse,
  endVerse,
  versionId,
  planContext,
  onToggleReading,
}: BibleReaderPageProps) {
  return (
    <BibleReaderCore
      bookId={bookId}
      chapter={chapter}
      startVerse={startVerse}
      endVerse={endVerse}
      versionId={versionId}
      planContext={planContext}
      onToggleReading={onToggleReading}
    />
  );
}