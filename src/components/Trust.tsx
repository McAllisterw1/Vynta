const industries = [
  "Restaurants",
  "Salons & Spas",
  "Contractors",
  "Auto Shops",
  "Gyms & Studios",
  "Clinics & Dental",
  "Pet Services",
  "Law Offices",
  "Retail Shops",
  "and more",
];

export default function Trust() {
  return (
    <section className="bg-cream-warm py-24">
      <div className="mx-auto max-w-6xl px-6">

        <div className="flex flex-col items-center text-center mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-10 bg-teal" />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-teal">Who It's For</span>
            <div className="h-px w-10 bg-teal" />
          </div>
          <h2 className="font-display text-3xl font-bold text-tobacco md:text-4xl">
            Built for any business that runs on reputation
          </h2>
          <p className="mt-3 max-w-lg text-tobacco-light text-sm leading-relaxed">
            If your business runs on reputation and local trust, Vynta is built for you.
          </p>
        </div>

        {/* Industry badges */}
        <div className="flex flex-wrap justify-center gap-3">
          {industries.map((industry) => (
            <span
              key={industry}
              className="rounded-sm border border-cream-border bg-cream px-5 py-2.5 text-sm font-medium text-tobacco-mid shadow-sm"
            >
              {industry}
            </span>
          ))}
        </div>

        {/* Bottom CTA strip */}
        <div className="mt-14 rounded-sm bg-tobacco px-10 py-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-sand/40" />
              <div className="h-1 w-1 rotate-45 bg-sand/60" />
              <div className="h-px w-8 bg-sand/40" />
            </div>
            <p
              className="font-display text-2xl font-semibold leading-snug max-w-xl md:text-3xl"
              style={{
                fontStyle: "italic",
                background: "linear-gradient(135deg, #2D9B8A 0%, #4F46E5 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              &ldquo;Your next customer is reading your reviews right now.&rdquo;
            </p>
          </div>
          <a
            href="/sign-up"
            className="shrink-0 self-start md:self-auto rounded-sm bg-teal px-7 py-3 text-sm font-medium text-cream transition-colors hover:bg-teal-dark"
          >
            Start Getting More Reviews
          </a>
        </div>

      </div>
    </section>
  );
}
