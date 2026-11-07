import { NextResponse } from "next/server";
import { getVerseOfTheDay } from "@/lib/youversion";

export async function GET() {
  const data = await getVerseOfTheDay();
  return NextResponse.json(data);
}
