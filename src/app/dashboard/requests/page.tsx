import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/dashboard/DashboardNav";
import RequestCampaign from "@/components/dashboard/RequestCampaign";

export const metadata = {
  title: "Review Requests — Vynta",
};

export default async function RequestsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const plan = (user.publicMetadata?.plan as string | undefined) ?? null;
  const subscriptionStatus = (user.publicMetadata?.subscriptionStatus as string | undefined) ?? null;
  const userName = user.firstName ?? user.emailAddresses[0]?.emailAddress.split("@")[0] ?? "there";

  return (
    <div className="min-h-screen bg-cream">
      <DashboardNav userName={userName} plan={plan} subscriptionStatus={subscriptionStatus} />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <RequestCampaign />
      </main>
    </div>
  );
}
