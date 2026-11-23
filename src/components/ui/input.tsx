import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startIcon, endIcon, ...props }, ref) => {
    if (startIcon || endIcon) {
      return (
        <div className="relative flex items-center w-full">
          {startIcon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center justify-center z-10 [&>svg]:size-4">
              {startIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-9.5 w-full rounded-xl border border-input bg-card py-1.5 text-xs sm:text-sm text-foreground shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
              startIcon ? "pl-9" : "pl-3",
              endIcon ? "pr-9" : "pr-3",
              className
            )}
            ref={ref}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center z-10 [&>svg]:size-4">
              {endIcon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-9.5 w-full rounded-xl border border-input bg-card px-3 py-1.5 text-xs sm:text-sm text-foreground shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
