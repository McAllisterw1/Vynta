const stats = [
  { value: "1.2M+", label: "Reviews Generated" },
  { value: "+0.8 ★", label: "Avg. Rating Lift" },
  { value: "< 2 min", label: "AI Response Time" },
];

const Stars = () => (
  <span className="text-sand tracking-tight" style={{ fontSize: "13px", letterSpacing: "1px" }}>★★★★★</span>
);

const reviews = [
  {
    text: "AC went out on a Friday night in July. They had someone here by 10am Saturday. Fair price, no upsell. Rare these days.",
    author: "Kevin L.",
    platform: "Google",
    delay: "0s",
    duration: "6s",
    position: "top-4 right-0",
    width: "w-64",
  },
  {
    text: "Been coming to Marcus since 2019. He remembers exactly how I like my fade every single time. Wouldn't go anywhere else.",
    author: "Jordan T.",
    platform: "Yelp",
    delay: "1.8s",
    duration: "5.5s",
    position: "top-[210px] right-14",
    width: "w-60",
  },
  {
    text: "Sat at the bar on a Tuesday. Owner came out to check on us twice. The rigatoni was unreal. Already booked for next month.",
    author: "Diane F.",
    platform: "Google",
    delay: "0.9s",
    duration: "7s",
    position: "top-[390px] right-2",
    width: "w-62",
  },
];

export default function Hero() {
  return (
    <section className="bg-cream pt-20 overflow-hidden">
      <div className="mx-auto w-full max-w-6xl px-6 pt-4 pb-20">
        <div className="flex items-start gap-8">

          {/* Left: text content */}
          <div className="flex-1 min-w-0">

            {/* Quote */}
            <p className="font-display italic text-tobacco-mid text-base mb-8 tracking-wide">
              "Nothing kills a business faster than a bad reputation."
            </p>

            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-10 bg-teal" />
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-teal">
                Reputation Management
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-display font-bold text-tobacco leading-[1.08] tracking-tight max-w-3xl mb-8"
              style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)" }}
            >
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

          {/* Right: floating review cards */}
          <div
            className="hidden xl:block shrink-0 w-[380px] relative h-[540px]"
            aria-hidden="true"
          >
            {/* Faded wave background decoration */}
            <svg
              viewBox="0 0 62 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] opacity-[0.07] text-sand-dark"
              style={{ animation: "float-slow 9s ease-in-out infinite" }}
            >
              <path
                d="M0 9.5 C2 9.5 3 3 5 3 C7 3 9 16 11 16 C13 16 15 3 17 3 C19 3 21 16 23 16 C25 16 27 3 29 3 C31 3 33 16 35 16 C37 16 39 3 41 3 C43 3 45 16 47 16 C49 16 51 3 53 3 C55 3 57 9.5 62 9.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="5"  cy="3" r="2" fill="currentColor" />
              <circle cx="17" cy="3" r="2" fill="currentColor" />
              <circle cx="29" cy="3" r="2" fill="currentColor" />
              <circle cx="41" cy="3" r="2" fill="currentColor" />
              <circle cx="53" cy="3" r="2" fill="currentColor" />
            </svg>

            {/* Floating review cards */}
            {reviews.map((r) => (
              <div
                key={r.author}
                className={`absolute ${r.position} ${r.width} bg-cream rounded-2xl border border-cream-border shadow-md px-4 py-3.5`}
                style={{
                  animation: `float ${r.duration} ease-in-out infinite`,
                  animationDelay: r.delay,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <Stars />
                  <span className="text-[10px] font-medium uppercase tracking-widest text-tobacco-light/70 bg-sand-pale px-2 py-0.5 rounded-full">
                    {r.platform}
                  </span>
                </div>
                <p className="text-sm text-tobacco leading-snug mb-2.5">"{r.text}"</p>
                <p className="text-xs text-tobacco-light">— {r.author}</p>
              </div>
            ))}

            {/* Floating new-review badge */}
            <div
              className="absolute top-[170px] left-0 flex items-center gap-2 bg-teal text-cream rounded-full pl-2.5 pr-3.5 py-1.5 text-xs font-medium shadow-md"
              style={{ animation: "float 5s ease-in-out infinite", animationDelay: "2.4s" }}
            >
              <span className="text-[11px]">⭐</span>
              <span>12 new reviews this month</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
