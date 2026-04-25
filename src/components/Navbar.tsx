import { auth } from "@clerk/nextjs/server";

export default async function Navbar() {
  const { userId } = await auth();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cream border-b border-cream-border shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5">
          {/* Wave mark: 5-peak wave with dots at each peak */}
          <svg viewBox="0 0 62 19" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-auto">
            <path
              d="M0 9.5 C2 9.5 3 3 5 3 C7 3 9 16 11 16 C13 16 15 3 17 3 C19 3 21 16 23 16 C25 16 27 3 29 3 C31 3 33 16 35 16 C37 16 39 3 41 3 C43 3 45 16 47 16 C49 16 51 3 53 3 C55 3 57 9.5 62 9.5"
              stroke="#C4874A"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="5"  cy="3" r="2" fill="#C4874A" />
            <circle cx="17" cy="3" r="2" fill="#C4874A" />
            <circle cx="29" cy="3" r="2" fill="#C4874A" />
            <circle cx="41" cy="3" r="2" fill="#C4874A" />
            <circle cx="53" cy="3" r="2" fill="#C4874A" />
          </svg>
          {/* Wordmark */}
          <span
            className="font-display font-bold text-sm uppercase"
            style={{ color: "#2C1A0E", letterSpacing: "0.12em" }}
          >
            Vynta
          </span>
        </a>

        {/* Nav links */}
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-tobacco-light transition-colors hover:text-tobacco">
            Features
          </a>
          <a href="#pricing" className="text-sm text-tobacco-light transition-colors hover:text-tobacco">
            Pricing
          </a>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          {userId ? (
            <a
              href="/dashboard"
              className="rounded bg-teal px-5 py-2 text-sm font-medium text-cream transition-colors hover:bg-teal-dark"
            >
              Go to Dashboard
            </a>
          ) : (
            <>
              <a
                href="/sign-in"
                className="rounded border border-cream-border px-5 py-2 text-sm font-medium text-tobacco-light transition-colors hover:border-tobacco-light hover:text-tobacco"
              >
                Sign In
              </a>
              <a
                href="/sign-up"
                className="rounded bg-teal px-5 py-2 text-sm font-medium text-cream transition-colors hover:bg-teal-dark"
              >
                Start Free Trial
              </a>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
