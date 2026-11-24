"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { Download, Sparkles, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type PwaContextType = {
  isInstallable: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<boolean>;
};

const PwaContext = createContext<PwaContextType>({
  isInstallable: false,
  isInstalled: false,
  promptInstall: async () => false,
});

export function usePwa() {
  return useContext(PwaContext);
}

type PwaProviderProps = {
  children: ReactNode;
};

function subscribeStandalone(callback: () => void): () => void {
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", callback);
  return () => {
    mq.removeEventListener("change", callback);
  };
}

function getStandaloneSnapshot(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function getStandaloneServerSnapshot(): boolean {
  return false;
}

export function PwaProvider({ children }: PwaProviderProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installedViaEvent, setInstalledViaEvent] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    getStandaloneServerSnapshot
  );

  const isInstalled = isStandalone || installedViaEvent;

  // Lifecycle effects for Service Worker and install events
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register Service Worker in production or active dev
    if ("serviceWorker" in navigator) {
      const registerServiceWorker = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            // Check for updates periodically
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (
                    newWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    toast.info("New version of Luma available", {
                      description:
                        "Reload to get the latest scripture features.",
                      action: {
                        label: "Reload",
                        onClick: () => window.location.reload(),
                      },
                    });
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn("[PWA] Service worker registration failed:", err);
          });
      };

      if (document.readyState === "complete") {
        registerServiceWorker();
      } else {
        window.addEventListener("load", registerServiceWorker);
      }
    }

    // Network connectivity notifications
    const handleOnline = () => {
      toast.success("Back online", {
        description: "Reconnected to scripture sanctuary.",
      });
    };

    const handleOffline = () => {
      toast.warning("Reading offline", {
        description: "Cached chapters and study notes remain available.",
      });
    };

    // PWA Install prompt listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Check if user has previously dismissed install prompt recently
      const dismissed = localStorage.getItem("luma-pwa-banner-dismissed");
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setInstalledViaEvent(true);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      toast.success("Luma installed", {
        description: "Now accessible directly from your home screen.",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
        setShowInstallBanner(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [deferredPrompt]);

  const dismissBanner = () => {
    setShowInstallBanner(false);
    try {
      localStorage.setItem("luma-pwa-banner-dismissed", "true");
    } catch {
      // Ignore localStorage restrictions
    }
  };

  return (
    <PwaContext.Provider
      value={{
        isInstallable: Boolean(deferredPrompt),
        isInstalled,
        promptInstall,
      }}
    >
      {children}

      {/* Subtle PWA Install Pill Banner (Only shown once if installable) */}
      {showInstallBanner && !isInstalled && deferredPrompt && (
        <aside
          aria-label="Install Luma application"
          className="fixed top-3 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="pointer-events-auto flex items-center justify-between gap-3 w-full max-w-md rounded-2xl border border-border/80 bg-background/95 dark:bg-card/95 backdrop-blur-xl px-4 py-3 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="size-4" />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-foreground truncate">
                  Install Luma App
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  Read offline &amp; full-screen on device
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={promptInstall}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <Download className="size-3.5" />
                <span>Install</span>
              </button>
              <button
                type="button"
                onClick={dismissBanner}
                aria-label="Dismiss install banner"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}
    </PwaContext.Provider>
  );
}
