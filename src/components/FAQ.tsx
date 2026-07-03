const faqs = [
  {
    q: "Who is Vynta for?",
    a: "Vynta is built for any local business that runs on reputation — restaurants, salons, contractors, auto shops, gyms, clinics, and more. If Google reviews affect whether customers choose you, Vynta is for you.",
  },
  {
    q: "How does Vynta help me get more reviews?",
    a: "Vynta's Growth tab shows you exactly how many 5-star reviews you need to hit your target rating and generates ready-to-use ask scripts tailored to your business — so you know what to say and customers actually leave reviews.",
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
    a: "Yes. Monthly plans can be cancelled anytime with no penalty. Annual plans are billed upfront and are non-refundable, but you keep access until the end of your billing period.",
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
