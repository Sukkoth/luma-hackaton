import type { Metadata } from "next";
import localFont from "next/font/local";
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
    <html lang="en" className={`${urbanist.variable} h-full antialiased`}>
      <body className="min-h-full font-[family-name:var(--font-urbanist)] antialiased">
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
