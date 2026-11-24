import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ bookId: string; chapter: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyBibleReaderRedirect({
  params,
  searchParams,
}: Props) {
  const { bookId, chapter } = await params;
  const query = await searchParams;
  const nextParams = new URLSearchParams();

  nextParams.set("book", bookId.toLowerCase());
  nextParams.set("ch", chapter);

  for (const key of ["v", "plan", "readingId", "startVerse", "endVerse"]) {
    const value = query[key];
    if (typeof value === "string" && value.length > 0) {
      nextParams.set(key, value);
    }
  }

  redirect(`/bible?${nextParams.toString()}`);
}
