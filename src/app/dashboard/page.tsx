import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/dashboard/DashboardNav";
import PlanBanner from "@/components/dashboard/PlanBanner";
import StatCards from "@/components/dashboard/StatCards";
import RecentReviews from "@/components/dashboard/RecentReviews";
import SendReviewRequest from "@/components/dashboard/SendReviewRequest";
import AIReviewResponder from "@/components/dashboard/AIReviewResponder";

export const metadata = {
  title: "Dashboard — Vynta",
};

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const plan = (user.publicMetadata?.plan as string | undefined) ?? null;
  const subscriptionStatus = (user.publicMetadata?.subscriptionStatus as string | undefined) ?? null;
  const userName = user.firstName ?? user.emailAddresses[0]?.emailAddress.split("@")[0] ?? "there";

  return (
    <div className="min-h-screen bg-cream">
      <DashboardNav userName={userName} plan={plan} subscriptionStatus={subscriptionStatus} />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-tobacco">Dashboard</h1>
          <p className="mt-1 text-sm text-tobacco-light">Here&apos;s how your reputation is performing.</p>
        </div>
        <PlanBanner plan={plan} subscriptionStatus={subscriptionStatus} />
        <StatCards />
        <RecentReviews />
        <AIReviewResponder />
        <SendReviewRequest plan={plan} />
      </main>
    </div>
  );
}
