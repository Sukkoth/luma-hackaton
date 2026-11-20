"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ActiveSheetEntry = {
  id: string;
  close: () => void;
};

const activeSheetStack: ActiveSheetEntry[] = [];
let isProgrammaticBackInProgress = false;
let programmaticBackTimeoutId: ReturnType<typeof setTimeout> | null = null;
let isPopStateListenerAttached = false;

function ensurePopStateListener(): void {
  if (typeof window === "undefined" || isPopStateListenerAttached) return;

  window.addEventListener("popstate", () => {
    if (isProgrammaticBackInProgress) {
      isProgrammaticBackInProgress = false;
      if (programmaticBackTimeoutId) {
        clearTimeout(programmaticBackTimeoutId);
        programmaticBackTimeoutId = null;
      }
      return;
    }

    if (activeSheetStack.length > 0) {
      const topSheet = activeSheetStack.pop();
      if (topSheet) {
        topSheet.close();
      }
    }
  });

  isPopStateListenerAttached = true;
}

type RegisterSheetParams = {
  id: string;
  close: () => void;
};

function registerSheet({ id, close }: RegisterSheetParams): void {
  if (typeof window === "undefined") return;

  ensurePopStateListener();

  try {
    const currentState =
      typeof window.history.state === "object" && window.history.state !== null
        ? (window.history.state as Record<string, unknown>)
        : {};
    window.history.pushState(
      { ...currentState, __sheet_id: id },
      "",
      window.location.href
    );
  } catch {
    // Graceful degradation when history manipulation is disabled
  }

  activeSheetStack.push({ id, close });
}

type UnregisterSheetParams = {
  id: string;
  poppedByHistory: boolean;
};

function unregisterSheet({ id, poppedByHistory }: UnregisterSheetParams): void {
  if (typeof window === "undefined") return;

  const index = activeSheetStack.findIndex((item) => item.id === id);
  if (index !== -1) {
    activeSheetStack.splice(index, 1);
  }

  if (!poppedByHistory) {
    isProgrammaticBackInProgress = true;
    if (programmaticBackTimeoutId) {
      clearTimeout(programmaticBackTimeoutId);
    }
    programmaticBackTimeoutId = setTimeout(() => {
      isProgrammaticBackInProgress = false;
      programmaticBackTimeoutId = null;
    }, 150);

    try {
      window.history.back();
    } catch {
      isProgrammaticBackInProgress = false;
    }
  }
}

export type SheetProps = React.ComponentPropsWithoutRef<
  typeof SheetPrimitive.Root
> & {
  closeOnBack?: boolean;
};

const Sheet = ({
  open: controlledOpen,
  defaultOpen,
  onOpenChange,
  closeOnBack = true,
  children,
  ...props
}: SheetProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
    defaultOpen ?? false
  );
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const onOpenChangeRef = React.useRef(onOpenChange);
  React.useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChangeRef.current?.(nextOpen);
    },
    [isControlled]
  );

  const sheetId = React.useId();
  const poppedByHistoryRef = React.useRef(false);

  React.useEffect(() => {
    if (!closeOnBack || typeof window === "undefined") {
      return;
    }

    if (isOpen) {
      poppedByHistoryRef.current = false;
      const initialHref = window.location.href;

      registerSheet({
        id: sheetId,
        close: () => {
          poppedByHistoryRef.current = true;
          handleOpenChange(false);
        },
      });

      return () => {
        const popped = poppedByHistoryRef.current;
        const samePage = window.location.href === initialHref;
        unregisterSheet({
          id: sheetId,
          poppedByHistory: popped || !samePage,
        });
      };
    }
  }, [isOpen, closeOnBack, handleOpenChange, sheetId]);

  return (
    <SheetPrimitive.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      {...props}
    >
      {children}
    </SheetPrimitive.Root>
  );
};
Sheet.displayName = "Sheet";

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

type SheetSide = "top" | "bottom" | "left" | "right";

const SHEET_SIDE_STYLES: Record<SheetSide, string> = {
  top: "inset-x-0 top-0 border-b border-border data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
  bottom:
    "inset-x-0 bottom-0 border-t border-border/80 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom rounded-t-3xl max-h-[90dvh] max-w-2xl sm:mx-auto",
  left: "inset-y-0 left-0 h-full w-3/4 border-r border-border data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
  right:
    "inset-y-0 right-0 h-full w-3/4 border-l border-border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
};

export type SheetContentProps = React.ComponentPropsWithoutRef<
  typeof SheetPrimitive.Content
> & {
  side?: SheetSide;
  showCloseButton?: boolean;
  showHandle?: boolean;
};

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(
  (
    {
      side = "bottom",
      showCloseButton = true,
      showHandle = side === "bottom",
      className,
      children,
      ...props
    },
    ref
  ) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 flex flex-col bg-card shadow-2xl transition ease-in-out duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out",
          SHEET_SIDE_STYLES[side],
          className
        )}
        {...props}
      >
        {showHandle && (
          <div className="flex w-full items-center justify-center pt-3 pb-1">
            <span className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </div>
        )}
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            className="absolute right-4 top-4 rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors focus:outline-hidden focus:ring-1 focus:ring-primary"
            aria-label="Close"
          >
            <X className="size-4" />
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
);
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-left", className)}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn(
      "text-base font-bold tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-xs text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
