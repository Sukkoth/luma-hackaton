import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BiblePageRedirect({ searchParams }: Props) {
  const query = await searchParams;
  const nextParams = new URLSearchParams();
  nextParams.set("view", "read");

  for (const key of [
    "book",
    "ch",
    "v",
    "plan",
    "readingId",
    "startVerse",
    "endVerse",
  ]) {
    const value = query[key];
    if (typeof value === "string" && value.length > 0) {
      nextParams.set(key, value);
    }
  }

  redirect(`/books?${nextParams.toString()}`);
}
