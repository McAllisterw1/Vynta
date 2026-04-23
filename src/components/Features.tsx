const features = [
  {
    number: "01",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
      </svg>
    ),
    title: "Review Automation",
    description:
      "Send review requests at exactly the right moment — right after a completed service. Smart SMS and email sequences with personalized messaging lift response rates by up to 3×.",
    highlights: ["SMS & email sequences", "Smart send-time optimization", "Google & Yelp direct links"],
  },
  {
    number: "02",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
    title: "AI Responses",
    description:
      "Never leave a review unanswered. Vynta drafts on-brand, personalized responses to every review in seconds. Approve with one click — or let it post the 5-star replies automatically.",
    highlights: ["Tone-matched to your brand", "One-click approve or edit", "Auto-post for 4–5 star reviews"],
  },
  {
    number: "03",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: "Dashboard Analytics",
    description:
      "Your complete reputation picture in one place. Track star ratings, review velocity, sentiment trends, and competitor benchmarks across 50+ platforms at a glance.",
    highlights: ["50+ platform monitoring", "Sentiment trend analysis", "Competitor benchmarking"],
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-cream-warm py-28">
      <div className="mx-auto max-w-6xl px-6">

        {/* Section header */}
        <div className="mb-16 flex flex-col gap-3 max-w-xl">
          <div className="flex items-center gap-3">
            <div className="h-px w-10 bg-teal" />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-teal">Features</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-tobacco leading-tight md:text-5xl">
            Everything you need to{" "}
            <em style={{ fontStyle: "italic" }}>own</em> your reputation
          </h2>
          <p className="text-tobacco-light leading-relaxed">
            One platform to collect, respond, and analyze — no juggling five tools.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative bg-cream rounded-sm border border-cream-border p-8 transition-shadow hover:shadow-md"
            >
              {/* Feature number — decorative background */}
              <span
                className="absolute top-6 right-6 font-display text-6xl font-bold text-cream-warm select-none leading-none"
                aria-hidden="true"
              >
                {feature.number}
              </span>

              {/* Icon */}
              <div className="mb-6 inline-flex rounded-sm bg-sand-pale p-3 text-teal">
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="font-display text-xl font-semibold text-tobacco mb-3">{feature.title}</h3>

              {/* Description */}
              <p className="text-sm text-tobacco-light leading-relaxed mb-6">{feature.description}</p>

              {/* Divider */}
              <div className="h-px w-full bg-cream-border mb-5" />

              {/* Highlights */}
              <ul className="space-y-2.5">
                {feature.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-center gap-2.5">
                    <div className="h-1 w-1 rounded-full bg-teal shrink-0" />
                    <span className="text-sm text-tobacco-mid">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
