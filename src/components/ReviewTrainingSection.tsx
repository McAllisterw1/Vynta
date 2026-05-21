const points = [
  {
    emoji: "📈",
    title: "Learn How Google Works",
    description:
      "Our built-in training breaks down exactly how Google ranks local businesses, what signals it looks for, and why your competitor shows up before you.",
  },
  {
    emoji: "🧠",
    title: "Trained for Your Business",
    description:
      "Answer 3 questions and get a personalized training experience written specifically for your business type, your review count, and your competitive situation.",
  },
  {
    emoji: "🤖",
    title: "AI That Actually Teaches",
    description:
      "Powered by Claude AI, your Review Training adapts to your situation and speaks to you like a coach — not a textbook.",
  },
];

export default function ReviewTrainingSection() {
  return (
    <section className="bg-cream py-28">
      <div className="mx-auto max-w-6xl px-6">

        {/* Header */}
        <div className="mb-16 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-10 bg-teal" />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-teal">
              Review Training
            </span>
          </div>
          <h2
            className="font-display text-4xl font-bold text-tobacco leading-tight mb-4 md:text-5xl"
          >
            We don&apos;t just manage your reputation.{" "}
            <em style={{
              fontStyle: "italic",
              background: "linear-gradient(135deg, #2D9B8A 0%, #4F46E5 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>We teach you how to own it.</em>
          </h2>
          <p className="text-tobacco-light leading-relaxed max-w-xl">
            Most business owners have no idea how Google actually decides who shows up
            first. Vynta does — and we built that knowledge directly into your dashboard.
          </p>
        </div>

        {/* Feature points */}
        <div className="grid gap-6 sm:grid-cols-3 mb-12">
          {points.map((point) => (
            <div
              key={point.title}
              className="group rounded-sm border border-cream-border bg-sand-pale p-8 transition-shadow hover:shadow-md"
            >
              <div className="mb-5 text-3xl leading-none">{point.emoji}</div>
              <h3 className="font-display text-xl font-semibold text-tobacco mb-3">
                {point.title}
              </h3>
              <p className="text-sm text-tobacco-light leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>

        {/* Callout line */}
        <p className="text-center text-sm text-tobacco-mid">
          5 modules. Plain English. Built for busy owners who don&apos;t have time to figure
          this out alone.
        </p>

      </div>
    </section>
  );
}
