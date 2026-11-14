import { Suspense } from "react";
import { BibleReaderPageClient } from "./bible-reader-page-client";

export default function BibleReaderPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="size-8 animate-spin rounded-full border-2 border-black/10 border-t-black dark:border-white/10 dark:border-t-white" /></div>}>
      <BibleReaderPageClient />
    </Suspense>
  );
}