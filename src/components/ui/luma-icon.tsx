import Image from "next/image";
import { cn } from "@/lib/utils";

type LumaIconProps = {
  className?: string;
  size?: number;
  priority?: boolean;
};

export function LumaIcon({
  className,
  size = 24,
  priority = false,
}: LumaIconProps) {
  return (
    <Image
      src="/icon.png"
      alt="Luma logo"
      width={size}
      height={size}
      priority={priority}
      className={cn(
        "shrink-0 object-contain rounded-md select-none pointer-events-none",
        className
      )}
    />
  );
}
