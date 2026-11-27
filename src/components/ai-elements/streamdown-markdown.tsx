"use client";

import {
  BibleVerseHoverLink,
  parseBibleHref,
} from "@/components/ai-elements/bible-verse-link";
import { cn } from "@/lib/utils";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import type { ComponentProps } from "react";
import { useMemo } from "react";
import { Streamdown } from "streamdown";

export type StreamdownMarkdownProps = ComponentProps<typeof Streamdown>;

const streamdownPlugins = { cjk, code, math, mermaid };

function getLumaMermaidOptions() {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return {
    config: {
      theme: "base" as const,
      themeVariables: isDark
        ? {
            darkMode: true,
            background: "transparent",
            primaryColor: "#26221e",
            primaryTextColor: "#fafaf9",
            primaryBorderColor: "#f59e0b",
            secondaryColor: "#171513",
            secondaryTextColor: "#fafaf9",
            secondaryBorderColor: "#d97706",
            tertiaryColor: "#2e2418",
            tertiaryTextColor: "#fef3c7",
            tertiaryBorderColor: "#f59e0b",
            lineColor: "#a8a29e",
            textColor: "#fafaf9",
            mainBkg: "#1c1917",
            nodeBorder: "#f59e0b",
            clusterBkg: "#171513",
            clusterBorder: "#44403c",
            titleColor: "#fafaf9",
            edgeLabelBackground: "#171513",
            fontFamily: "inherit",
          }
        : {
            darkMode: false,
            background: "transparent",
            primaryColor: "#f9f8f5",
            primaryTextColor: "#1c1917",
            primaryBorderColor: "#d97706",
            secondaryColor: "#f4f3ef",
            secondaryTextColor: "#1c1917",
            secondaryBorderColor: "#d6d3cd",
            tertiaryColor: "#fef3c7",
            tertiaryTextColor: "#92400e",
            tertiaryBorderColor: "#d97706",
            lineColor: "#78716c",
            textColor: "#1c1917",
            mainBkg: "#ffffff",
            nodeBorder: "#d97706",
            clusterBkg: "#f9f8f5",
            clusterBorder: "#e7e5e0",
            titleColor: "#1c1917",
            edgeLabelBackground: "#ffffff",
            fontFamily: "inherit",
          },
    },
  };
}

const streamdownComponents: ComponentProps<typeof Streamdown>["components"] = {
  a: ({ href, children, className, ...props }) => {
    const parsedBible = parseBibleHref({ href });
    if (parsedBible) {
      return (
        <BibleVerseHoverLink parsed={parsedBible} className={className}>
          {children}
        </BibleVerseHoverLink>
      );
    }
    const isExternal =
      typeof href === "string" &&
      (href.startsWith("http://") || href.startsWith("https://"));
    return (
      <a
        href={href}
        {...(isExternal
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        className={cn(
          !isExternal &&
            "font-medium text-primary underline underline-offset-2 hover:opacity-85",
          className
        )}
        {...props}
      >
        {children}
      </a>
    );
  },
};

export function StreamdownMarkdown({
  className,
  ...props
}: StreamdownMarkdownProps) {
  const mermaidOptions = useMemo(() => getLumaMermaidOptions(), []);

  return (
    <Streamdown
      dir="ltr"
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      components={streamdownComponents}
      linkSafety={{ enabled: false }}
      mermaid={mermaidOptions}
      plugins={streamdownPlugins}
      {...props}
    />
  );
}
