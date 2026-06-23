import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/dashboard/DashboardNav";
import SettingsPanel from "@/components/dashboard/SettingsPanel";

export const metadata = {
  title: "Settings — Vynta",
};

export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const plan = (user.publicMetadata?.plan as string | undefined) ?? null;
  const subscriptionStatus = (user.publicMetadata?.subscriptionStatus as string | undefined) ?? null;
  const subscriptionId = (user.publicMetadata?.subscriptionId as string | undefined) ?? null;
  const userName = user.firstName ?? user.emailAddresses[0]?.emailAddress.split("@")[0] ?? "there";
  const email = user.emailAddresses[0]?.emailAddress ?? "";

  return (
    <div className="min-h-screen bg-cream">
      <DashboardNav userName={userName} plan={plan} subscriptionStatus={subscriptionStatus} />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <SettingsPanel
          name={user.firstName ?? ""}
          email={email}
          plan={plan}
          subscriptionStatus={subscriptionStatus}
          subscriptionId={subscriptionId}
        />
      </main>
    </div>
  );
}
