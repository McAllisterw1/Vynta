const links = [
  { label: "Features", href: "/#features" },
  { label: "Pricing",  href: "/#pricing" },
  { label: "Blog",     href: "#" },
  { label: "Privacy",  href: "/privacy" },
  { label: "Terms",    href: "/terms" },
];

export default function Footer() {
  return (
    <footer className="bg-tobacco border-t border-tobacco-mid py-12">
      <div className="mx-auto max-w-6xl px-6">

        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">

          {/* Brand */}
          <div className="flex items-center gap-2.5">
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
            <span className="font-display text-base font-semibold text-cream tracking-tight">Vynta</span>
          </div>

          {/* Nav */}
          <nav className="flex flex-wrap justify-center gap-6">
            {links.map((link) => (
              <a key={link.label} href={link.href} className="text-sm text-sand-light/50 transition-colors hover:text-sand-light">
                {link.label}
              </a>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-sm text-sand-light/30">
            © {new Date().getFullYear()} Vynta
          </p>

        </div>

      </div>
    </footer>
  );
}
