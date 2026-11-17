import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AchievementCelebrationListener } from "@/components/achievements/achievement-celebration-listener";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bible Tracker & Planner",
  description: "Track your Bible reading and follow curated reading plans",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} h-full antialiased`}
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
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${GeistSans.className} min-h-full font-sans antialiased transition-colors duration-200`}
      >
        <NuqsAdapter>
          <ThemeProvider defaultTheme="system">
            <Suspense fallback={null}>
              <AchievementCelebrationListener />
            </Suspense>
            <main className="flex-1 pb-20 md:pb-0">{children}</main>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
