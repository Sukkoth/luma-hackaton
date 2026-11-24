import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const instant = false;

type InsightsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InsightsPage({
  searchParams,
}: InsightsPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/insights");
  }

  const params = searchParams ? await searchParams : {};
  const search = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (key === "tab") continue;
    if (typeof val === "string") search.set(key, val);
    else if (Array.isArray(val)) val.forEach((v) => search.append(key, v));
  }
  const query = search.toString();
  redirect(`/achievements${query ? `?${query}` : ""}`);
}
