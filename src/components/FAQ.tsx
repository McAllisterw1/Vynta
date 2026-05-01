const faqs = [
  {
    q: "Who is Vynta for?",
    a: "Vynta is built for home service businesses like HVAC, plumbing, roofing, electrical, landscaping, and similar local service companies.",
  },
  {
    q: "How does Vynta help me get more reviews?",
    a: "Vynta automates review requests after completed jobs, making it easier to turn happy customers into public 5-star reviews.",
  },
  {
    q: "Can I respond to bad reviews?",
    a: "Yes. Vynta helps generate professional, calm responses to negative reviews so you can protect your reputation.",
  },
  {
    q: "Do I need a big team to use this?",
    a: "No. Vynta is simple enough for owners, office managers, or small teams to use.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Vynta is month-to-month with no long-term contract.",
  },
];

export default function FAQ() {
  return (
    <section className="bg-cream py-28">
      <div className="mx-auto max-w-6xl px-6">

        <div className="grid gap-16 md:grid-cols-[1fr_2fr]">

          {/* Left: heading */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-10 bg-teal" />
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-teal">FAQ</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-tobacco leading-tight md:text-4xl">
              Common questions
            </h2>
            <p className="mt-4 text-sm text-tobacco-light leading-relaxed">
              Still have questions?{" "}
              <a href="mailto:hello@vynta.com" className="text-teal hover:text-teal-dark border-b border-teal/40 pb-px">
                Get in touch.
              </a>
            </p>
          </div>

          {/* Right: Q&A list */}
          <div className="flex flex-col divide-y divide-cream-border">
            {faqs.map((faq) => (
              <div key={faq.q} className="py-7">
                <p className="font-display text-base font-semibold text-tobacco mb-2">{faq.q}</p>
                <p className="text-sm text-tobacco-light leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
