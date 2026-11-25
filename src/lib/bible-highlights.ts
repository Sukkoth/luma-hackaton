import type { HighlightColor } from "@/lib/schemas/highlights";

export type PassageHighlightRange = {
  startVerse: number;
  startOffset: number;
  endVerse: number;
  endOffset: number;
  selectedText: string;
};

export type RenderableHighlight = {
  id: string;
  startVerse: number;
  startOffset: number;
  endVerse: number;
  endOffset: number;
  color: HighlightColor;
};

type VerseTextSegment = {
  node: Text;
  start: number;
  end: number;
};

type VerseInfo = {
  verse: number;
  segments: VerseTextSegment[];
  totalLength: number;
  text: string;
};

const EXCLUDED_TEXT_ANCESTOR_SELECTOR =
  ".yv-vlbl, .yv-h, .s, .s1, .s2, .s3, .ms, .mr, .r, .d";

function isExcludedTextNode({ node }: { node: Node }): boolean {
  const el =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement;
  return Boolean(el?.closest(EXCLUDED_TEXT_ANCESTOR_SELECTOR));
}

function collectVerseInfos({
  container,
}: {
  container: HTMLElement;
}): VerseInfo[] {
  const byVerse = new Map<number, VerseTextSegment[]>();
  const textByVerse = new Map<number, string[]>();
  let currentVerse: number | null = null;

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
  );
  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as HTMLElement;
      if (el.tagName === "SPAN" && el.hasAttribute("v")) {
        const rawVerse = el.getAttribute("v");
        const parsed = rawVerse ? Number.parseInt(rawVerse, 10) : Number.NaN;
        if (Number.isFinite(parsed) && parsed >= 1) {
          currentVerse = parsed;
        }
      }
    } else if (current.nodeType === Node.TEXT_NODE && currentVerse !== null) {
      const textNode = current as Text;
      if (!isExcludedTextNode({ node: textNode }) && textNode.data.length > 0) {
        let segments = byVerse.get(currentVerse);
        let textParts = textByVerse.get(currentVerse);
        if (!segments || !textParts) {
          segments = [];
          textParts = [];
          byVerse.set(currentVerse, segments);
          textByVerse.set(currentVerse, textParts);
        }
        const cursor =
          segments.length > 0 ? (segments[segments.length - 1]?.end ?? 0) : 0;
        const len = textNode.data.length;
        segments.push({ node: textNode, start: cursor, end: cursor + len });
        textParts.push(textNode.data);
      }
    }
    current = walker.nextNode();
  }

  const result: VerseInfo[] = [];
  for (const [verse, segments] of byVerse.entries()) {
    const totalLength =
      segments.length > 0 ? (segments[segments.length - 1]?.end ?? 0) : 0;
    result.push({
      verse,
      segments,
      totalLength,
      text: (textByVerse.get(verse) ?? []).join(""),
    });
  }

  result.sort((a, b) => a.verse - b.verse);
  return result;
}

function getSegmentOverlap({
  range,
  seg,
}: {
  range: Range;
  seg: VerseTextSegment;
}): { start: number; end: number } | null {
  const len = seg.end - seg.start;
  if (len <= 0) return null;

  if (range.comparePoint(seg.node, len) < 0) return null;
  if (range.comparePoint(seg.node, 0) > 0) return null;

  const localStart =
    range.startContainer === seg.node
      ? Math.max(0, Math.min(len, range.startOffset))
      : 0;
  const localEnd =
    range.endContainer === seg.node
      ? Math.max(0, Math.min(len, range.endOffset))
      : len;

  if (localStart >= localEnd) return null;
  return {
    start: seg.start + localStart,
    end: seg.start + localEnd,
  };
}

export function extractHighlightRangeFromSelection({
  container,
  selection,
}: {
  container: HTMLElement;
  selection: Selection;
}): PassageHighlightRange | null {
  if (selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) {
    return null;
  }

  const verseInfos = collectVerseInfos({ container });
  if (verseInfos.length === 0) return null;

  let startVerse: number | null = null;
  let startOffset = 0;
  let endVerse: number | null = null;
  let endOffset = 0;
  const selectedParts: string[] = [];

  for (const info of verseInfos) {
    let verseMin: number | null = null;
    let verseMax: number | null = null;

    for (const seg of info.segments) {
      const overlap = getSegmentOverlap({ range, seg });
      if (!overlap) continue;
      verseMin = verseMin === null ? overlap.start : Math.min(verseMin, overlap.start);
      verseMax = verseMax === null ? overlap.end : Math.max(verseMax, overlap.end);
    }

    if (verseMin !== null && verseMax !== null && verseMin < verseMax) {
      if (startVerse === null) {
        startVerse = info.verse;
        startOffset = verseMin;
      }
      endVerse = info.verse;
      endOffset = verseMax;
      selectedParts.push(info.text.slice(verseMin, verseMax));
    }
  }

  if (startVerse === null || endVerse === null) {
    return null;
  }

  const selectedText = selectedParts.join(" ").trim();
  if (!selectedText) {
    return null;
  }

  return {
    startVerse,
    startOffset,
    endVerse,
    endOffset,
    selectedText,
  };
}

export function getFullVerseHighlightRange({
  container,
  verse,
}: {
  container: HTMLElement;
  verse: number;
}): PassageHighlightRange | null {
  const verseInfos = collectVerseInfos({ container });
  const info = verseInfos.find((item) => item.verse === verse);
  if (!info || info.totalLength === 0) return null;

  const selectedText = info.text.trim();
  if (!selectedText) return null;

  return {
    startVerse: verse,
    startOffset: 0,
    endVerse: verse,
    endOffset: info.totalLength,
    selectedText,
  };
}

export function getVerseAtPoint({
  container,
  x,
  y,
}: {
  container: HTMLElement;
  x: number;
  y: number;
}): number | null {
  let node: Node | null = null;

  const doc = document as Document & {
    caretPositionFromPoint?: (
      px: number,
      py: number
    ) => { offsetNode: Node; offset: number } | null;
  };

  if (typeof doc.caretRangeFromPoint === "function") {
    const caretRange = doc.caretRangeFromPoint(x, y);
    node = caretRange?.startContainer ?? null;
  } else if (typeof doc.caretPositionFromPoint === "function") {
    const pos = doc.caretPositionFromPoint(x, y);
    node = pos?.offsetNode ?? null;
  }

  if (!node || !container.contains(node)) return null;

  const verseInfos = collectVerseInfos({ container });
  for (const info of verseInfos) {
    if (info.segments.some((seg) => seg.node === node)) {
      return info.verse;
    }
  }
  return null;
}

export function selectVerseInDom({
  container,
  verse,
}: {
  container: HTMLElement;
  verse: number;
}): DOMRect | null {
  const verseInfos = collectVerseInfos({ container });
  const info = verseInfos.find((item) => item.verse === verse);
  if (!info || info.segments.length === 0) return null;

  const firstSeg = info.segments[0];
  const lastSeg = info.segments[info.segments.length - 1];
  if (!firstSeg || !lastSeg) return null;

  const range = document.createRange();
  range.setStart(firstSeg.node, 0);
  range.setEnd(lastSeg.node, lastSeg.node.data.length);

  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }

  return range.getBoundingClientRect();
}

const HIGHLIGHT_MARK_CLASSES: Record<HighlightColor, string> = {
  amber: "bg-amber-300/60 dark:bg-amber-500/55",
  green: "bg-emerald-300/55 dark:bg-emerald-500/50",
  blue: "bg-sky-300/60 dark:bg-sky-500/55",
  rose: "bg-rose-300/55 dark:bg-rose-500/55",
  purple: "bg-purple-300/55 dark:bg-purple-500/55",
};

export function clearHighlightsFromPassageDom({
  container,
}: {
  container: HTMLElement;
}): void {
  const marks = container.querySelectorAll<HTMLElement>(
    "mark[data-highlight-id]"
  );
  for (const mark of marks) {
    const parent = mark.parentNode;
    if (!parent) continue;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
  }
  container.normalize();
}

function wrapVerseSlice({
  container,
  startVerse,
  startOffset,
  endVerse,
  endOffset,
  createWrapper,
}: {
  container: HTMLElement;
  startVerse: number;
  startOffset: number;
  endVerse: number;
  endOffset: number;
  createWrapper: () => HTMLElement;
}): void {
  const verseInfos = collectVerseInfos({ container });
  for (const info of verseInfos) {
    if (info.verse < startVerse || info.verse > endVerse) {
      continue;
    }

    const sliceStart =
      info.verse === startVerse ? Math.max(0, startOffset) : 0;
    const sliceEnd =
      info.verse === endVerse
        ? Math.min(info.totalLength, endOffset)
        : info.totalLength;

    if (sliceStart >= sliceEnd) continue;

    for (const seg of info.segments) {
      const overlapStart = Math.max(sliceStart, seg.start);
      const overlapEnd = Math.min(sliceEnd, seg.end);
      if (overlapStart >= overlapEnd) continue;

      const localStart = overlapStart - seg.start;
      const localEnd = overlapEnd - seg.start;

      const targetRange = document.createRange();
      targetRange.setStart(seg.node, localStart);
      targetRange.setEnd(seg.node, localEnd);

      const wrapper = createWrapper();
      targetRange.surroundContents(wrapper);
    }
  }
}

export function applyHighlightsToPassageDom({
  container,
  highlights,
}: {
  container: HTMLElement;
  highlights: ReadonlyArray<RenderableHighlight>;
}): void {
  clearHighlightsFromPassageDom({ container });

  for (const highlight of highlights) {
    wrapVerseSlice({
      container,
      startVerse: highlight.startVerse,
      startOffset: highlight.startOffset,
      endVerse: highlight.endVerse,
      endOffset: highlight.endOffset,
      createWrapper: () => {
        const mark = document.createElement("mark");
        mark.dataset.highlightId = highlight.id;
        mark.dataset.highlightColor = highlight.color;
        mark.className = HIGHLIGHT_MARK_CLASSES[highlight.color];
        return mark;
      },
    });
  }
}
