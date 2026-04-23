const stats = [
  { value: "1.2M+", label: "Reviews Generated" },
  { value: "+0.8 ★", label: "Avg. Rating Lift" },
  { value: "< 2 min", label: "AI Response Time" },
];

export default function Hero() {
  return (
    <section className="bg-cream pt-20">
      <div className="mx-auto w-full max-w-6xl px-6 pt-16 pb-20">

        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px w-10 bg-teal" />
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-teal">
            Reputation Management
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display font-bold text-tobacco leading-[1.08] tracking-tight max-w-3xl mb-8"
            style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)" }}>
          More 5-Star Reviews.{" "}
          <em style={{ fontStyle: "italic" }}>On Autopilot.</em>
        </h1>

        {/* Explainer box */}
        <div className="mb-10 max-w-xl rounded-sm border border-cream-border bg-sand-pale px-6 py-5">
          <p className="text-sm leading-relaxed text-tobacco-mid">
            <span className="font-semibold text-tobacco">What is reputation management?</span>{" "}
            It means automatically asking your customers for reviews, responding to every
            review with AI, and tracking your rating across Google, Yelp, and Facebook —
            all from one simple dashboard.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-6">
          <a
            href="/dashboard"
            className="rounded bg-teal px-8 py-3.5 text-sm font-medium text-cream transition-colors hover:bg-teal-dark"
          >
            Start Your Free Trial
          </a>
          <a
            href="#features"
            className="group flex items-center gap-2 text-sm font-medium text-tobacco-mid border-b border-tobacco-light pb-px transition-colors hover:border-tobacco hover:text-tobacco"
          >
            See how it works
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5">
              <path fillRule="evenodd" d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z" clipRule="evenodd" />
            </svg>
          </a>
        </div>

        {/* Stats row */}
        <div className="mt-14 pt-10 border-t border-cream-border flex flex-wrap gap-10">
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-10">
              <div>
                <div className="font-display text-3xl font-semibold text-tobacco">{stat.value}</div>
                <div className="mt-0.5 text-sm text-tobacco-light">{stat.label}</div>
              </div>
              {i < stats.length - 1 && (
                <div className="h-10 w-px bg-cream-border" />
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
