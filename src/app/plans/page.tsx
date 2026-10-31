import { TopNavbar } from "@/components/luma/top-navbar";
import { PlanCatalog } from "@/components/plans/PlanCatalog";

export default function PlansPage() {
  return (
    <div className="mx-auto min-h-screen max-w-350 px-4 py-3 sm:px-6 md:px-8 md:py-4">
      {/* Top Navbar */}
      <TopNavbar userName="James" />

      {/* Main Content Area */}
      <main className="mt-3">
        <PlanCatalog />
      </main>
    </div>
  );
}
