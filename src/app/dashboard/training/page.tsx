import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/dashboard/DashboardNav";
import ReviewTraining from "@/components/dashboard/ReviewTraining";
import TrainingConsultant from "@/components/dashboard/TrainingConsultant";
import { canAccess } from "@/lib/plans";

export const metadata = {
  title: "Training Academy — Vynta",
};

export default async function TrainingPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const plan = (user.publicMetadata?.plan as string | undefined) ?? null;
  const subscriptionStatus = (user.publicMetadata?.subscriptionStatus as string | undefined) ?? null;
  const userName = user.firstName ?? user.emailAddresses[0]?.emailAddress.split("@")[0] ?? "there";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#FAF5E8", overflow: "hidden" }}>
      <DashboardNav userName={userName} plan={plan} subscriptionStatus={subscriptionStatus} />

      {canAccess(plan, "reviewTraining") ? (
        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
          {/* Left — scrollable modules */}
          <div style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
            <ReviewTraining />
          </div>

          {/* Right — sticky coach rail */}
          <div className="coach-panel" style={{
            width: "360px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "#120804",
            borderLeft: "1px solid rgba(45,155,138,0.12)",
          }}>
            <TrainingConsultant />
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{
            background: "#E8DCC8", borderRadius: "20px", padding: "48px 32px",
            textAlign: "center", boxShadow: "0 2px 12px rgba(44,26,14,0.08)", maxWidth: "420px", width: "100%",
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🔒</div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2C1A0E", marginBottom: "8px" }}>
              Training Academy is on Pro and Agency plans
            </h2>
            <p style={{ fontSize: "13px", color: "#A0856A", marginBottom: "24px", lineHeight: 1.6 }}>
              Unlock 7 AI-personalized training modules and your live coaching session.
            </p>
            <a href="/#pricing" style={{
              display: "inline-block", background: "#2D9B8A", color: "white",
              borderRadius: "12px", padding: "12px 28px", fontSize: "14px", fontWeight: 600, textDecoration: "none",
            }}>
              Upgrade to Pro
            </a>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) { .coach-panel { display: none !important; } }
      `}</style>
    </div>
  );
}
