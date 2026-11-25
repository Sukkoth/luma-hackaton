import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LandingView } from "@/components/landing/landing-view";
import { getSiteUrl } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = {
  title: "Bible Reading Tracker, Plans & Study Notes | Luma",
  description:
    "Track your daily Bible reading, follow customizable reading plans, highlight verses, and capture passage-anchored study notes in one calm sanctuary.",
  alternates: {
    canonical: "/",
  },
};

export default async function RootPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/home");
  }

  const siteUrl = getSiteUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Luma",
        url: siteUrl,
      },
      {
        "@type": "WebApplication",
        name: "Luma: Bible Tracker & Plans",
        url: siteUrl,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web",
        description:
          "Habit-forming Bible reading tracker, customizable reading plans, verse highlighting, and passage-anchored study notes.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingView />
    </>
  );
}
