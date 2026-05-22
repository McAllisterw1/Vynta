import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

const WaveMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 62 19" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M0 9.5 C2 9.5 3 3 5 3 C7 3 9 16 11 16 C13 16 15 3 17 3 C19 3 21 16 23 16 C25 16 27 3 29 3 C31 3 33 16 35 16 C37 16 39 3 41 3 C43 3 45 16 47 16 C49 16 51 3 53 3 C55 3 57 9.5 62 9.5"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    />
    <circle cx="5"  cy="3" r="2" fill="currentColor" />
    <circle cx="17" cy="3" r="2" fill="currentColor" />
    <circle cx="29" cy="3" r="2" fill="currentColor" />
    <circle cx="41" cy="3" r="2" fill="currentColor" />
    <circle cx="53" cy="3" r="2" fill="currentColor" />
  </svg>
);

const clerkAppearance = {
  variables: {
    colorPrimary: "#2B7A70",
    colorBackground: "#FAF7F2",
    colorText: "#1A0C05",
    colorTextSecondary: "#8B5A38",
    colorInputBackground: "#FFFFFF",
    colorInputText: "#1A0C05",
    colorNeutral: "#1A0C05",
    borderRadius: "8px",
    fontFamily: "inherit",
    fontSize: "14px",
  },
  elements: {
    rootBox: "w-full",
    card: "shadow-none bg-transparent p-0 gap-5",
    header: "hidden",
    socialButtonsBlockButton:
      "border border-cream-border bg-white text-tobacco hover:bg-sand-pale transition-colors rounded-lg text-sm font-medium h-10",
    socialButtonsBlockButtonText: "font-medium text-tobacco",
    dividerLine: "bg-cream-border",
    dividerText: "text-tobacco-light text-xs",
    formFieldLabel: "text-xs font-semibold tracking-wide text-tobacco-mid uppercase mb-1",
    formFieldInput:
      "border border-cream-border bg-white text-tobacco placeholder:text-tobacco-light/40 rounded-lg focus:border-teal focus:ring-1 focus:ring-teal/20 transition-colors text-sm h-10 px-3",
    formButtonPrimary:
      "bg-teal hover:bg-teal-dark text-cream rounded-lg text-sm font-semibold transition-colors shadow-none h-10",
    footerActionText: "text-tobacco-light text-sm",
    footerActionLink: "text-teal hover:text-teal-dark font-semibold",
    footer: "bg-transparent",
    identityPreviewText: "text-tobacco",
    identityPreviewEditButton: "text-teal",
    formFieldWarningText: "text-sand-dark text-xs",
    formFieldErrorText: "text-red-600 text-xs",
    alertText: "text-tobacco text-sm",
    internal: "hidden",
  },
};

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">

      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[44%] bg-tobacco flex-col justify-between p-14">
        <Link href="/" className="flex items-center gap-2.5 text-sand">
          <WaveMark className="h-5 w-auto" />
          <span className="font-display font-bold text-sm uppercase" style={{ letterSpacing: "0.12em" }}>
            Vynta
          </span>
        </Link>

        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-8 bg-sand opacity-60" />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-sand/70">
              Reputation Management
            </span>
          </div>
          <p className="font-display text-[2.1rem] font-bold text-cream leading-[1.2] max-w-xs">
            Welcome to the mission control room of{" "}
            <em style={{
              fontStyle: "italic",
              background: "linear-gradient(135deg, #2D9B8A 0%, #4F46E5 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>your online business reputation.</em>
          </p>
          <p className="mt-5 text-sm text-cream/45 leading-relaxed max-w-[280px]">
            Automate review requests, respond with AI, and track your rating across every platform — all from one dashboard.
          </p>
        </div>

        <div className="border-t border-white/10 pt-8">
          <p className="text-sm text-cream/40 italic leading-relaxed">
            "We went from 3.8 to 4.7 stars on Google in just 6 weeks."
          </p>
          <p className="mt-3 text-xs text-cream/20 uppercase tracking-widest">
            — Coastal Cuts Barbershop
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center items-center bg-cream-warm px-6 py-16">

        {/* Mobile logo */}
        <Link href="/" className="flex lg:hidden items-center gap-2.5 text-sand mb-10">
          <WaveMark className="h-4 w-auto" />
          <span className="font-display font-bold text-sm uppercase text-tobacco" style={{ letterSpacing: "0.12em" }}>
            Vynta
          </span>
        </Link>

        {/* Card */}
        <div className="w-full max-w-[400px] bg-cream rounded-2xl border border-cream-border shadow-sm px-8 py-10">
          <div className="mb-7">
            <h1 className="font-display text-[1.6rem] font-bold text-tobacco leading-tight">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-tobacco-light">
              Sign in to your Vynta account
            </p>
          </div>
          <SignIn appearance={clerkAppearance} />
        </div>

      </div>
    </div>
  );
}
