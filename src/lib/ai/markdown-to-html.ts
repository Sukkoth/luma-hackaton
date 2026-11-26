function escapeHtml({ text }: { text: string }): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInlineMarkdown({ text }: { text: string }): string {
  const codeSegments: string[] = [];
  const withPlaceholders = text.replace(
    /`([^`]+)`/g,
    (_match, code: string) => {
      const idx = codeSegments.length;
      codeSegments.push(`<code>${escapeHtml({ text: code })}</code>`);
      return `\u0000CODE${idx}\u0000`;
    }
  );

  let html = escapeHtml({ text: withPlaceholders });

  // Links: [label](href)
  html = html.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_match, label: string, href: string) => {
      const safeHref =
        href.startsWith("/") ||
        href.startsWith("http://") ||
        href.startsWith("https://")
          ? href
          : "#";
      return `<a href="${safeHref}">${label}</a>`;
    }
  );

  // Bold (**text** or __text__)
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");

  // Italic (*text* or _text_)
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/(^|\s)_([^_]+)_/g, "$1<em>$2</em>");

  // Restore inline code
  html = html.replace(/\u0000CODE(\d+)\u0000/g, (_match, idxStr: string) => {
    const idx = Number.parseInt(idxStr, 10);
    return codeSegments[idx] ?? "";
  });

  return html;
}

export function convertMarkdownToTipTapHtml({
  markdown,
}: {
  markdown: string;
}): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    // Fenced code block
    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !(lines[i] ?? "").trim().startsWith("```")) {
        codeLines.push(lines[i] ?? "");
        i += 1;
      }
      i += 1; // skip closing ```
      blocks.push(
        `<pre><code>${escapeHtml({ text: codeLines.join("\n") })}</code></pre>`
      );
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push("<hr />");
      i += 1;
      continue;
    }

    // Headings (#, ##, ###, ####)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(3, headingMatch[1]?.length ?? 2);
      const content = formatInlineMarkdown({ text: headingMatch[2] ?? "" });
      blocks.push(`<h${level}>${content}</h${level}>`);
      i += 1;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i] ?? "").trim().startsWith(">")) {
        quoteLines.push((lines[i] ?? "").trim().replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push(
        `<blockquote><p>${quoteLines
          .map((q) => formatInlineMarkdown({ text: q }))
          .join("<br />")}</p></blockquote>`
      );
      continue;
    }

    // Unordered list
    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test((lines[i] ?? "").trim())) {
        const itemText = (lines[i] ?? "").trim().replace(/^[-*+]\s+/, "");
        items.push(
          `<li><p>${formatInlineMarkdown({ text: itemText })}</p></li>`
        );
        i += 1;
      }
      blocks.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test((lines[i] ?? "").trim())) {
        const itemText = (lines[i] ?? "").trim().replace(/^\d+\.\s+/, "");
        items.push(
          `<li><p>${formatInlineMarkdown({ text: itemText })}</p></li>`
        );
        i += 1;
      }
      blocks.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    // Markdown table -> list of rows so TipTap StarterKit renders cleanly
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableRows: string[] = [];
      while (
        i < lines.length &&
        (lines[i] ?? "").trim().startsWith("|") &&
        (lines[i] ?? "").trim().endsWith("|")
      ) {
        const row = (lines[i] ?? "").trim();
        if (!/^\|[\s:-]+\|/.test(row)) {
          const cells = row
            .slice(1, -1)
            .split("|")
            .map((cell) => formatInlineMarkdown({ text: cell.trim() }))
            .filter(Boolean);
          if (cells.length > 0) {
            tableRows.push(`<li><p>${cells.join(" — ")}</p></li>`);
          }
        }
        i += 1;
      }
      if (tableRows.length > 0) {
        blocks.push(`<ul>${tableRows.join("")}</ul>`);
      }
      continue;
    }

    // Regular paragraph (consume until blank line or block starter)
    const paraLines: string[] = [];
    while (i < lines.length) {
      const current = (lines[i] ?? "").trim();
      if (
        !current ||
        current.startsWith("```") ||
        current.startsWith(">") ||
        /^(#{1,4})\s+/.test(current) ||
        /^[-*+]\s+/.test(current) ||
        /^\d+\.\s+/.test(current) ||
        /^(-{3,}|\*{3,}|_{3,})$/.test(current) ||
        (current.startsWith("|") && current.endsWith("|"))
      ) {
        break;
      }
      paraLines.push(current);
      i += 1;
    }
    if (paraLines.length > 0) {
      blocks.push(
        `<p>${paraLines
          .map((p) => formatInlineMarkdown({ text: p }))
          .join(" ")}</p>`
      );
    }
  }

  return blocks.join("") || "<p></p>";
}

export function stripMarkdownForSnippet({
  markdown,
  maxLength = 150,
}: {
  markdown: string;
  maxLength?: number;
}): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_`>~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}
