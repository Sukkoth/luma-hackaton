import Link from "next/link";
import { WifiOff, RefreshCw, BookOpen, FileText, Home } from "lucide-react";
import { LumaIcon } from "@/components/ui/luma-icon";

export const metadata = {
  title: "Offline • Bible Tracker & Plans",
  description: "You are currently browsing offline.",
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-[#0c0a09] border border-border/80 shadow-lg overflow-hidden">
              <LumaIcon className="size-full rounded-2xl" size={64} />
            </span>
            <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-amber-500 text-black border-2 border-background shadow-xs">
              <WifiOff className="size-3.5" />
            </span>
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            You are currently offline
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Luma preserves your cached reading sessions, spiritual marginalia,
            and daily scripture matrix locally on your device.
          </p>
        </div>

        {/* Quick Links to Cached Sections */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          <Link
            href="/home"
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/60 transition-colors text-xs font-semibold text-foreground group"
          >
            <Home className="size-4 mb-1.5 text-primary group-hover:scale-110 transition-transform" />
            <span>Home</span>
          </Link>

          <Link
            href="/bible"
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/60 transition-colors text-xs font-semibold text-foreground group"
          >
            <BookOpen className="size-4 mb-1.5 text-primary group-hover:scale-110 transition-transform" />
            <span>Books</span>
          </Link>

          <Link
            href="/notes"
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/60 transition-colors text-xs font-semibold text-foreground group"
          >
            <FileText className="size-4 mb-1.5 text-primary group-hover:scale-110 transition-transform" />
            <span>Notes</span>
          </Link>
        </div>

        {/* Reload Action */}
        <div className="pt-2">
          <Link
            href="/home"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw className="size-4" />
            <span>Check Connection &amp; Reload</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
