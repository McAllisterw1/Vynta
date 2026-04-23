const steps = [
  {
    number: "01",
    title: "Set Your Style",
    description:
      "Choose the tone — warm and conversational, sharp and professional, or anything in between. Write the questions you want customers to answer and let your brand's personality come through.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Customer Responds",
    description:
      "Your customer receives a friendly, on-brand prompt asking a few simple questions about their experience. No writing required — just honest answers in their own words.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "AI Crafts the Review",
    description:
      "Vynta's AI takes their answers and writes a unique, human-sounding review in the customer's voice — ready to post to Google, Yelp, or Facebook in a single tap.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
  },
];

export default function CustomReviews() {
  return (
    <section className="bg-cream py-28">
      <div className="mx-auto max-w-6xl px-6">

        {/* Header */}
        <div className="mb-14 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-10 bg-teal" />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-teal">
              Custom Review Experience
            </span>
          </div>
          <h2 className="font-display text-4xl font-bold text-tobacco leading-tight mb-4 md:text-5xl">
            Build Reviews{" "}
            <em style={{ fontStyle: "italic" }}>Your Way</em>
          </h2>
          <p className="text-tobacco-light leading-relaxed">
            Unlike boring automated blasts, Vynta puts you in control. Choose the tone,
            write the questions, and set the personality. Your customers simply respond —
            and our AI turns their honest words into something genuinely worth reading.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-5 md:grid-cols-3 mb-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative bg-sand-pale border border-cream-border rounded-sm p-7 overflow-hidden"
            >
              {/* Ghost number */}
              <span
                className="absolute -bottom-3 -right-1 font-display text-8xl font-bold text-cream-border select-none leading-none pointer-events-none"
                aria-hidden="true"
              >
                {step.number}
              </span>

              {/* Icon badge */}
              <div className="mb-5 inline-flex items-center justify-center rounded-sm bg-cream border border-cream-border p-2.5 text-teal">
                {step.icon}
              </div>

              {/* Step label */}
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-sand-dark mb-2">
                Step {step.number}
              </p>

              {/* Title */}
              <h3 className="font-display text-lg font-semibold text-tobacco mb-3">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-tobacco-light leading-relaxed relative z-10">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Tagline card */}
        <div className="rounded-sm bg-tobacco px-10 py-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4">
            {/* Ornament */}
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-sand/40" />
              <div className="h-1 w-1 rotate-45 bg-sand/60" />
              <div className="h-px w-8 bg-sand/40" />
            </div>
            <blockquote className="font-display text-2xl font-semibold leading-snug text-cream md:text-3xl max-w-xl"
                        style={{ fontStyle: "italic" }}>
              "No more copy-paste reviews. Every review sounds real because it is."
            </blockquote>
          </div>

          <a
            href="#pricing"
            className="shrink-0 self-start md:self-auto rounded-sm bg-teal px-7 py-3 text-sm font-medium text-cream transition-colors hover:bg-teal-dark"
          >
            Start Free Trial
          </a>
        </div>

      </div>
    </section>
  );
}
