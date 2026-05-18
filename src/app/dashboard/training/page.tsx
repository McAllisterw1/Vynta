import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/dashboard/DashboardNav";
import ReviewTraining from "@/components/dashboard/ReviewTraining";
import TrainingConsultant from "@/components/dashboard/TrainingConsultant";
import { canAccess } from "@/lib/plans";

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
          Back to Dashboard
        </a>
        {canAccess(plan, "reviewTraining") ? (
          <>
            <ReviewTraining />
            <TrainingConsultant />
          </>
        ) : (
          <div style={{
            background: "#E8DCC8",
            borderRadius: "20px",
            padding: "48px 32px",
            textAlign: "center",
            boxShadow: "0 2px 12px rgba(44,26,14,0.08)",
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🔒</div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "8px" }}>
              Review Training is available on Pro and Agency plans
            </h2>
            <p style={{ fontSize: "13px", color: "#A0856A", marginBottom: "24px", lineHeight: 1.6 }}>
              Upgrade to unlock 5 modules of personalised, AI-powered training<br />on how to grow your Google reputation.
            </p>
            <a
              href="/#pricing"
              style={{
                display: "inline-block",
                background: "#2D9B8A",
                color: "white",
                borderRadius: "12px",
                padding: "12px 28px",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Upgrade to Pro
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
