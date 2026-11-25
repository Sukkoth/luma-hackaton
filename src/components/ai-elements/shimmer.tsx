"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { memo, useMemo } from "react";

export interface TextShimmerProps {
  children: string;
  as?: "p" | "span" | "div";
  className?: string;
  duration?: number;
  spread?: number;
}

const ShimmerComponent = ({
  children,
  as = "p",
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) => {
  const dynamicSpread = useMemo(
    () => (children?.length ?? 0) * spread,
    [children, spread]
  );

  const sharedProps = {
    animate: { backgroundPosition: "0% center" },
    className: cn(
      "relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent",
      "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--color-background),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
      className
    ),
    initial: { backgroundPosition: "100% center" },
    style: {
      "--spread": `${dynamicSpread}px`,
      backgroundImage:
        "var(--bg), linear-gradient(var(--color-muted-foreground), var(--color-muted-foreground))",
    } as CSSProperties,
    transition: {
      duration,
      ease: "linear" as const,
      repeat: Number.POSITIVE_INFINITY,
    },
  };

  if (as === "span") {
    return <motion.span {...sharedProps}>{children}</motion.span>;
  }
  if (as === "div") {
    return <motion.div {...sharedProps}>{children}</motion.div>;
  }
  return <motion.p {...sharedProps}>{children}</motion.p>;
};

export const Shimmer = memo(ShimmerComponent);
