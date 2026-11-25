import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AchievementCelebrationListener } from "@/components/achievements/achievement-celebration-listener";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { Toaster } from "@/components/ui/sonner";
import { getSiteUrl } from "@/lib/seo";
import "./globals.css";

const siteUrl = getSiteUrl();

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
  metadataBase: new URL(siteUrl),
  title: {
    default: "Bible Reading Tracker, Plans & Study Notes | Luma",
    template: "%s | Luma",
  },
  description:
    "Track your daily Bible reading, follow customizable reading plans, highlight verses, and capture passage-anchored study notes in one calm sanctuary.",
  keywords: [
    "Bible reading tracker",
    "Bible reading plans",
    "Bible study notes",
    "Scripture reading journal",
    "Bible highlight app",
    "Luma Bible",
  ],
  applicationName: "Luma: Bible Tracker & Plans",
  alternates: {
    canonical: "/",
  },
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
    type: "website",
    url: "/",
    siteName: "Luma",
    title: "Bible Reading Tracker, Plans & Study Notes | Luma",
    description:
      "Track your daily Bible reading, follow customizable reading plans, highlight verses, and capture passage-anchored study notes in one calm sanctuary.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Luma Bible Reading Tracker",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Bible Reading Tracker, Plans & Study Notes | Luma",
    description:
      "Track your daily Bible reading, follow customizable reading plans, highlight verses, and capture passage-anchored study notes.",
    images: ["/icon-512.png"],
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
