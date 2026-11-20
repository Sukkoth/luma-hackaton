import { cn } from "@/lib/utils";

type LumaIconProps = {
  className?: string;
  size?: number;
};

export function LumaIcon({ className, size = 24 }: LumaIconProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <circle cx="256" cy="184" r="64" fill="currentColor" />
      <path
        d="M 136 348 C 196 312, 316 312, 376 348"
        stroke="currentColor"
        strokeWidth="40"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
