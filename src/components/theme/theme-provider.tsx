"use client";

import {
  createContext,
  useContext,
  useCallback,
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

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "scripture-theme",
}: ThemeProviderProps) {
  const subscribe = useCallback(
    (callback: () => void) => {
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
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme === "dark" ? "dark" : "light";
  }, [theme]);

  const getResolvedServerSnapshot = useCallback((): "light" | "dark" => {
    return defaultTheme === "dark" ? "dark" : "light";
  }, [defaultTheme]);

  const resolvedTheme = useSyncExternalStore(
    subscribe,
    getResolvedSnapshot,
    getResolvedServerSnapshot
  );

  const setTheme = useCallback(
    (newTheme: Theme) => {
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

      window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
    },
    [storageKey]
  );

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
