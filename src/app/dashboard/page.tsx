import DashboardNav from "@/components/dashboard/DashboardNav";
import StatCards from "@/components/dashboard/StatCards";
import RecentReviews from "@/components/dashboard/RecentReviews";
import SendReviewRequest from "@/components/dashboard/SendReviewRequest";

export const metadata = {
  title: "Dashboard — Vynta",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-cream">
      <DashboardNav businessName="Coastal Cuts Barbershop" />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-tobacco">Dashboard</h1>
          <p className="mt-1 text-sm text-tobacco-light">Here&apos;s how your reputation is performing.</p>
        </div>
        <StatCards />
        <RecentReviews />
        <SendReviewRequest />
      </main>
    </div>
  );
}
