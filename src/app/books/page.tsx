import { redirect } from "next/navigation";

export const instant = false;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BooksRedirectPage({ searchParams }: Props) {
  const query = await searchParams;
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.length > 0) {
      nextParams.set(key, value);
    }
  }

  const qs = nextParams.toString();
  redirect(qs ? `/bible?${qs}` : "/bible");
}
