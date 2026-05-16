import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/dashboard/DashboardNav";
import ReviewTraining from "@/components/dashboard/ReviewTraining";

export const metadata = {
  title: "Review Training — Vynta",
};

export default async function TrainingPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const plan = (user.publicMetadata?.plan as string | undefined) ?? null;
  const subscriptionStatus = (user.publicMetadata?.subscriptionStatus as string | undefined) ?? null;
  const userName = user.firstName ?? user.emailAddresses[0]?.emailAddress.split("@")[0] ?? "there";

  return (
    <div className="min-h-screen bg-cream">
      <DashboardNav userName={userName} plan={plan} subscriptionStatus={subscriptionStatus} />
      <main className="mx-auto max-w-lg px-6 py-10">
        <a
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "#A0856A",
            textDecoration: "none",
            marginBottom: "20px",
          }}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: "12px", height: "12px" }}>
            <path fillRule="evenodd" d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 1.06L4.81 7.5H13a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z" />
          </svg>
          Back to Goals
        </a>
        <ReviewTraining />
      </main>
    </div>
  );
}
