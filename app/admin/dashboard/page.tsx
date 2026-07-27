import { OverviewContent } from "@/components/dashboard/content/overview-content";

// Server Component by default — all interactivity (date filter, charts,
// refresh) lives inside <OverviewContent>, a client component.
export default function AdminDashboardPage() {
  return (
    <div className="px-4 md:px-8 py-8">
      <OverviewContent />
    </div>
  );
}
