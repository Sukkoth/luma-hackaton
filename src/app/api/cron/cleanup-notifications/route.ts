import { NextResponse } from "next/server";
import { purgeOldNotificationsAction } from "@/actions/notifications";

export async function GET(request: Request) {
  // Validate authorization header if CRON_SECRET is configured
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await purgeOldNotificationsAction();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    message: "Old notifications successfully purged.",
    deletedPersonal: result.deletedPersonal,
    deletedActivities: result.deletedActivities,
  });
}
