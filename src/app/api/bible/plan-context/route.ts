import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPlanInstanceDetailAction } from "@/actions/plans";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const planId = searchParams.get("planId");
  const readingId = searchParams.get("readingId");

  if (!planId || !readingId) {
    return NextResponse.json({ error: "Missing planId or readingId" }, { status: 400 });
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await getPlanInstanceDetailAction({ instanceId: planId });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const nowMidnight = new Date();
  nowMidnight.setHours(0, 0, 0, 0);
  if (
    plan.mode === "scheduled" &&
    new Date(plan.startDate).getTime() > nowMidnight.getTime()
  ) {
    return NextResponse.json(
      { error: "This scheduled cohort plan has not started yet." },
      { status: 403 }
    );
  }

  const reading = plan.sessions
    .flatMap((s) => s.readings.map((r) => ({ ...r, sessionIndex: s.sessionIndex, sessionTitle: s.title })))
    .find((r) => r.id === readingId);

  if (!reading) {
    return NextResponse.json({ error: "Reading not found" }, { status: 404 });
  }

  const flattenedReadings = plan.sessions
    .flatMap((s) =>
      s.readings.map((r) => ({
        id: r.id,
        bookId: r.bookId,
        chapter: r.chapter,
        startVerse: r.startVerse,
        endVerse: r.endVerse,
        sessionIndex: s.sessionIndex,
        sessionTitle: s.title,
        isCompleted: r.isCompleted,
      }))
    );

  return NextResponse.json(
    {
      plan: {
        id: plan.id,
        title: plan.title,
      },
      reading,
      flattenedReadings,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}