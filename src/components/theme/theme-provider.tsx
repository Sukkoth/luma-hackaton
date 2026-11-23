"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";

type ThemeContextType = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

const THEME_CHANGE_EVENT = "scripture-theme-change";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "scripture-theme",
}: ThemeProviderProps) {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (!isBrowser()) {
        return () => {};
      }

      const handleStorage = (e: StorageEvent) => {
        if (e.key === storageKey) {
          callback();
        }
      };
      const handleCustom = () => {
        callback();
      };
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleMedia = (e: MediaQueryListEvent) => {
        try {
          const currentTheme = localStorage.getItem(storageKey);
          if (!currentTheme || currentTheme === "system") {
            if (e.matches) {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
          }
        } catch {
          // Ignore storage restrictions
        }
        callback();
      };

      window.addEventListener("storage", handleStorage);
      window.addEventListener(THEME_CHANGE_EVENT, handleCustom);
      mediaQuery.addEventListener("change", handleMedia);

      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(THEME_CHANGE_EVENT, handleCustom);
        mediaQuery.removeEventListener("change", handleMedia);
      };
    },
    [storageKey]
  );

  const getSnapshot = useCallback((): Theme => {
    if (!isBrowser()) {
      return defaultTheme;
    }
    try {
      const stored = localStorage.getItem(storageKey) as Theme | null;
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
      }
    } catch {
      // LocalStorage access may be restricted
    }
    return defaultTheme;
  }, [defaultTheme, storageKey]);

  const getServerSnapshot = useCallback((): Theme => {
    return defaultTheme;
  }, [defaultTheme]);

  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const getResolvedSnapshot = useCallback((): "light" | "dark" => {
    if (!isBrowser()) {
      return defaultTheme === "dark" ? "dark" : "light";
    }
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme === "dark" ? "dark" : "light";
  }, [theme, defaultTheme]);

  const getResolvedServerSnapshot = useCallback((): "light" | "dark" => {
    return defaultTheme === "dark" ? "dark" : "light";
  }, [defaultTheme]);

  const resolvedTheme = useSyncExternalStore(
    subscribe,
    getResolvedSnapshot,
    getResolvedServerSnapshot
  );

  // Synchronize mobile status bar and theme-color meta tags with active theme
  useEffect(() => {
    if (!isBrowser()) return;
    const isDark = resolvedTheme === "dark";
    const targetColor = isDark ? "#0c0a09" : "#fbfbf9";
    const appleStyle = isDark ? "black-translucent" : "default";

    let isSyncing = false;

    const syncStatusBar = () => {
      if (isSyncing) return;
      isSyncing = true;
      try {
        const metas = Array.from(
          document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
        );

        if (metas.length === 0) {
          const newMeta = document.createElement("meta");
          newMeta.name = "theme-color";
          newMeta.content = targetColor;
          document.head.appendChild(newMeta);
        } else {
          // Keep the primary meta tag and ensure its content matches targetColor without media attribute
          const primaryMeta = metas[0];
          if (
            primaryMeta.getAttribute("content") !== targetColor ||
            primaryMeta.hasAttribute("media")
          ) {
            primaryMeta.removeAttribute("media");
            primaryMeta.setAttribute("content", targetColor);
          }

          // Remove any duplicate or media-queried tags injected by router navigation
          for (let i = 1; i < metas.length; i++) {
            metas[i].remove();
          }
        }

        const appleMeta = document.querySelector<HTMLMetaElement>(
          'meta[name="apple-mobile-web-app-status-bar-style"]'
        );
        if (appleMeta && appleMeta.getAttribute("content") !== appleStyle) {
          appleMeta.setAttribute("content", appleStyle);
        }
      } finally {
        isSyncing = false;
      }
    };

    // Run immediately on theme change or mount
    syncStatusBar();

    // Observe document.head so Next.js client-side route transitions never
    // overwrite or inject mismatched status bar meta tags
    const observer = new MutationObserver(() => {
      syncStatusBar();
    });

    observer.observe(document.head, {
      childList: true,
      subtree: false,
      attributes: true,
      attributeFilter: ["content", "media"],
    });

    return () => {
      observer.disconnect();
    };
  }, [resolvedTheme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      if (!isBrowser()) return;

      try {
        localStorage.setItem(storageKey, newTheme);
      } catch {
        // Ignore storage write failures
      }

      const root = document.documentElement;
      let isDark = false;

      if (newTheme === "system") {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      } else {
        isDark = newTheme === "dark";
      }

      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT));
    },
    [storageKey]
  );

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
