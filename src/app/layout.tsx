import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const urbanist = localFont({
  src: "./fonts/Urbanist-Variable.woff2",
  variable: "--font-urbanist",
  display: "swap",
  weight: "100 900",
});

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
      className={`${urbanist.variable} h-full antialiased`}
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
      <body className="min-h-full font-[family-name:var(--font-urbanist)] antialiased transition-colors duration-200">
        <ThemeProvider defaultTheme="system">
          <main className="flex-1">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
