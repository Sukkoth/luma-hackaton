"use client";

import { BibleReaderCore, type BibleReaderCoreProps } from "./bible-reader-core";

export type BibleReaderPageProps = {
  bookId: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
  versionId?: number;
  planContext?: BibleReaderCoreProps["planContext"];
};

export function BibleReaderPage({
  bookId,
  chapter,
  startVerse,
  endVerse,
  versionId,
  planContext,
}: BibleReaderPageProps) {
  return (
    <BibleReaderCore
      bookId={bookId}
      chapter={chapter}
      startVerse={startVerse}
      endVerse={endVerse}
      versionId={versionId}
      planContext={planContext}
    />
  );
}