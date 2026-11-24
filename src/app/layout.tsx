import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AchievementCelebrationListener } from "@/components/achievements/achievement-celebration-listener";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#fbfbf9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Luma: Bible Tracker & Plans",
  description:
    "Aesthetic, habit-forming Bible reading companion and study journal.",
  applicationName: "Luma: Bible Tracker & Plans",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bible Tracker & Plans",
    startupImage: [
      {
        url: "/icon-512.png",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.png", type: "image/png" }],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    siteName: "Luma",
    title: "Luma: Bible Tracker & Plans",
    description:
      "Aesthetic, habit-forming Bible reading companion and study journal.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('scripture-theme');
                  var isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  var metaTheme = document.querySelector('meta[name="theme-color"]');
                  if (metaTheme) {
                    metaTheme.setAttribute('content', isDark ? '#0c0a09' : '#fbfbf9');
                  }
                  var metaApple = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
                  if (metaApple) {
                    metaApple.setAttribute('content', isDark ? 'black-translucent' : 'default');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${plusJakartaSans.className} min-h-full font-sans antialiased selection:bg-amber-500/20 selection:text-amber-900 dark:selection:bg-amber-500/30 dark:selection:text-amber-200 transition-colors duration-200`}
      >
        <NuqsAdapter>
          <ThemeProvider defaultTheme="system">
            <PwaProvider>
              <Suspense fallback={null}>
                <AchievementCelebrationListener />
              </Suspense>
              <Toaster position="top-right" richColors />
              <main className="flex-1 pb-20 lg:pb-0">{children}</main>
            </PwaProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
