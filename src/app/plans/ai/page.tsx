import { redirect } from "next/navigation";

export default function LegacyAiPlanStudioPage() {
  redirect("/ai?mode=plan");
}
