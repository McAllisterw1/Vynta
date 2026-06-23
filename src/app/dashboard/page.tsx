import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata = {
  title: "Dashboard — Vynta",
};

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const plan = (user.publicMetadata?.plan as string | undefined) ?? null;
  const subscriptionStatus = (user.publicMetadata?.subscriptionStatus as string | undefined) ?? null;
  const subscriptionId = (user.publicMetadata?.subscriptionId as string | undefined) ?? null;
  const trialEnd = (user.publicMetadata?.trialEnd as number | undefined) ?? null;
  const paymentFailed = (user.publicMetadata?.paymentFailed as boolean | undefined) ?? false;
  const userName = user.firstName ?? user.emailAddresses[0]?.emailAddress.split("@")[0] ?? "there";
  const firstName = user.firstName ?? "";
  const email = user.emailAddresses[0]?.emailAddress ?? "";

  return (
    <DashboardShell
      userName={userName}
      plan={plan}
      subscriptionStatus={subscriptionStatus}
      subscriptionId={subscriptionId}
      trialEnd={trialEnd}
      paymentFailed={paymentFailed}
      firstName={firstName}
      email={email}
    />
  );
}
