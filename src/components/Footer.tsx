const links = ["Features", "Pricing", "Blog", "Privacy", "Terms"];

export default function Footer() {
  return (
    <footer className="bg-tobacco border-t border-tobacco-mid py-12">
      <div className="mx-auto max-w-6xl px-6">

        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-tobacco-mid">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-sand">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            </div>
            <span className="font-display text-base font-semibold text-cream tracking-tight">Vynta</span>
          </div>

          {/* Nav */}
          <nav className="flex flex-wrap justify-center gap-6">
            {links.map((link) => (
              <a key={link} href="#" className="text-sm text-sand-light/50 transition-colors hover:text-sand-light">
                {link}
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
